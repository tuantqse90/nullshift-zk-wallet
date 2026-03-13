import { useEffect, useState } from 'react';
import { useWalletStore } from '../shared/state/walletStore';
import { sendToBackground, onMessage } from '../shared/utils/messaging';
import type { ActivityEntry, ChainId, OwnedNote } from '@nullshift/common';

type Tab = 'portfolio' | 'notes' | 'activity' | 'settings';

export function DashboardApp() {
  const {
    locked,
    address,
    shieldedBalance,
    publicBalance,
    networkName,
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
          setChain(net.chainId as ChainId, net.name as string);
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
          {(['portfolio', 'notes', 'activity', 'settings'] as Tab[]).map((t) => (
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
          />
        )}
        {tab === 'notes' && <NotesTab notes={notes} />}
        {tab === 'activity' && <ActivityTab activity={activity} />}
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
}: {
  shieldedBalance: string;
  publicBalance: string;
  privacyScore: number;
  noteCount: number;
}) {
  return (
    <>
      <h2 className="font-mono text-lg text-ns-text-bright mb-4">// portfolio overview</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
          <p className="font-mono text-xs text-ns-text-dim">Shielded Balance</p>
          <p className="font-mono text-2xl text-ns-primary mt-1">{shieldedBalance} ETH</p>
        </div>
        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
          <p className="font-mono text-xs text-ns-text-dim">Public Balance</p>
          <p className="font-mono text-2xl text-ns-text-bright mt-1">{publicBalance} ETH</p>
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
            {(parseFloat(shieldedBalance) + parseFloat(publicBalance)).toFixed(4)} ETH
          </p>
        </div>
      </div>
    </>
  );
}

// ---- Notes Tab ----
function NotesTab({ notes }: { notes: OwnedNote[] }) {
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
                  <span className="text-ns-primary">{formatAmount(note.amount)} ETH</span>
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

// ---- Settings Tab ----

const AVAILABLE_NETWORKS = [
  { chainId: 11155111 as ChainId, name: 'Ethereum Sepolia' },
  { chainId: 31337 as ChainId, name: 'Anvil Local' },
  { chainId: 1 as ChainId, name: 'Ethereum Mainnet' },
  { chainId: 10143 as ChainId, name: 'Monad Testnet' },
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

  return (
    <>
      <h2 className="font-mono text-lg text-ns-text-bright mb-4">// settings</h2>

      <div className="space-y-4">
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

        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
          <p className="font-mono text-xs text-ns-text-dim mb-2">Address</p>
          <p className="font-mono text-sm text-ns-text-bright break-all">{address ?? '---'}</p>
        </div>

        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
          <p className="font-mono text-xs text-ns-text-dim mb-2">Security</p>
          <button
            onClick={handleLock}
            className="btn btn-ghost text-xs"
          >
            &gt; Lock wallet
          </button>
        </div>

        <div className="bg-ns-bg-card border border-ns-border rounded-lg p-4">
          <p className="font-mono text-xs text-ns-text-dim mb-2">About</p>
          <p className="font-mono text-xs text-ns-text-DEFAULT">NullShift ZK Privacy Wallet v0.1.0</p>
          <p className="font-mono text-xs text-ns-text-dim mt-1">Noir + UltraPlonk + Barretenberg WASM</p>
        </div>
      </div>
    </>
  );
}
