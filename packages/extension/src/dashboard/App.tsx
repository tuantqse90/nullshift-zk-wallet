import { useEffect, useState } from 'react';
import { useWalletStore } from '../shared/state/walletStore';
import { sendToBackground, onMessage } from '../shared/utils/messaging';
import type { ActivityEntry, ChainId, OwnedNote, NetworkConfig } from '@nullshift/common';

type Tab = 'portfolio' | 'notes' | 'activity' | 'defi' | 'settings';

export function DashboardApp() {
  const {
    locked,
    address,
    shieldedBalance,
    publicBalance,
    networkName,
    nativeSymbol,
    notes,
    activity,
    provingCircuit,
    provingProgress,
    setLocked,
    setAddress,
    setBalances,
    setChain,
    setNotes,
    addActivity,
    setProvingStatus,
  } = useWalletStore();

  const [tab, setTab] = useState<Tab>('portfolio');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check wallet status
    sendToBackground('GET_WALLET_STATUS', undefined, 'dashboard')
      .then((status) => {
        setLocked(status.locked);
        if (status.address) setAddress(status.address);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch current network
    sendToBackground('GET_NETWORK', undefined, 'dashboard')
      .then((net) => {
        if (net?.chainId && net?.name) {
          setChain(net.chainId as ChainId, net.name as string, (net as NetworkConfig).nativeCurrency?.symbol);
        }
      })
      .catch(console.error);

    // Fetch balances
    sendToBackground('GET_BALANCE', { token: undefined }, 'dashboard')
      .then((result) => setBalances(result.shielded, result.public))
      .catch(console.error);

    // Fetch notes
    sendToBackground('GET_NOTES', { status: 'all' }, 'dashboard')
      .then((result) => setNotes(result.notes))
      .catch(console.error);

    // Fetch activity
    sendToBackground('GET_ACTIVITY', { limit: 100 }, 'dashboard')
      .then((result) => {
        result.entries.forEach((e: ActivityEntry) => addActivity(e));
      })
      .catch(console.error);

    // Auto-sync Merkle tree from chain
    sendToBackground('SYNC_TREE', undefined, 'dashboard').catch(() => {});

    // Listen for background events
    onMessage((message) => {
      if (message.type === 'LOCK_WALLET') setLocked(true);
      if (message.type === 'NEW_ACTIVITY') addActivity(message.payload as ActivityEntry);
      if (message.type === 'PROOF_PROGRESS') {
        const p = message.payload as { circuit: string; percent: number };
        setProvingStatus(p.circuit, p.percent);
      }
      if (message.type === 'PROOF_COMPLETE') setProvingStatus(null, 0);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-ns-bg-primary flex items-center justify-center">
        <p className="font-mono text-ns-primary animate-pulse">nullshift@labs$ loading...</p>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="min-h-screen bg-ns-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-mono text-2xl mb-4">
            <span className="text-ns-primary">null</span>
            <span className="text-ns-text-dim">shift.sh</span>
          </h1>
          <p className="font-mono text-sm text-ns-text-dim">// wallet is locked</p>
          <p className="font-mono text-xs text-ns-text-dim mt-2">Open the popup to unlock.</p>
        </div>
      </div>
    );
  }

  const privacyScore = (() => {
    const s = parseFloat(shieldedBalance) || 0;
    const p = parseFloat(publicBalance) || 0;
    const total = s + p;
    if (total === 0) return 0;
    return Math.round((s / total) * 100);
  })();

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '---';
  const unspentNotes = notes.filter((n) => !n.spent);

  return (
    <div className="min-h-screen bg-ns-bg-primary text-ns-text-DEFAULT">
      {/* Header */}
      <header className="border-b border-ns-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-mono text-xl">
            <span className="text-ns-primary">null</span>
            <span className="text-ns-text-dim">shift.sh</span>
          </h1>
          <span className="font-mono text-xs text-ns-text-dim">// {shortAddr}</span>
          <span className="font-mono text-xs text-ns-secondary">{networkName}</span>
        </div>
        <nav className="flex gap-6 font-mono text-sm">
          {(['portfolio', 'notes', 'activity', 'defi', 'settings'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`${tab === t ? 'text-ns-primary' : 'text-ns-text-dim hover:text-ns-text-DEFAULT'}`}
            >
              /{t}
            </button>
          ))}
        </nav>
      </header>

      {/* Proof Monitor */}
      {provingCircuit && (
        <div className="px-8 py-2 bg-ns-bg-secondary border-b border-ns-border">
          <p className="font-mono text-xs text-ns-secondary">
            &gt; Generating proof: {provingCircuit} ({provingProgress}%)
          </p>
          <div className="w-full h-1 bg-ns-bg-card rounded mt-1">
            <div className="h-full bg-ns-secondary rounded transition-all" style={{ width: `${provingProgress}%` }} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-8">
        {tab === 'portfolio' && (
          <PortfolioTab
            shieldedBalance={shieldedBalance}
            publicBalance={publicBalance}
            privacyScore={privacyScore}
            noteCount={unspentNotes.length}
            symbol={nativeSymbol}
          />
        )}
        {tab === 'notes' && <NotesTab notes={notes} symbol={nativeSymbol} />}
        {tab === 'activity' && <ActivityTab activity={activity} />}
        {tab === 'defi' && <DeFiTab />}
        {tab === 'settings' && <SettingsTab networkName={networkName} address={address} />}
      </main>
    </div>
  );
}

// ---- Portfolio Tab ----
function PortfolioTab({
  shieldedBalance,
  publicBalance,
  privacyScore,
  noteCount,
  symbol,
}: {
  shieldedBalance: string;
  publicBalance: string;
  privacyScore: number;
  noteCount: number;
  symbol: string;
}) {
  return (
    <>
      <h2 className="font-mono text-lg text-ns-text-bright mb-4">// portfolio overview</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
          <p className="font-mono text-xs text-ns-text-dim">Shielded Balance</p>
          <p className="font-mono text-2xl text-ns-primary mt-1">{shieldedBalance} {symbol}</p>
        </div>
        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
          <p className="font-mono text-xs text-ns-text-dim">Public Balance</p>
          <p className="font-mono text-2xl text-ns-text-bright mt-1">{publicBalance} {symbol}</p>
        </div>
        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
          <p className="font-mono text-xs text-ns-text-dim">Privacy Score</p>
          <p className="font-mono text-2xl text-ns-secondary mt-1">{privacyScore}%</p>
          <div className="w-full h-1.5 bg-ns-bg-primary rounded mt-2">
            <div className="h-full bg-ns-primary rounded transition-all" style={{ width: `${privacyScore}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
          <p className="font-mono text-xs text-ns-text-dim">Unspent Notes (UTXOs)</p>
          <p className="font-mono text-xl text-ns-text-bright mt-1">{noteCount}</p>
        </div>
        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
          <p className="font-mono text-xs text-ns-text-dim">Total Balance</p>
          <p className="font-mono text-xl text-ns-text-bright mt-1">
            {(parseFloat(shieldedBalance) + parseFloat(publicBalance)).toFixed(4)} {symbol}
          </p>
        </div>
      </div>
    </>
  );
}

// ---- Notes Tab ----
function NotesTab({ notes, symbol }: { notes: OwnedNote[]; symbol: string }) {
  const unspent = notes.filter((n) => !n.spent);
  const spent = notes.filter((n) => n.spent);

  const formatAmount = (amount: bigint) => {
    const eth = Number(amount) / 1e18;
    return eth.toFixed(6);
  };

  const shortHex = (hex: string) => `${hex.slice(0, 10)}...${hex.slice(-6)}`;

  return (
    <>
      <h2 className="font-mono text-lg text-ns-text-bright mb-4">// note explorer</h2>

      {notes.length === 0 ? (
        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
          <pre className="font-mono text-sm text-ns-text-dim">
{`nullshift@labs$ ls -la /notes
total 0
// No shielded notes found. Use > Shield to get started.`}
          </pre>
        </div>
      ) : (
        <>
          <p className="font-mono text-xs text-ns-text-dim mb-3">
            // {unspent.length} unspent, {spent.length} spent
          </p>

          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.commitment}
                className={`bg-ns-bg-card border rounded-lg p-3 font-mono text-xs ${
                  note.spent ? 'border-ns-border opacity-50' : 'border-ns-primary'
                }`}
              >
                <div className="flex justify-between">
                  <span className="text-ns-text-dim">commitment:</span>
                  <span className="text-ns-text-bright">{shortHex(note.commitment)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-ns-text-dim">amount:</span>
                  <span className="text-ns-primary">{formatAmount(note.amount)} {symbol}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-ns-text-dim">leaf:</span>
                  <span className="text-ns-text-DEFAULT">#{note.leafIndex}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-ns-text-dim">status:</span>
                  <span className={note.spent ? 'text-ns-accent' : 'text-ns-primary'}>
                    [{note.spent ? 'SPENT' : 'UNSPENT'}]
                  </span>
                </div>
                {note.nullifier && (
                  <div className="flex justify-between mt-1">
                    <span className="text-ns-text-dim">nullifier:</span>
                    <span className="text-ns-text-DEFAULT">{shortHex(note.nullifier)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ---- Activity Tab ----
function ActivityTab({ activity }: { activity: ActivityEntry[] }) {
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', { hour12: false });
  };

  const typeColor = (type: ActivityEntry['type']) => {
    switch (type) {
      case 'ERROR': return 'text-ns-accent';
      case 'PROOF': return 'text-ns-secondary';
      case 'SHIELD': case 'SEND': case 'RECV': return 'text-ns-primary';
      case 'WITHDRAW': return 'text-ns-text-bright';
      default: return 'text-ns-text-DEFAULT';
    }
  };

  return (
    <>
      <h2 className="font-mono text-lg text-ns-text-bright mb-4">// activity log</h2>

      <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
        <p className="font-mono text-sm text-ns-text-dim mb-3">
          nullshift@labs$ tail -f /var/log/wallet.log
        </p>

        {activity.length === 0 ? (
          <p className="font-mono text-xs text-ns-text-dim">// Waiting for activity...</p>
        ) : (
          <div className="space-y-1">
            {activity.map((entry) => (
              <div key={entry.id} className="font-mono text-xs">
                <span className="text-ns-text-dim">[{formatTime(entry.timestamp)}]</span>{' '}
                <span className={`font-semibold ${typeColor(entry.type)}`}>
                  {entry.type.padEnd(8)}
                </span>{' '}
                <span className="text-ns-text-DEFAULT">{entry.message}</span>
                {entry.txHash && (
                  <span className="text-ns-text-dim ml-2">tx:{entry.txHash.slice(0, 10)}...</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---- DeFi Tab ----
function DeFiTab() {
  const { nativeSymbol } = useWalletStore();
  const [fromToken, setFromToken] = useState(nativeSymbol);
  const [toToken, setToToken] = useState('USDC');
  const [amount, setAmount] = useState('');

  return (
    <>
      <h2 className="font-mono text-lg text-ns-text-bright mb-4">// anonymous swap</h2>

      <div className="max-w-lg">
        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-6">
          <p className="font-mono text-xs text-ns-text-dim mb-4">
            // swap through relayer — no address link
          </p>

          {/* From */}
          <div className="mb-4">
            <p className="font-mono text-xs text-ns-text-dim mb-1">From</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-ns-bg-primary border border-ns-border rounded px-3 py-2 font-mono text-sm text-ns-text-bright placeholder-ns-text-dim focus:border-ns-primary focus:outline-none"
              />
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="bg-ns-bg-primary border border-ns-border rounded px-3 py-2 font-mono text-sm text-ns-text-bright focus:border-ns-primary focus:outline-none"
              >
                <option>{nativeSymbol}</option>
                <option>USDC</option>
                <option>W{nativeSymbol}</option>
              </select>
            </div>
          </div>

          {/* Swap arrow */}
          <div className="text-center my-2">
            <span className="font-mono text-ns-text-dim">↓</span>
          </div>

          {/* To */}
          <div className="mb-4">
            <p className="font-mono text-xs text-ns-text-dim mb-1">To</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={amount ? '—' : ''}
                placeholder="0.0"
                className="flex-1 bg-ns-bg-primary border border-ns-border rounded px-3 py-2 font-mono text-sm text-ns-text-dim"
              />
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="bg-ns-bg-primary border border-ns-border rounded px-3 py-2 font-mono text-sm text-ns-text-bright focus:border-ns-primary focus:outline-none"
              >
                <option>USDC</option>
                <option>{nativeSymbol}</option>
                <option>W{nativeSymbol}</option>
              </select>
            </div>
          </div>

          {/* Swap details */}
          <div className="border-t border-ns-border pt-3 mb-4 space-y-1">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-ns-text-dim">Slippage</span>
              <span className="text-ns-text-DEFAULT">0.5%</span>
            </div>
            <div className="flex justify-between font-mono text-xs">
              <span className="text-ns-text-dim">Relayer fee</span>
              <span className="text-ns-text-DEFAULT">~0.1%</span>
            </div>
            <div className="flex justify-between font-mono text-xs">
              <span className="text-ns-text-dim">Privacy</span>
              <span className="text-ns-primary">[SHIELDED]</span>
            </div>
          </div>

          <button
            disabled
            className="btn btn-primary w-full disabled:opacity-40"
          >
            &gt; Swap (coming soon)
          </button>

          <p className="font-mono text-xs text-ns-text-dim mt-3 text-center">
            // requires DEX router on Monad
          </p>
        </div>
      </div>
    </>
  );
}

// ---- Settings Tab ----

const AVAILABLE_NETWORKS = [
  { chainId: 143 as ChainId, name: 'Monad' },
  { chainId: 11155111 as ChainId, name: 'Ethereum Sepolia' },
  { chainId: 31337 as ChainId, name: 'Anvil Local' },
  { chainId: 1 as ChainId, name: 'Ethereum Mainnet' },
];

function SettingsTab({
  networkName,
  address,
}: {
  networkName: string;
  address: string | null;
}) {
  const { setChain } = useWalletStore();
  const [switching, setSwitching] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const handleLock = () => {
    sendToBackground('LOCK_WALLET', undefined, 'dashboard').catch(console.error);
  };

  const handleNetworkSwitch = async (chainId: ChainId, name: string) => {
    if (name === networkName) return;
    setSwitching(true);
    try {
      await sendToBackground('SWITCH_NETWORK', { chainId, name }, 'dashboard');
      setChain(chainId, name);
    } catch (err) {
      console.error('Network switch failed:', err);
    } finally {
      setSwitching(false);
    }
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  return (
    <>
      <h2 className="font-mono text-lg text-ns-text-bright mb-4">// settings</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Network */}
        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
          <p className="font-mono text-xs text-ns-text-dim mb-3">Network</p>
          <div className="space-y-2">
            {AVAILABLE_NETWORKS.map((net) => (
              <button
                key={net.chainId}
                onClick={() => handleNetworkSwitch(net.chainId, net.name)}
                disabled={switching}
                className={`w-full text-left font-mono text-sm px-3 py-2 rounded border transition-colors ${
                  net.name === networkName
                    ? 'border-ns-primary text-ns-primary bg-ns-bg-primary'
                    : 'border-ns-border text-ns-text-dim hover:border-ns-text-dim hover:text-ns-text-DEFAULT'
                }`}
              >
                {net.name === networkName ? '> ' : '  '}{net.name}
                <span className="text-ns-text-dim ml-2">({net.chainId})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Key Management */}
        <div className="space-y-4">
          <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
            <p className="font-mono text-xs text-ns-text-dim mb-2">Address</p>
            <p className="font-mono text-sm text-ns-text-bright break-all mb-2">{address ?? '---'}</p>
            <button onClick={handleCopyAddress} className="btn btn-ghost text-xs">
              {copiedAddr ? '> Copied!' : '> Copy Address'}
            </button>
          </div>

          <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
            <p className="font-mono text-xs text-ns-text-dim mb-2">Seed Phrase</p>
            {showSeed ? (
              <>
                <p className="font-mono text-xs text-ns-accent mb-2">
                  // WARNING: Never share your seed phrase
                </p>
                <div className="bg-ns-bg-primary border border-ns-accent rounded p-3 mb-2">
                  <p className="font-mono text-xs text-ns-text-bright">
                    Seed export not available in v0.1.
                  </p>
                  <p className="font-mono text-xs text-ns-text-dim mt-1">
                    // Wallet uses HD derivation from encrypted vault
                  </p>
                </div>
                <button onClick={() => setShowSeed(false)} className="btn btn-ghost text-xs">
                  &gt; Hide
                </button>
              </>
            ) : (
              <button onClick={() => setShowSeed(true)} className="btn btn-ghost text-xs">
                &gt; Show Seed Phrase
              </button>
            )}
          </div>
        </div>

        {/* Security */}
        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
          <p className="font-mono text-xs text-ns-text-dim mb-3">Security</p>
          <div className="space-y-2">
            <button onClick={handleLock} className="btn btn-ghost text-xs w-full text-left">
              &gt; Lock wallet
            </button>
            <div className="font-mono text-xs space-y-1 mt-3 text-ns-text-dim">
              <p>Vault: PBKDF2 600k + AES-256-GCM</p>
              <p>Auto-lock: 15 minutes</p>
              <p>Notes: Encrypted at rest</p>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
          <p className="font-mono text-xs text-ns-text-dim mb-3">Privacy</p>
          <div className="font-mono text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-ns-text-dim">Analytics</span>
              <span className="text-ns-primary">[DISABLED]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ns-text-dim">Tracking</span>
              <span className="text-ns-primary">[NONE]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ns-text-dim">Events</span>
              <span className="text-ns-primary">[PRIVACY-SAFE]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ns-text-dim">Proofs</span>
              <span className="text-ns-primary">[CLIENT-SIDE]</span>
            </div>
            <p className="text-ns-text-dim mt-2 pt-2 border-t border-ns-border">
              // No data leaves your device.<br />
              // ZK proofs generated locally via WASM.
            </p>
          </div>
        </div>

        {/* About */}
        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4 col-span-2">
          <p className="font-mono text-xs text-ns-text-dim mb-2">About</p>
          <div className="grid grid-cols-2 gap-x-8 font-mono text-xs">
            <div className="space-y-1">
              <p className="text-ns-text-DEFAULT">NullShift ZK Privacy Wallet v0.1.0</p>
              <p className="text-ns-text-dim">Noir circuits + UltraPlonk verifiers</p>
              <p className="text-ns-text-dim">Barretenberg WASM proof engine</p>
            </div>
            <div className="space-y-1">
              <p className="text-ns-text-dim">Chain: Monad (143)</p>
              <p className="text-ns-text-dim">Pool: {address ? '0x6ee4...d76e' : '---'}</p>
              <p className="text-ns-text-dim">Contracts: Sourcify verified</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
