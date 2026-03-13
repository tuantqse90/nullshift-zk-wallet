import { useEffect, useState } from 'react';
import { useWalletStore } from '../../shared/state/walletStore';
import { sendToBackground } from '../../shared/utils/messaging';
import type { ChainId } from '@nullshift/common';

type Modal = 'shield' | 'send' | 'unshield' | null;

export function HomeScreen() {
  const {
    shieldedBalance,
    publicBalance,
    networkName,
    address,
    provingCircuit,
    provingProgress,
    setBalances,
    setLocked,
    setChain,
  } = useWalletStore();

  const [showShielded, setShowShielded] = useState(false);
  const [modal, setModal] = useState<Modal>(null);

  useEffect(() => {
    sendToBackground('GET_BALANCE', { token: undefined }, 'popup')
      .then((result) => setBalances(result.shielded, result.public))
      .catch(console.error);

    sendToBackground('GET_NETWORK', undefined, 'popup')
      .then((net) => {
        if (net?.chainId && net?.name) {
          setChain(net.chainId as ChainId, net.name as string);
        }
      })
      .catch(console.error);
  }, []);

  const privacyScore = (() => {
    const s = parseFloat(shieldedBalance) || 0;
    const p = parseFloat(publicBalance) || 0;
    const total = s + p;
    if (total === 0) return 0;
    return Math.round((s / total) * 100);
  })();

  const handleLock = () => {
    sendToBackground('LOCK_WALLET', undefined, 'popup')
      .then(() => setLocked(true))
      .catch(console.error);
  };

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '---';

  return (
    <div className="h-screen bg-ns-bg-primary flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ns-border">
        <h1 className="font-mono text-sm">
          <span className="text-ns-primary">null</span>
          <span className="text-ns-text-dim">shift.sh</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-ns-secondary">{networkName}</span>
          <button
            onClick={handleLock}
            className="font-mono text-xs text-ns-text-dim hover:text-ns-accent"
            title="Lock wallet"
          >
            [lock]
          </button>
        </div>
      </div>

      {/* Address */}
      <div className="px-4 pt-3">
        <p className="font-mono text-xs text-ns-text-dim">
          // {shortAddr}
        </p>
      </div>

      {/* Balance */}
      <div className="px-4 py-4">
        <p className="font-mono text-xs text-ns-text-dim">// shielded balance</p>
        <div
          className="font-mono text-3xl text-ns-text-bright mt-1 cursor-pointer"
          onClick={() => setShowShielded(!showShielded)}
        >
          {showShielded ? `${shieldedBalance} ETH` : '\u2588\u2588\u2588\u2588\u2588\u2588 ETH'}
        </div>
        <p className="font-mono text-xs text-ns-text-dim mt-1">
          {showShielded ? '' : '(click to reveal)'}
        </p>

        <p className="font-mono text-xs text-ns-text-dim mt-3">// public balance</p>
        <p className="font-mono text-lg text-ns-text">{publicBalance} ETH</p>

        {/* Privacy Score */}
        <div className="mt-3">
          <p className="font-mono text-xs text-ns-text-dim">
            Privacy: {privacyScore}%
          </p>
          <div className="w-full h-2 bg-ns-bg-card rounded mt-1">
            <div
              className="h-full bg-ns-primary rounded transition-all"
              style={{ width: `${privacyScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Proving indicator */}
      {provingCircuit && (
        <div className="mx-4 mb-2 px-3 py-2 bg-ns-bg-card border border-ns-primary rounded">
          <p className="font-mono text-xs text-ns-primary">
            Generating proof: {provingCircuit} ({provingProgress}%)
          </p>
          <div className="w-full h-1 bg-ns-bg-primary rounded mt-1">
            <div
              className="h-full bg-ns-primary rounded transition-all"
              style={{ width: `${provingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-4 grid grid-cols-3 gap-2">
        <ActionButton label="> Shield" onClick={() => setModal('shield')} />
        <ActionButton label="> Send" onClick={() => setModal('send')} />
        <ActionButton label="> Unshield" onClick={() => setModal('unshield')} />
      </div>

      {/* Activity Feed */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <p className="font-mono text-xs text-ns-text-dim mb-2">// recent activity</p>
        <p className="font-mono text-xs text-ns-text-dim">No activity yet</p>
      </div>

      {/* Modals */}
      {modal === 'shield' && <ShieldModal onClose={() => setModal(null)} />}
      {modal === 'send' && <SendModal onClose={() => setModal(null)} />}
      {modal === 'unshield' && <UnshieldModal onClose={() => setModal(null)} />}
    </div>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn btn-ghost text-xs py-2">
      {label}
    </button>
  );
}

// ---- Modals ----

function ModalOverlay({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
      <div className="w-full bg-ns-bg-primary border-t border-ns-border rounded-t-xl p-4 max-h-[80vh]">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-sm text-ns-text-bright">{title}</p>
          <button
            onClick={onClose}
            className="font-mono text-xs text-ns-text-dim hover:text-ns-accent"
          >
            [x]
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ShieldModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleShield = async () => {
    if (!amount) return;
    setLoading(true);
    setStatus('Shielding funds...');
    try {
      await sendToBackground('SHIELD_FUNDS', {
        amount: BigInt(Math.floor(parseFloat(amount) * 1e18)),
        token: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      }, 'popup');
      setStatus('Shielded successfully!');
      setTimeout(onClose, 1500);
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay title="// shield funds" onClose={onClose}>
      <input
        type="text"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (ETH)"
        className="w-full bg-ns-bg-card border border-ns-border rounded px-3 py-2 font-mono text-sm text-ns-text-bright placeholder-ns-text-dim focus:border-ns-primary focus:outline-none mb-3"
        autoFocus
      />
      {status && (
        <p className="font-mono text-xs text-ns-secondary mb-3">{status}</p>
      )}
      <button
        onClick={handleShield}
        disabled={loading || !amount}
        className="btn btn-primary w-full disabled:opacity-50"
      >
        {loading ? '> Processing...' : '> Shield'}
      </button>
    </ModalOverlay>
  );
}

function SendModal({ onClose }: { onClose: () => void }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleSend = async () => {
    if (!recipient || !amount) return;
    setLoading(true);
    setStatus('Generating ZK proof...');
    try {
      await sendToBackground('SEND_SHIELDED', {
        recipientPubkey: recipient as `0x${string}`,
        amount: BigInt(Math.floor(parseFloat(amount) * 1e18)),
        token: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      }, 'popup');
      setStatus('Transfer sent!');
      setTimeout(onClose, 1500);
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay title="// shielded send" onClose={onClose}>
      <input
        type="text"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="Recipient public key"
        className="w-full bg-ns-bg-card border border-ns-border rounded px-3 py-2 font-mono text-sm text-ns-text-bright placeholder-ns-text-dim focus:border-ns-primary focus:outline-none mb-3"
        autoFocus
      />
      <input
        type="text"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (ETH)"
        className="w-full bg-ns-bg-card border border-ns-border rounded px-3 py-2 font-mono text-sm text-ns-text-bright placeholder-ns-text-dim focus:border-ns-primary focus:outline-none mb-3"
      />
      {status && (
        <p className="font-mono text-xs text-ns-secondary mb-3">{status}</p>
      )}
      <button
        onClick={handleSend}
        disabled={loading || !recipient || !amount}
        className="btn btn-primary w-full disabled:opacity-50"
      >
        {loading ? '> Proving...' : '> Send'}
      </button>
    </ModalOverlay>
  );
}

function UnshieldModal({ onClose }: { onClose: () => void }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleUnshield = async () => {
    if (!recipient || !amount) return;
    setLoading(true);
    setStatus('Generating withdrawal proof...');
    try {
      await sendToBackground('UNSHIELD_FUNDS', {
        amount: BigInt(Math.floor(parseFloat(amount) * 1e18)),
        recipient: recipient as `0x${string}`,
        token: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      }, 'popup');
      setStatus('Withdrawal submitted!');
      setTimeout(onClose, 1500);
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay title="// unshield (withdraw)" onClose={onClose}>
      <input
        type="text"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="Recipient address (0x...)"
        className="w-full bg-ns-bg-card border border-ns-border rounded px-3 py-2 font-mono text-sm text-ns-text-bright placeholder-ns-text-dim focus:border-ns-primary focus:outline-none mb-3"
        autoFocus
      />
      <input
        type="text"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (ETH)"
        className="w-full bg-ns-bg-card border border-ns-border rounded px-3 py-2 font-mono text-sm text-ns-text-bright placeholder-ns-text-dim focus:border-ns-primary focus:outline-none mb-3"
      />
      {status && (
        <p className="font-mono text-xs text-ns-secondary mb-3">{status}</p>
      )}
      <button
        onClick={handleUnshield}
        disabled={loading || !recipient || !amount}
        className="btn btn-primary w-full disabled:opacity-50"
      >
        {loading ? '> Proving...' : '> Withdraw'}
      </button>
    </ModalOverlay>
  );
}
