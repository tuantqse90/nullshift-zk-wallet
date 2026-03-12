import { useState } from 'react';
import { useWalletStore } from '../../shared/state/walletStore';
import { sendToBackground } from '../../shared/utils/messaging';

export function LockScreen() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setLocked, setAddress, hasWallet } = useWalletStore();

  const handleUnlock = async () => {
    if (!password) return;
    setLoading(true);
    setError('');

    try {
      if (hasWallet) {
        const result = await sendToBackground('UNLOCK_WALLET', { password }, 'popup');
        if (result.success) {
          if (result.address) setAddress(result.address);
          setLocked(false);
        }
      } else {
        if (password.length < 6) {
          setError('[ERR] Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const result = await sendToBackground('CREATE_WALLET', { password }, 'popup');
        setAddress(result.address);
        setLocked(false);
      }
    } catch (err) {
      setError((err as Error).message || '[ERR] Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-ns-bg-primary flex flex-col items-center justify-center px-8">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="font-mono text-2xl">
          <span className="text-ns-primary">null</span>
          <span className="text-ns-text-dim">shift.sh</span>
        </h1>
        <p className="font-mono text-xs text-ns-text-dim mt-1">
          // privacy wallet
        </p>
      </div>

      {/* Password input */}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
        placeholder={hasWallet ? 'enter password' : 'create password (min 6 chars)'}
        className="w-full bg-ns-bg-card border border-ns-border rounded-md px-4 py-3 font-mono text-sm text-ns-text-bright placeholder-ns-text-dim focus:border-ns-primary focus:outline-none mb-4"
        autoFocus
      />

      {/* Error */}
      {error && (
        <p className="font-mono text-xs text-ns-accent mb-4">{error}</p>
      )}

      {/* Submit */}
      <button
        onClick={handleUnlock}
        disabled={loading || !password}
        className="btn btn-primary w-full disabled:opacity-50"
      >
        {loading
          ? '> Authenticating...'
          : hasWallet
            ? '> Enter the void'
            : '> Create wallet'}
      </button>

      {/* Terminal prompt */}
      <p className="font-mono text-xs text-ns-text-dim mt-8">
        <span className="text-ns-primary">nullshift@labs$</span>{' '}
        <span className="animate-blink">_</span>
      </p>
    </div>
  );
}
