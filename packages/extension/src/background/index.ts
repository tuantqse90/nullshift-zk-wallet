// ============================================================
// NullShift -- Background Service Worker
// ============================================================
// Central message router and state manager for the extension.
// Uses SDK KeyManager for real BIP-39/BIP-44 key derivation.
// ============================================================

import type { Message, MessageType, ActivityEntry } from '@nullshift/common';
import type { EncryptedVault, OwnedNote, Bytes32, Address } from '@nullshift/common';
import { AUTO_LOCK_TIMEOUT_MS, NETWORKS, ETH_ADDRESS } from '@nullshift/common';
import { KeyManager, SHIELDED_POOL_ABI, computeCommitment, computeNullifier, randomFieldElement, initBarretenberg } from '@nullshift/sdk';
import { ethers } from 'ethers';

// ---- State ----
let autoLockTimer: ReturnType<typeof setTimeout> | null = null;
const keyManager = new KeyManager();
const notes: OwnedNote[] = [];
const activityLog: ActivityEntry[] = [];
let notesEncryptionKey: CryptoKey | null = null;

// ---- Storage Keys ----
const VAULT_KEY = 'nullshift_vault';
const NETWORK_KEY = 'nullshift_network';
const NOTES_KEY = 'nullshift_notes';
const CONTRACTS_KEY = 'nullshift_contracts';

// ---- Privileged message types (must come from extension UI, not content scripts) ----
const PRIVILEGED_TYPES: Set<string> = new Set([
  'CREATE_WALLET', 'UNLOCK_WALLET', 'LOCK_WALLET',
  'SEND_SHIELDED', 'SHIELD_FUNDS', 'UNSHIELD_FUNDS',
  'GET_WALLET_STATUS', 'GET_BALANCE', 'GET_SHIELDED_BALANCE',
  'GET_PUBLIC_BALANCE', 'GET_NOTES', 'SYNC_NOTES', 'SYNC_TREE',
  'GET_NETWORK', 'SWITCH_NETWORK', 'GET_SETTINGS', 'UPDATE_SETTINGS',
]);

/** Check if sender is an extension page (popup, dashboard, sidepanel, offscreen) vs content script */
function isExtensionOrigin(sender: chrome.runtime.MessageSender): boolean {
  return !!sender.url?.startsWith(`chrome-extension://${chrome.runtime.id}`);
}

// ---- Provider Management ----
let cachedProvider: ethers.JsonRpcProvider | null = null;
let cachedRpcUrl: string | null = null;

async function getProvider(): Promise<ethers.JsonRpcProvider> {
  const netStored = await chrome.storage.local.get(NETWORK_KEY);
  const network = netStored[NETWORK_KEY] ?? { chainId: 143, name: 'Monad' };

  // Check for custom contract addresses (local dev)
  const contractsStored = await chrome.storage.local.get(CONTRACTS_KEY);
  const rpcUrl = contractsStored[CONTRACTS_KEY]?.rpcUrl
    ?? NETWORKS[network.chainId as keyof typeof NETWORKS]?.rpcUrl
    ?? 'https://rpc.sepolia.org';

  if (cachedProvider && cachedRpcUrl === rpcUrl) return cachedProvider;

  cachedProvider = new ethers.JsonRpcProvider(rpcUrl);
  cachedRpcUrl = rpcUrl;
  return cachedProvider;
}

// ---- Message Router ----
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (PRIVILEGED_TYPES.has(message.type) && !isExtensionOrigin(sender)) {
    sendResponse({ error: 'Unauthorized: privileged operation from untrusted context' });
    return true;
  }

  // Use generic error for untrusted contexts (dApp requests via content script)
  const isTrusted = isExtensionOrigin(sender);
  handleMessage(message, sender)
    .then((response) => sendResponse({ payload: response }))
    .catch((error) => sendResponse({
      error: isTrusted ? (error as Error).message : 'Request failed',
    }));
  return true;
});

