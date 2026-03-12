# NullShift ZK Privacy Wallet — Claude CLI Prompt Suite

> **Project**: NullShift Privacy Wallet (Chrome Extension)
> **Stack**: Noir (Aztec) + Solidity (EVM) + React + Chrome Extension MV3
> **Target**: Chrome/Chromium · Manifest V3
> **Scope**: Shielded transfers · Private balances · Anonymous DeFi
> **Brand**: NullShift Labs — privacy-first, terminal/hacker aesthetic

---

## Table of Contents

1. [Project Architecture & Scaffolding](#prompt-1)
2. [Noir Circuits — Shielded Transfer](#prompt-2)
3. [Noir Circuits — Private Balance & Deposit/Withdraw](#prompt-3)
4. [Noir Circuits — Anonymous Swap](#prompt-4)
5. [Solidity Contracts — Shielded Pool & Verifier](#prompt-5)
6. [Chrome Extension — MV3 Architecture & Skeleton](#prompt-6)
7. [Extension — Popup UI (React)](#prompt-7)
8. [Extension — Full-page Dashboard](#prompt-8)
9. [Extension — Content Script & dApp Provider Injection](#prompt-9)
10. [Extension — Side Panel (TX History & Proof Status)](#prompt-10)
11. [SDK/Core — Proof Generation & Note Management](#prompt-11)
12. [Integration — End-to-End Flow](#prompt-12)
13. [Security Audit Checklist](#prompt-13)

---

<a id="prompt-1"></a>
## Prompt 1: Project Architecture & Scaffolding

```
You are a senior blockchain + browser extension engineer specializing in ZK-proof privacy systems.

## Context
I'm building "NullShift Wallet" — a privacy-focused EVM browser extension wallet (like MetaMask but with ZK privacy) using Noir (Aztec's ZK DSL) for zero-knowledge proofs.

- Extension: Chrome/Chromium only, Manifest V3
- ZK Backend: Noir circuits -> ACIR -> Barretenberg prover (client-side via bb.js/WASM)
- Contracts: Solidity 0.8.x on EVM (Ethereum + Monad)
- UI: React (popup + full-page dashboard + side panel)
- dApp Integration: Content script injects window.nullshift provider (EIP-1193 compatible + privacy extensions)

## Requirements
Design the full monorepo architecture:

### Folder Structure
nullshift-wallet/
  packages/
    circuits/          # Noir circuits (nargo project)
    contracts/         # Solidity (Hardhat/Foundry)
    sdk/               # Core TS library (proof gen, note mgmt, key derivation)
    extension/         # Chrome Extension MV3
      src/
        background/    # Service worker
        popup/         # React popup (360x600)
        dashboard/     # Full-page React app
        sidepanel/     # Side panel React app
        content/       # Content script (provider injection)
        inpage/        # Injected script (window.nullshift)
        shared/        # Shared state, types, message bus
        assets/        # Icons, fonts (JetBrains Mono, terminal theme)
      manifest.json
      webpack.config.js
    common/            # Shared types, crypto utils
  turbo.json
  package.json

### Deliverables
1. Complete folder structure with file descriptions
2. Data flow diagram: User Action -> Extension UI -> Background Service Worker -> SDK (proof gen) -> Contract Interaction -> State Update
3. Message passing architecture: popup <-> background <-> content script <-> inpage script
4. MV3-specific design: service worker lifecycle, offscreen documents for WASM proof gen, storage strategy (chrome.storage.session vs local)
5. Key management: HD wallet derivation (BIP-44) + ZK spending key + viewing key hierarchy
6. State management: how shielded notes, nullifiers, Merkle tree sync are stored locally
7. Build pipeline: Turborepo + webpack for extension, nargo for circuits, hardhat for contracts

Output as structured markdown with mermaid diagrams where helpful.
```

---

<a id="prompt-2"></a>
## Prompt 2: Noir Circuits — Shielded Transfer

```
You are a Noir circuit developer building privacy-preserving transfer circuits.

## Context
NullShift Wallet uses a UTXO commitment model:
- Note = Pedersen(owner_pubkey, amount, salt) -> stored as leaf in on-chain Merkle tree
- Nullifier = Poseidon(note_commitment, owner_secret_key) -> prevents double-spend
- Merkle tree depth: 20 (supports ~1M notes)
- Proof system: Noir -> ACIR -> UltraPlonk via Barretenberg

## Task
Write the complete Noir circuit for shielded_transfer:

### Circuit Spec
Private Inputs:
- sender_secret_key: Field
- input_notes[2]: { amount: Field, salt: Field, path_index: Field, siblings: [Field; 20] }
- output_notes[2]: { owner_pubkey: Field, amount: Field, salt: Field }

Public Inputs:
- merkle_root: Field
- nullifiers[2]: Field
- output_commitments[2]: Field

### Constraints
1. Derive sender_pubkey from sender_secret_key -> verify sender owns each input note
2. Verify each input note's Merkle membership against merkle_root
3. Verify nullifiers are correctly derived: Poseidon(commitment, secret_key)
4. Amount conservation: sum(inputs) == sum(outputs)
5. Range check: all amounts fit in u64 (prevent overflow attacks)
6. Output commitments match: Pedersen(pubkey, amount, salt) == claimed commitment

### Requirements
- Use Noir standard library (std::hash::pedersen, std::hash::poseidon)
- Handle the "zero note" case (input_note with amount=0 for single-input transfers)
- Add inline comments explaining each constraint block
- Include the Nargo.toml config
- Write 3 test cases: normal 2-in-2-out, single-input with change, max-amount edge case

Output complete Noir source files ready to compile with nargo compile.
```

---

<a id="prompt-3"></a>
## Prompt 3: Noir Circuits — Private Balance (Deposit & Withdraw)

```
You are a Noir circuit developer for the NullShift privacy wallet.

## Context
Same UTXO model as the shielded transfer circuit. Users need to:
1. Deposit (Shield): Convert public ERC-20/ETH into a shielded note
2. Withdraw (Unshield): Burn a shielded note and release funds to a public address

## Task: Two Circuits

### Circuit 1: deposit (simple — mostly on-chain logic, minimal ZK)
- User sends public ETH/token to the ShieldedPool contract
- Contract creates a note commitment from user-provided (pubkey, amount, salt)
- The circuit proves knowledge of the preimage:
  - Private: owner_pubkey, amount, salt
  - Public: commitment
  - Constraint: Pedersen(owner_pubkey, amount, salt) == commitment

### Circuit 2: withdraw
- User proves they own a shielded note and wants to unshield it
- Private: secret_key, note (amount, salt, path_index, siblings), recipient_address
- Public: merkle_root, nullifier, recipient_address, withdraw_amount
- Constraints:
  1. Ownership proof (derive pubkey, verify note)
  2. Merkle membership
  3. Correct nullifier
  4. withdraw_amount <= note.amount (partial withdraw creates change note)
  5. If partial: output change commitment is valid

### Requirements
- Complete Noir source for both circuits
- Nargo.toml with dependencies
- Test cases for: full withdraw, partial withdraw with change, zero-amount edge case
- Document the deposit flow (what's on-chain vs what's in ZK)
```

---

<a id="prompt-4"></a>
## Prompt 4: Noir Circuits — Anonymous Swap

```
You are a ZK circuit engineer designing private DeFi interactions.

## Context
NullShift Wallet enables anonymous swaps with on-chain AMMs (Uniswap V2/V3 style) without revealing the swapper's identity or exact amounts publicly.

## Architecture
The anonymous swap uses a "shield -> swap -> shield" pattern:
1. User proves they have a shielded note with sufficient balance
2. A relayer executes the on-chain swap on behalf of the user
3. Swap output is re-shielded into a new note for the user

### Circuit: anonymous_swap
Private Inputs:
- secret_key: Field
- input_note: { token_id: Field, amount: Field, salt: Field, path_index: Field, siblings: [Field; 20] }
- swap_amount: Field (how much to swap, <= input_note.amount)
- min_output_amount: Field (slippage protection)
- output_note_salt: Field
- change_note_salt: Field

Public Inputs:
- merkle_root: Field
- nullifier: Field
- swap_commitment: Field (hash of swap params for relayer to verify)
- change_commitment: Field (change note back to user)
- relayer_address: Field
- relayer_fee: Field

### Constraints
1. Note ownership + Merkle membership
2. Correct nullifier
3. swap_amount + relayer_fee <= input_note.amount
4. change_note = input_note.amount - swap_amount - relayer_fee
5. swap_commitment = Poseidon(token_in, token_out, swap_amount, min_output_amount, relayer_address)
6. Range checks on all amounts

### Requirements
- Complete Noir circuit
- Explain the relayer model: how does the relayer execute without learning user identity?
- How does the re-shielding of swap output work? (relayer creates output note commitment)
- Threat model: what if relayer front-runs? (commit-reveal or encrypted memo approach)
- Test cases covering normal swap, max slippage, zero-fee relayer scenario
```

---

<a id="prompt-5"></a>
## Prompt 5: Solidity Contracts — Shielded Pool & Verifier

```
You are a Solidity smart contract engineer building the on-chain component of a ZK privacy wallet.

## Context
NullShift Wallet's on-chain layer manages:
- Incremental Merkle tree of note commitments
- Nullifier registry (prevent double-spend)
- Proof verification (UltraPlonk verifier generated by Barretenberg)
- ETH and ERC-20 deposit/withdrawal

## Task
Write the following Solidity contracts:

### 1. ShieldedPool.sol (Core)
- deposit(bytes32 commitment) payable — Add commitment to Merkle tree, accept ETH
- depositERC20(address token, uint256 amount, bytes32 commitment) — Pull ERC-20, add commitment
- transact(Proof calldata proof, bytes32[2] nullifiers, bytes32[2] newCommitments) — Verify shielded transfer proof, mark nullifiers, insert new commitments
- withdraw(Proof calldata proof, bytes32 nullifier, address recipient, uint256 amount, address token) — Verify withdraw proof, release funds
- Internal: incremental Merkle tree (depth 20), nullifier mapping, root history (last 100 roots)

### 2. MerkleTree.sol (Library)
- Incremental Merkle tree using Poseidon hash
- insert(bytes32 leaf) returns uint256 leafIndex
- getRoot() returns bytes32
- Store only the current path, not all leaves (gas optimization)

### 3. UltraVerifier.sol
- Auto-generated by bb contract from Noir circuit — just note where this fits
- Interface: verify(bytes calldata proof, bytes32[] calldata publicInputs) returns bool

### 4. Relayer.sol (for anonymous swaps)
- Accepts swap commitments, executes on Uniswap router, re-shields output
- Fee mechanism for relayer incentive

### Requirements
- OpenZeppelin imports where applicable (ReentrancyGuard, SafeERC20)
- Gas optimization notes (calldata vs memory, storage packing)
- Events for all state changes (for SDK indexing)
- Foundry test scaffolding
- Deployment script for Hardhat + Monad RPC config
```

---

<a id="prompt-6"></a>
## Prompt 6: Chrome Extension — MV3 Architecture & Skeleton

```
You are a Chrome Extension engineer with deep MV3 expertise.

## Context
NullShift Wallet is a privacy-focused crypto wallet Chrome extension. It needs:
- Popup (360x600): Quick actions — balance, send, receive
- Full-page Dashboard: Advanced features — tx history, note management, settings, DeFi
- Side Panel: Real-time tx/proof status, activity feed
- Content Script: Inject window.nullshift provider into dApps
- Background Service Worker: Key management, proof coordination, state management

## Task
Create the complete MV3 extension skeleton:

### manifest.json
- Permissions: storage, sidePanel, activeTab, scripting
- Service worker: background.js
- Content scripts: match all URLs (for dApp injection)
- Action: popup.html
- Side panel: sidepanel.html
- Web accessible resources: inpage.js (injected provider)
- CSP: allow WASM execution (for bb.js proof generation)

### Architecture Decisions
1. WASM Proof Generation: Service workers can't run WASM efficiently -> use Offscreen Document API for proof generation in a hidden page
2. Message Bus: Define a typed message protocol between all contexts:
   - popup <-> background: chrome.runtime.sendMessage
   - content <-> background: chrome.runtime.sendMessage
   - content <-> inpage: window.postMessage (with origin check)
   - sidepanel <-> background: chrome.runtime.sendMessage
3. Storage Strategy:
   - chrome.storage.session: Unlocked keys, active session
   - chrome.storage.local: Encrypted vault, note cache, settings
   - Never store raw private keys in storage.local

### Deliverables
1. Complete manifest.json
2. Background service worker skeleton with message router
3. Message types enum/interface (TypeScript)
4. Offscreen document setup for WASM proof gen
5. Build config: webpack with multiple entry points (popup, dashboard, sidepanel, background, content, inpage)
6. Package.json with dependencies

### Design Theme
- NullShift brand: dark terminal aesthetic
- Colors: #0a0a0a background, #00ff41 primary (matrix green), #ff3366 accent, #888 muted
- Font: JetBrains Mono
- UI feels like a hacker terminal, not a generic fintech app
```

---

<a id="prompt-7"></a>
## Prompt 7: Extension — Popup UI (React)

```
You are a React + crypto wallet UI developer with terminal/hacker aesthetic expertise.

## Context
NullShift Wallet popup (360x600px) is the primary quick-action interface.

## Task
Build the React popup app with these screens:

### Screens
1. Lock Screen: Password input, NullShift logo (ASCII art style), "Enter the void" button
2. Home:
   - Shielded balance (shown as "### ETH" until user hovers/clicks to reveal)
   - Public balance
   - Quick actions: Shield, Send, Receive, Swap
   - Network selector (Ethereum / Monad)
   - "Privacy score" indicator (% of funds shielded)
3. Send (Shielded):
   - Recipient: NullShift address or ENS
   - Amount input with "MAX" button
   - Fee estimation (gas + relayer fee if anonymous)
   - "Generating proof..." loading state with terminal-style progress
4. Receive:
   - Show shielded receiving address (derived viewing key)
   - QR code with terminal-styled border
5. Shield/Unshield:
   - Deposit public funds into shielded pool
   - Withdraw from shielded to public

### Technical Requirements
- React 18 + TypeScript
- State management: Zustand (lightweight, good for extension)
- Styling: Tailwind CSS with custom NullShift theme
- Communication with background via typed chrome.runtime.sendMessage
- All crypto operations happen in background/offscreen — popup is UI only
- Skeleton loading states styled as terminal output (Loading... [progress-bar] 60%)
- Transitions: fade + slight glitch effect on screen change

### NullShift Design Language
- Every action has a terminal-style confirmation: > SHIELD 1.5 ETH [Y/n]
- Balances animate in like typewriter text
- Error messages styled as terminal errors: [ERR] Insufficient shielded balance
- Success: [OK] Transaction broadcasted. Nullifier: 0x4a2f...
```

---

<a id="prompt-8"></a>
## Prompt 8: Extension — Full-page Dashboard

```
You are building the full-page dashboard for NullShift Wallet (opens in new tab).

## Context
Dashboard = advanced features that don't fit in popup. Opens via popup menu or chrome-extension://[id]/dashboard.html.

## Screens & Components

### 1. Portfolio Overview
- Combined shielded + public balances across tokens
- Privacy health score (large visual)
- Chart: balance over time (obfuscated — no exact values on y-axis, just trend)
- Recent activity feed (terminal log style)

### 2. Note Explorer
- List all shielded notes (UTXOs) user owns
- Status: unspent / spent / pending
- Actions: merge notes (combine small UTXOs), split note
- Merkle proof status for each note

### 3. Transaction Builder (Advanced)
- Manual UTXO selection for transfers
- Custom relayer configuration
- Batch operations: shield multiple tokens at once
- Raw proof data inspector (for nerds)

### 4. DeFi Hub
- Anonymous swap interface (select token pair, set slippage)
- Liquidity provision (if supported)
- Integration status with detected dApps

### 5. Settings
- Network management (add custom RPC, Monad config)
- Key management: export viewing key, backup seed phrase
- Relayer settings: preferred relayer, custom relayer URL
- Privacy preferences: auto-shield incoming funds, default anonymity set size
- Theme customization (terminal color schemes)

### Technical
- React 18 + TypeScript + React Router
- Shared state with popup via chrome.storage + message passing
- Responsive but primarily desktop-focused
- Same NullShift terminal theme as popup
- Data tables styled as ls -la output
- Charts using recharts with custom dark theme
```

---

<a id="prompt-9"></a>
## Prompt 9: Content Script & dApp Provider Injection

```
You are a Web3 wallet integration engineer.

## Context
NullShift Wallet injects a provider into web pages so dApps can interact with the wallet, similar to MetaMask's window.ethereum but with privacy extensions.

## Task

### 1. Inpage Script (inpage.js)
Injected into every page via content script. Exposes:

window.nullshift = {
  // EIP-1193 compatible (so dApps that support MetaMask work)
  request(args: { method: string, params?: any[] }): Promise<any>,
  on(event: string, handler: Function): void,
  removeListener(event: string, handler: Function): void,
  
  // Standard methods:
  // eth_requestAccounts -> returns public address (or shielded address based on mode)
  // eth_sendTransaction -> routes through shielded pool if privacy mode enabled
  // eth_sign, personal_sign -> standard signing
  
  // NullShift Privacy Extensions (non-standard):
  // nullshift_getShieldedBalance -> returns shielded balance
  // nullshift_sendShielded -> send via shielded transfer
  // nullshift_getPrivacyScore -> current privacy score
  // nullshift_isShieldedMode -> boolean
  
  isNullShift: true,
  isMetaMask: false, // don't impersonate
}

### 2. Content Script (content.js)
- Injects inpage.js into the page's main world
- Relays messages: inpage <-> background via window.postMessage + chrome.runtime
- Origin validation: only relay messages with correct source identifier
- Handle dApp detection: emit event when dApp tries to connect

### 3. Privacy-Aware Transaction Routing
When a dApp calls eth_sendTransaction:
- If shielded mode ON: route through ShieldedPool contract (user confirms in popup with proof generation)
- If shielded mode OFF: standard transaction (like MetaMask)
- Show clear UI indicator in popup: "Shielded" vs "Public"

### Requirements
- Full TypeScript source for inpage.js, content.js
- Message protocol types shared with background
- EIP-6963 provider discovery support
- Security: prevent page from accessing internal extension state
- Handle multiple wallet coexistence (don't conflict with MetaMask)
- Test with a mock dApp page
```

---

<a id="prompt-10"></a>
## Prompt 10: Side Panel — TX History & Proof Status

```
You are building the Chrome Side Panel for NullShift Wallet.

## Context
Side panel shows real-time activity and proof generation status. Always accessible while browsing.

## Components

### 1. Activity Feed
- Terminal-style scrolling log of all wallet activity
- Format: [HH:MM:SS] ACTION — details
- Examples:
  [14:32:01] SHIELD — 2.5 ETH deposited to shielded pool
  [14:32:45] PROOF  — Generating transfer proof... (12s)
  [14:32:57] SEND   — Shielded transfer complete
  [14:33:10] DAPP   — Uniswap connected (shielded mode)
  [14:35:22] SWAP   — Anonymous swap: 1 ETH -> 3200 USDC

### 2. Proof Generation Monitor
- When a ZK proof is being generated, show:
  - Circuit name (shielded_transfer, withdraw, etc.)
  - Progress bar (WASM execution time estimate)
  - Constraint count
  - "Proof generated in 8.3s — 65,536 constraints satisfied"

### 3. Privacy Dashboard Mini
- Current anonymity set size
- Number of shielded notes
- Privacy recommendations: "Consider shielding your 0.5 ETH public balance"

### Technical
- React + chrome.sidePanel API
- Real-time updates via chrome.runtime message listener
- Auto-scroll with pause-on-hover
- Max 500 entries in memory, older ones evicted
- Export log as .txt (terminal aesthetic)
```

---

<a id="prompt-11"></a>
## Prompt 11: SDK/Core — Proof Generation & Note Management

```
You are a TypeScript SDK engineer building the core library for a ZK privacy wallet.

## Context
The SDK (@nullshift/sdk) is the brain of the wallet. It runs in the extension's offscreen document (for WASM) and provides all crypto + ZK operations.

## Task
Build the core SDK with these modules:

### 1. Key Management (keys.ts)
- HD derivation: BIP-39 mnemonic -> BIP-44 path for ETH keys
- ZK key pair: spending_key (private) + viewing_key (public, allows balance decryption but not spending)
- Nullifier key derivation
- Encrypted vault: AES-256-GCM encryption of key material with user password

### 2. Note Management (notes.ts)
- Note creation: (pubkey, amount, token, salt) -> Pedersen commitment
- Note encryption: Encrypt note data with recipient's viewing key (so they can detect incoming notes)
- Note decryption: Scan new commitments, try decrypt with viewing key
- Local note store: IndexedDB for encrypted note cache
- UTXO selection algorithm: minimize number of inputs, prefer combining small notes

### 3. Proof Generation (prover.ts)
- Load Noir circuit ACIR artifact
- Initialize Barretenberg WASM backend
- Generate witness from inputs
- Create proof
- Expose progress callbacks for UI
- Cache proving key after first load
- API:
  async generateShieldedTransferProof(params: ShieldedTransferInput): Promise<ProofResult>
  async generateDepositProof(params: DepositInput): Promise<ProofResult>
  async generateWithdrawProof(params: WithdrawInput): Promise<ProofResult>
  async generateSwapProof(params: SwapInput): Promise<ProofResult>

### 4. Merkle Tree Sync (tree.ts)
- Listen to ShieldedPool contract events for new commitments
- Maintain local mirror of the Merkle tree
- Generate membership proofs for owned notes
- Efficient sync: only fetch new leaves since last sync

### 5. Transaction Builder (tx.ts)
- Compose full transaction flow: select UTXOs -> build circuit inputs -> generate proof -> format calldata -> submit to chain
- Relayer integration: format meta-transaction for anonymous swaps
- Gas estimation with proof verification costs

### Requirements
- Full TypeScript with strict types
- Works in Offscreen Document (DOM-less environment)
- bb.js for Barretenberg WASM integration
- ethers.js v6 for chain interaction
- Comprehensive error types (ProofGenerationError, InsufficientBalanceError, etc.)
- Unit tests with vitest
```

---

<a id="prompt-12"></a>
## Prompt 12: Integration — End-to-End Flow

```
You are a systems integration engineer connecting all NullShift Wallet components.

## Task
Document and implement the complete end-to-end flows:

### Flow 1: First-time Setup
1. User installs extension -> Popup shows onboarding
2. Generate or import mnemonic -> Derive ETH keys + ZK keys
3. Encrypt vault with password -> Store in chrome.storage.local
4. Initial Merkle tree sync from ShieldedPool contract
5. Ready state

### Flow 2: Shield ETH
1. User clicks "Shield" in popup -> Enters amount
2. Popup sends SHIELD_REQUEST to background
3. Background: SDK generates deposit commitment + proof
4. Background: builds deposit transaction (ETH value + commitment)
5. Popup shows confirmation: > SHIELD 1.0 ETH -> Shielded Pool [Y/n]
6. User confirms -> Background submits tx via ethers.js
7. Wait for confirmation -> SDK creates local note, syncs Merkle tree
8. Side panel logs: [OK] 1.0 ETH shielded. Note #47 created.
9. Popup updates shielded balance

### Flow 3: Shielded Transfer
1. User enters recipient shielded address + amount
2. SDK selects UTXOs (note selection algorithm)
3. SDK builds shielded_transfer circuit inputs
4. Offscreen document generates ZK proof (8-15 seconds)
5. Side panel shows proof progress bar
6. Proof ready -> build transact() calldata
7. Submit to ShieldedPool contract
8. Mark input notes as spent, add output note to local store
9. Encrypt note memo for recipient (they can detect with viewing key)

### Flow 4: Anonymous Swap via dApp
1. User visits Uniswap, connects NullShift Wallet (shielded mode)
2. dApp calls eth_sendTransaction for swap
3. Content script intercepts -> routes to background
4. Background: "This is a swap. Route through anonymous swap circuit?"
5. Popup: shows privacy-aware confirmation
6. SDK generates anonymous_swap proof
7. Submit to Relayer (or directly if user prefers less privacy but no relayer fee)
8. Relayer executes swap, re-shields output
9. User receives new shielded note with swapped token

### Deliverables
- Sequence diagrams (Mermaid) for each flow
- TypeScript interfaces for all inter-component messages
- Error handling: what happens if proof fails? tx reverts? extension crashes mid-proof?
- Recovery: how to resume from partial state
```

---

<a id="prompt-13"></a>
## Prompt 13: Security Audit Checklist

```
You are a blockchain security auditor reviewing a ZK privacy wallet.

## Task
Create a comprehensive security audit checklist for NullShift Wallet covering:

### ZK Circuit Security
- No under-constrained circuits (all private inputs are properly bound)
- Nullifier uniqueness: cannot create two valid nullifiers for same note
- Merkle proof verification: cannot forge membership for non-existent notes
- Amount overflow: range checks prevent wrapping attacks
- Frozen proofs: proofs cannot be replayed (bound to specific Merkle root)
- Viewing key separation: viewing key cannot derive spending key

### Smart Contract Security
- Reentrancy protection on deposit/withdraw
- Merkle root history: accept recent roots (handle reorgs)
- Nullifier cannot be front-run (nullifier is proof-derived, not user-chosen)
- ERC-20 approval/transfer safety (SafeERC20)
- Proof verification cannot be bypassed
- Contract upgrade safety (if upgradeable)

### Extension Security
- Private keys never leave encrypted vault except in memory
- Service worker doesn't persist sensitive data between activations
- Content script cannot access extension internal state
- Inpage script sandboxed from extension context
- Message validation: all cross-context messages type-checked and origin-verified
- No eval() or dynamic code execution
- CSP properly configured for WASM but blocks other unsafe operations

### Privacy Leaks
- Transaction timing analysis: add random delays to proof submission
- RPC privacy: use private RPC or Tor-routed requests
- Metadata leaks: extension doesn't reveal user activity to visited sites
- Note denomination: fixed denominations vs variable (tradeoff analysis)
- Graph analysis: recommend waiting for anonymity set growth before withdrawing

### Relayer Security
- Relayer cannot steal funds (proof binds output to user's key)
- Relayer cannot front-run swaps (commit-reveal or time-lock)
- Relayer fee is bounded and transparent
- Multiple relayer support (no single point of failure/censorship)

### Output
For each item: risk level (Critical/High/Medium/Low), mitigation strategy, and test case.
```

---

## Usage Guide

### With Claude CLI
```bash
# Extract and run a specific prompt (e.g., Prompt 2)
# Copy the content between the ``` blocks for the desired prompt

# Or use with pipe:
echo "[paste prompt here]" | claude

# Sequential build:
claude "$(cat prompt-1-architecture.md)"
```

### Recommended Build Order

```
Phase 1: Foundation
  [1] Architecture & Scaffolding  ->  Get structure approved

Phase 2: ZK Layer
  [2] Shielded Transfer Circuit   ->  Core privacy primitive
  [3] Deposit/Withdraw Circuits   ->  Shield/unshield flows
  [4] Anonymous Swap Circuit      ->  DeFi privacy
  * Test all circuits: nargo test

Phase 3: On-Chain
  [5] Solidity Contracts          ->  Deploy to local testnet
  * Test: forge test

Phase 4: SDK
  [11] Core SDK                   ->  Proof gen + note management
  * Test standalone: vitest

Phase 5: Extension
  [6] MV3 Skeleton                ->  Build pipeline working
  [7] Popup UI                    ->  Primary user interface
  [8] Dashboard                   ->  Advanced features
  [9] Content Script              ->  dApp integration
  [10] Side Panel                 ->  Activity monitoring

Phase 6: Integration
  [12] End-to-End Flows           ->  Wire everything together

Phase 7: Security
  [13] Audit Checklist            ->  Review before testnet
```

---

*NullShift Labs — "Privacy is not a feature, it's a foundation."*
