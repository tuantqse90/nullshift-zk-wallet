import { useState } from 'react';
import { useWalletStore } from '../../shared/state/walletStore';
import { sendToBackground } from '../../shared/utils/messaging';

type Mode = 'default' | 'import' | 'backup';

export function LockScreen() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('default');
  const [mnemonic, setMnemonic] = useState('');
  const [backupMnemonic, setBackupMnemonic] = useState('');
  const [backupConfirmed, setBackupConfirmed] = useState(false);
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
        // Show seed backup screen
        setBackupMnemonic((result as { mnemonic: string }).mnemonic);
        setMode('backup');
      }
    } catch (err) {
      setError((err as Error).message || '[ERR] Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!password || !mnemonic.trim()) return;
    setLoading(true);
    setError('');

    try {
      if (password.length < 6) {
        setError('[ERR] Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      const words = mnemonic.trim().split(/\s+/);
      if (words.length !== 12 && words.length !== 24) {
        setError('[ERR] Mnemonic must be 12 or 24 words');
        setLoading(false);
        return;
      }
      const result = await sendToBackground('IMPORT_WALLET', {
        mnemonic: mnemonic.trim(),
        password,
      }, 'popup');
      setAddress(result.address);
      setLocked(false);
    } catch (err) {
      setError((err as Error).message || '[ERR] Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDone = () => {
    setBackupMnemonic('');
    setMode('default');
    setLocked(false);
  };

  // ---- Seed Backup Screen ----
  if (mode === 'backup' && backupMnemonic) {
    const words = backupMnemonic.split(' ');
    return (
      <div className="h-screen bg-ns-bg-primary flex flex-col px-6 py-8 overflow-y-auto">
        <h2 className="font-mono text-lg text-ns-primary mb-2">
          &gt; Backup your seed phrase
        </h2>
        <p className="font-mono text-xs text-ns-text-dim mb-4">
          // Write these words down. Store offline. Never share.
        </p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {words.map((word, i) => (
            <div
              key={i}
              className="bg-ns-bg-card border border-ns-border rounded px-2 py-1.5 font-mono text-xs text-ns-text-bright"
            >
              <span className="text-ns-text-dim mr-1">{i + 1}.</span>
              {word}
            </div>
          ))}
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={backupConfirmed}
            onChange={(e) => setBackupConfirmed(e.target.checked)}
            className="accent-ns-primary"
          />
          <span className="font-mono text-xs text-ns-text-dim">
            I have saved my seed phrase securely
          </span>
        </label>

        <button
          onClick={handleBackupDone}
          disabled={!backupConfirmed}
          className="btn btn-primary w-full disabled:opacity-50"
        >
          &gt; Continue
        </button>

        <p className="font-mono text-[10px] text-ns-accent mt-3 text-center">
          WARNING: If you lose this phrase, your funds are gone forever.
        </p>
      </div>
    );
  }

  // ---- Import Wallet Screen ----
  if (mode === 'import') {
    return (
      <div className="h-screen bg-ns-bg-primary flex flex-col items-center justify-center px-8">
        <div className="mb-6 text-center">
          <h1 className="font-mono text-2xl">
            <span className="text-ns-primary">null</span>
            <span className="text-ns-text-dim">shift.sh</span>
          </h1>
          <p className="font-mono text-xs text-ns-text-dim mt-1">
            // import existing wallet
          </p>
        </div>

        <textarea
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          placeholder="enter 12 or 24 word seed phrase..."
          rows={3}
          className="w-full bg-ns-bg-card border border-ns-border rounded-md px-4 py-3 font-mono text-xs text-ns-text-bright placeholder-ns-text-dim focus:border-ns-primary focus:outline-none mb-3 resize-none"
          autoFocus
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          placeholder="create password (min 6 chars)"
          className="w-full bg-ns-bg-card border border-ns-border rounded-md px-4 py-3 font-mono text-sm text-ns-text-bright placeholder-ns-text-dim focus:border-ns-primary focus:outline-none mb-3"
        />

        {error && (
          <p className="font-mono text-xs text-ns-accent mb-3">{error}</p>
        )}

        <button
          onClick={handleImport}
          disabled={loading || !password || !mnemonic.trim()}
          className="btn btn-primary w-full disabled:opacity-50 mb-3"
        >
          {loading ? '> Importing...' : '> Import wallet'}
        </button>

        <button
          onClick={() => { setMode('default'); setError(''); setMnemonic(''); }}
          className="font-mono text-xs text-ns-text-dim hover:text-ns-primary"
        >
          &lt; back
        </button>
      </div>
    );
  }

  // ---- Default Lock/Create Screen ----
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

      {/* Import link */}
      {!hasWallet && (
        <button
          onClick={() => setMode('import')}
          className="font-mono text-xs text-ns-text-dim hover:text-ns-primary mt-4"
        >
          &gt; Import existing wallet
        </button>
      )}

      {/* Terminal prompt */}
      <p className="font-mono text-xs text-ns-text-dim mt-8">
        <span className="text-ns-primary">nullshift@labs$</span>{' '}
        <span className="animate-blink">_</span>
      </p>
    </div>
  );
}