async function handleMessage(
  message: Message,
  _sender: chrome.runtime.MessageSender,
): Promise<unknown> {
  resetAutoLock();

  switch (message.type as MessageType) {
    // ---- Wallet Lifecycle ----
    case 'CREATE_WALLET': {
      const { password } = message.payload as { password: string };
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Use SDK KeyManager for proper BIP-39/BIP-44 key derivation
      const keys = await keyManager.createWallet(password);

      // Encrypt and store vault
      const vault = await keyManager.encryptVault(keys, password);
      await chrome.storage.local.set({ [VAULT_KEY]: vault });

      // Derive encryption key for notes
      notesEncryptionKey = await deriveNotesKey(password);

      return { address: keys.ethAddress };
    }

    case 'UNLOCK_WALLET': {
      const { password } = message.payload as { password: string };

      const stored = await chrome.storage.local.get(VAULT_KEY);
      const vault = stored[VAULT_KEY] as EncryptedVault;
      if (!vault) throw new Error('No wallet found');

      // Decrypt vault using SDK KeyManager
      const keys = await keyManager.unlock(password, vault);

      // Derive encryption key for notes and load them
      notesEncryptionKey = await deriveNotesKey(password);
      await loadNotes();

      return { success: true, address: keys.ethAddress };
    }

    case 'LOCK_WALLET':
      keyManager.lock();
      notesEncryptionKey = null;
      notes.length = 0;
      return { success: true };

    case 'GET_WALLET_STATUS': {
      const stored = await chrome.storage.local.get(VAULT_KEY);
      const hasWallet = !!stored[VAULT_KEY];
      const locked = !keyManager.isUnlocked();

      return {
        locked,
        hasWallet,
        address: locked ? null : keyManager.getAddress(),
      };
    }

    // ---- Balances ----
    case 'GET_BALANCE': {
      if (!keyManager.isUnlocked()) throw new Error('Wallet is locked');

      const [publicBalance, shieldedBalance] = await Promise.all([
        getPublicBalance(),
        getShieldedBalance(),
      ]);

      const total = publicBalance + shieldedBalance;
      return {
        public: ethers.formatEther(publicBalance),
        shielded: ethers.formatEther(shieldedBalance),
        total: ethers.formatEther(total),
      };
    }

    case 'GET_PUBLIC_BALANCE': {
      if (!keyManager.isUnlocked()) throw new Error('Wallet is locked');
      const balance = await getPublicBalance();
      return { balance: ethers.formatEther(balance) };
    }

    case 'GET_SHIELDED_BALANCE': {
      const balance = await getShieldedBalance();
      return { balance: ethers.formatEther(balance) };
    }

    // ---- Transactions ----
    case 'SEND_SHIELDED': {
      if (!keyManager.isUnlocked()) throw new Error('Wallet is locked');
      const sendPayload = message.payload as { recipientPubkey: string; amount: bigint; token: string };
      const sendAmount = BigInt(sendPayload.amount);

      await initBarretenberg();
      const sKeys = keyManager.getKeys();

      // Select input notes (max 2)
      const unspent = notes.filter((n) => !n.spent && n.amount > 0n);
      if (unspent.length === 0) throw new Error('No unspent notes');

      // Find note(s) covering the amount
      let inputNotes: OwnedNote[];
      const singleNote = unspent.find((n) => n.amount >= sendAmount);
      if (singleNote) {
        inputNotes = [singleNote];
      } else {
        // Try to combine 2 notes
        let found = false;
        inputNotes = [];
        for (let i = 0; i < unspent.length && !found; i++) {
          for (let j = i + 1; j < unspent.length && !found; j++) {
            if (unspent[i]!.amount + unspent[j]!.amount >= sendAmount) {
              inputNotes = [unspent[i]!, unspent[j]!];
              found = true;
            }
          }
        }
        if (!found) throw new Error('Insufficient shielded balance');
      }

      const totalInput = inputNotes.reduce((s, n) => s + n.amount, 0n);
      const change = totalInput - sendAmount;

      // Create output commitment for recipient
      const { derivePublicKey: derivePubS } = await import('@nullshift/sdk');
      const recipientCommitmentSalt = randomFieldElement();
      const recipientCommitment = await computeCommitment(
        sendPayload.recipientPubkey as Bytes32, sendAmount, recipientCommitmentSalt,
      );

      // Create change commitment for sender
      const senderPubkey = await derivePubS(sKeys.spendingKey);
      let changeCommitmentSend: Bytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as Bytes32;
      if (change > 0n) {
        const changeSaltSend = randomFieldElement();
        changeCommitmentSend = await computeCommitment(senderPubkey, change, changeSaltSend) as Bytes32;
      }

      // Get Merkle root
      const sPool = await getPoolContract();
      const sRoot = await sPool.getMerkleRoot() as string;

      // Prepare nullifiers
      const nullifier1 = inputNotes[0]!.nullifier;
      const nullifier2 = inputNotes.length > 1
        ? inputNotes[1]!.nullifier
        : '0x0000000000000000000000000000000000000000000000000000000000000000' as Bytes32;

      // Generate ZK proof via offscreen
      await ensureOffscreen();
      const sendProofResult = await chrome.runtime.sendMessage({
        type: 'GENERATE_PROOF',
        payload: {
          circuit: 'shielded_transfer',
          inputs: {
            root: sRoot,
            nullifier1,
            nullifier2,
            newCommitment1: recipientCommitment,
            newCommitment2: changeCommitmentSend,
            secretKey: sKeys.spendingKey,
            inputNotes: inputNotes.map((n) => ({
              salt: n.salt,
              amount: n.amount.toString(),
              merklePath: n.merklePath,
            })),
          },
        },
      });

      if (sendProofResult?.error) throw new Error(sendProofResult.error);

      // Submit transact transaction
      const sSigner = await getSigner();
      const sPoolSigned = await getPoolContract(sSigner);
      const sTx = await sPoolSigned.transact(
        sendProofResult.proof,
        [nullifier1, nullifier2],
        [recipientCommitment, changeCommitmentSend],
        sRoot,
      );
      const sReceipt = await sTx.wait();

      // Mark input notes as spent
      for (const n of inputNotes) {
        n.spent = true;
      }
      await saveNotes();

      addActivity('SEND', `Sent ${ethers.formatEther(sendAmount)} ETH (shielded)`, sReceipt.hash);

      return { txHash: sReceipt.hash, nullifiers: [nullifier1, nullifier2] };
    }

    case 'SHIELD_FUNDS': {
      if (!keyManager.isUnlocked()) throw new Error('Wallet is locked');
      const depositPayload = message.payload as { amount: bigint; token: string };
      const depositAmount = BigInt(depositPayload.amount);

      // Initialize Barretenberg for crypto ops
      await initBarretenberg();

      const keys = keyManager.getKeys();

      // Derive ZK public key from spending key
      const { derivePublicKey } = await import('@nullshift/sdk');
      const ownerPubkey = await derivePublicKey(keys.spendingKey);

      // Generate random salt and compute commitment
      const salt = randomFieldElement();
      const commitment = await computeCommitment(ownerPubkey, depositAmount, salt);

      // Submit on-chain deposit transaction
      const signer = await getSigner();
      const pool = await getPoolContract(signer);
      const tx = await pool.deposit(commitment, { value: depositAmount });
      const receipt = await tx.wait();

      // Parse leaf index from Deposit event
      let leafIndex = -1;
      for (const log of receipt.logs) {
        try {
          const parsed = pool.interface.parseLog({ topics: log.topics as string[], data: log.data });
          if (parsed?.name === 'Deposit') {
            leafIndex = Number(parsed.args[1]);
          }
        } catch {
          // Not our event
        }
      }

      // Compute nullifier for this note
      const nullifier = await computeNullifier(commitment, keys.spendingKey);

      // Store note locally
      const newNote: OwnedNote = {
        commitment: commitment as Bytes32,
        amount: depositAmount,
        salt: salt as Bytes32,
        ownerPubkey: ownerPubkey as Bytes32,
        leafIndex,
        token: (depositPayload.token || ETH_ADDRESS) as Address,
        spent: false,
        nullifier: nullifier as Bytes32,
        merklePath: { pathIndex: leafIndex, siblings: [] },
      };
      notes.push(newNote);
      await saveNotes();

      addActivity('SHIELD', `Shielded ${ethers.formatEther(depositAmount)} ETH`, receipt.hash);

      return {
        txHash: receipt.hash,
        commitment,
        leafIndex,
      };
    }

    case 'UNSHIELD_FUNDS': {
      if (!keyManager.isUnlocked()) throw new Error('Wallet is locked');
      const withdrawPayload = message.payload as { amount: bigint; recipient: string; token: string };
      const withdrawAmount = BigInt(withdrawPayload.amount);
      const recipient = withdrawPayload.recipient as Address;

      await initBarretenberg();

      const wKeys = keyManager.getKeys();

      // Find a note with sufficient balance
      const unspentNotes = notes.filter((n) => !n.spent && n.amount >= withdrawAmount);
      if (unspentNotes.length === 0) throw new Error('Insufficient shielded balance');
      const spendNote = unspentNotes[0]!;

      // Get current Merkle root
      const pool = await getPoolContract();
      const root = await pool.getMerkleRoot() as string;

      // Compute change commitment if partial withdrawal
      const change = spendNote.amount - withdrawAmount;
      let changeCommitment: Bytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as Bytes32;

      if (change > 0n) {
        const { derivePublicKey: derivePub } = await import('@nullshift/sdk');
        const ownerPub = await derivePub(wKeys.spendingKey);
        const changeSalt = randomFieldElement();
        changeCommitment = await computeCommitment(ownerPub, change, changeSalt) as Bytes32;

        // Store change note
        const changeNullifier = await computeNullifier(changeCommitment, wKeys.spendingKey);
        notes.push({
          commitment: changeCommitment,
          amount: change,
          salt: changeSalt as Bytes32,
          ownerPubkey: ownerPub as Bytes32,
          leafIndex: -1, // Will be updated after tree sync
          token: (withdrawPayload.token || ETH_ADDRESS) as Address,
          spent: false,
          nullifier: changeNullifier as Bytes32,
          merklePath: { pathIndex: -1, siblings: [] },
        });
      }

      // Generate ZK proof via offscreen document
      await ensureOffscreen();
      const proofResult = await chrome.runtime.sendMessage({
        type: 'GENERATE_PROOF',
        payload: {
          circuit: 'withdraw',
          inputs: {
            root,
            nullifier: spendNote.nullifier,
            recipient,
            amount: withdrawAmount.toString(),
            changeCommitment,
            secretKey: wKeys.spendingKey,
            salt: spendNote.salt,
            merklePath: spendNote.merklePath,
          },
        },
      });

      if (proofResult?.error) throw new Error(proofResult.error);

      // Submit withdraw transaction
      const wSigner = await getSigner();
      const wPool = await getPoolContract(wSigner);
      const wTx = await wPool.withdraw(
        proofResult.proof,
        spendNote.nullifier,
        recipient,
        withdrawAmount,
        root,
        changeCommitment,
      );
      const wReceipt = await wTx.wait();

      // Mark note as spent
      spendNote.spent = true;
      await saveNotes();

      addActivity('WITHDRAW', `Withdrew ${ethers.formatEther(withdrawAmount)} ETH`, wReceipt.hash);

      return { txHash: wReceipt.hash, nullifier: spendNote.nullifier };
    }

    // ---- Proof Generation ----
    case 'GENERATE_PROOF': {
      await ensureOffscreen();
      const result = await chrome.runtime.sendMessage({
        type: 'GENERATE_PROOF',
        payload: message.payload,
      });
      return result;
    }

    case 'PROOF_PROGRESS': {
      broadcastToUI(message);
      return {};
    }

    case 'PROOF_COMPLETE': {
      broadcastToUI(message);
      const proofPayload = message.payload as { circuit?: string; provingTimeMs?: number };
      addActivity('PROOF', `ZK proof generated: ${proofPayload.circuit ?? 'unknown'} (${((proofPayload.provingTimeMs ?? 0) / 1000).toFixed(1)}s)`);
      return {};
    }

    // ---- Notes ----
    case 'GET_NOTES':
      return { notes: notes.map(serializeNote) };

    case 'SYNC_NOTES':
      await saveNotes();
      return { synced: notes.length };

    // ---- Tree ----
    case 'SYNC_TREE': {
      try {
        const pool = await getPoolContract();
        const nextIndex = Number(await pool.getNextLeafIndex());
        const currentRoot = await pool.getMerkleRoot() as string;

        // Scan for deposit events to find our notes' leaf indices
        // Update any notes with leafIndex === -1
        const pendingNotes = notes.filter((n) => n.leafIndex === -1);
        if (pendingNotes.length > 0) {
          const depositFilter = pool.filters['Deposit']!();
          const events = await pool.queryFilter(depositFilter, 0, 'latest');

          for (const event of events) {
            const parsed = pool.interface.parseLog({ topics: event.topics as string[], data: event.data });
            if (!parsed) continue;
            const commitment = parsed.args[0] as string;
            const leafIdx = Number(parsed.args[1]);

            for (const note of pendingNotes) {
              if (note.commitment.toLowerCase() === commitment.toLowerCase()) {
                note.leafIndex = leafIdx;
                note.merklePath.pathIndex = leafIdx;
              }
            }
          }

          await saveNotes();
        }

        return { newLeaves: nextIndex, root: currentRoot };
      } catch {
        return { newLeaves: 0 };
      }
    }

    // ---- dApp Interaction ----
    case 'DAPP_CONNECT':
      return { approved: false };

    case 'DAPP_REQUEST':
      return { result: null };

    // ---- Network ----
    case 'GET_NETWORK': {
      const netStored = await chrome.storage.local.get(NETWORK_KEY);
      const net = netStored[NETWORK_KEY] ?? { chainId: 143, name: 'Monad' };
      const config = NETWORKS[net.chainId as keyof typeof NETWORKS];
      return {
        ...net,
        contracts: config?.contracts,
        blockExplorer: config?.blockExplorer,
      };
    }

    case 'SWITCH_NETWORK': {
      const { chainId, name } = message.payload as { chainId: number; name: string };
      await chrome.storage.local.set({ [NETWORK_KEY]: { chainId, name } });
      // Reset cached provider on network switch
      cachedProvider = null;
      cachedRpcUrl = null;
      broadcastToUI({ type: 'SWITCH_NETWORK', payload: { chainId, name } });
      return { success: true };
    }

    // ---- Settings ----
    case 'GET_SETTINGS':
      return {};

    case 'UPDATE_SETTINGS':
      return { success: true };

    // ---- Activity ----
    case 'GET_ACTIVITY': {
      const limit = (message.payload as { limit?: number })?.limit ?? 100;
      return { entries: activityLog.slice(0, limit) };
    }

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

// ---- Activity Helpers ----

function addActivity(
  type: ActivityEntry['type'],
  message: string,
  txHash?: string,
  details?: Record<string, unknown>,
) {
  const entry: ActivityEntry = {
    id: crypto.randomUUID(),
    type,
    message,
    timestamp: Date.now(),
    txHash: txHash as `0x${string}` | undefined,
    details,
  };
  activityLog.unshift(entry);
  if (activityLog.length > 500) activityLog.length = 500;
  broadcastToUI({ type: 'NEW_ACTIVITY', payload: entry });
}

// ---- Contract Helpers ----

async function getNetworkConfig() {
  const netStored = await chrome.storage.local.get(NETWORK_KEY);
  const net = netStored[NETWORK_KEY] ?? { chainId: 143, name: 'Monad' };
  const config = NETWORKS[net.chainId as keyof typeof NETWORKS];
  return config;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPoolContract(signer?: ethers.Signer): Promise<ethers.Contract & Record<string, any>> {
  const config = await getNetworkConfig();
  if (!config) throw new Error('Network not configured');
  const addr = config.contracts.shieldedPool;
  if (!addr || addr === '0x0000000000000000000000000000000000000000') {
    throw new Error('ShieldedPool not deployed on this network');
  }
  const signerOrProvider = signer ?? await getProvider();
  // Cast to Record to avoid TS2722 on dynamic method calls
  return new ethers.Contract(addr, SHIELDED_POOL_ABI, signerOrProvider) as ethers.Contract & Record<string, any>;
}

async function getSigner(): Promise<ethers.Wallet> {
  const keys = keyManager.getKeys();
  const provider = await getProvider();
  return new ethers.Wallet(keys.ethPrivateKey, provider);
}

// ---- Balance Helpers ----
async function getPublicBalance(): Promise<bigint> {
  try {
    const provider = await getProvider();
    const address = keyManager.getAddress();
    return await provider.getBalance(address);
  } catch {
    return 0n;
  }
}

async function getShieldedBalance(): Promise<bigint> {
  return notes
    .filter((n) => !n.spent)
    .reduce((sum, n) => sum + n.amount, 0n);
}

// ---- Encrypted Note Persistence ----

/** Derive a separate AES key from password for note encryption */
async function deriveNotesKey(password: string): Promise<CryptoKey> {
  const salt = new TextEncoder().encode('nullshift-notes-key-v1');
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password) as unknown as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations: 600_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function loadNotes(): Promise<void> {
  if (!notesEncryptionKey) return;

  const stored = await chrome.storage.local.get(NOTES_KEY);
  const encrypted = stored[NOTES_KEY] as { ciphertext: string; iv: string } | undefined;
  if (!encrypted) return;

  try {
    const iv = hexToBuf(encrypted.iv);
    const ciphertext = hexToBuf(encrypted.ciphertext);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
      notesEncryptionKey,
      ciphertext as unknown as ArrayBuffer,
    );

    const raw = JSON.parse(new TextDecoder().decode(plaintext)) as Array<Record<string, unknown>>;
    notes.length = 0;
    for (const n of raw) {
      notes.push({
        commitment: n.commitment as `0x${string}`,
        amount: BigInt(n.amount as string),
        salt: n.salt as `0x${string}`,
        ownerPubkey: n.ownerPubkey as `0x${string}`,
        leafIndex: n.leafIndex as number,
        token: n.token as `0x${string}`,
        spent: n.spent as boolean,
        nullifier: n.nullifier as `0x${string}`,
        merklePath: n.merklePath as { pathIndex: number; siblings: `0x${string}`[] },
      });
    }
  } catch {
    // Decryption failed — corrupt data or wrong key
    notes.length = 0;
  }
}

/** Save notes to encrypted storage (called after note state changes) */
async function saveNotes(): Promise<void> {
  if (!notesEncryptionKey || notes.length === 0) return;

  const plaintext = JSON.stringify(notes.map(serializeNote));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
    notesEncryptionKey,
    new TextEncoder().encode(plaintext) as unknown as ArrayBuffer,
  );

  await chrome.storage.local.set({
    [NOTES_KEY]: {
      ciphertext: bufToHex(new Uint8Array(ciphertext)),
      iv: bufToHex(iv),
    },
  });
}

function serializeNote(note: OwnedNote): Record<string, unknown> {
  return {
    commitment: note.commitment,
    amount: note.amount.toString(),
    salt: note.salt,
    ownerPubkey: note.ownerPubkey,
    leafIndex: note.leafIndex,
    token: note.token,
    spent: note.spent,
    nullifier: note.nullifier,
  };
}

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ---- Broadcast to UI contexts ----
function broadcastToUI(message: Message | { type: string; payload: unknown }) {
  chrome.runtime.sendMessage(message).catch(() => {
    // UI contexts may not be open
  });
}

// ---- Auto-lock Timer ----
function resetAutoLock() {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  autoLockTimer = setTimeout(() => {
    keyManager.lock();
    notesEncryptionKey = null;
    notes.length = 0;
    broadcastToUI({ type: 'LOCK_WALLET', payload: undefined } as Message);
  }, AUTO_LOCK_TIMEOUT_MS);
}

// ---- Offscreen Document Management ----
let creatingOffscreen: Promise<void> | null = null;

async function ensureOffscreen() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });

  if (existingContexts.length > 0) return;

  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  creatingOffscreen = chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: [chrome.offscreen.Reason.WORKERS],
    justification: 'ZK proof generation via Barretenberg WASM',
  });

  await creatingOffscreen;
  creatingOffscreen = null;
}

// ---- Side Panel Setup ----
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });

// ---- Extension Install Handler ----
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[NullShift] Extension installed');
  }
});
