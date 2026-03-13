import { useEffect } from 'react';
import { useWalletStore } from '../shared/state/walletStore';
import { sendToBackground, onMessage } from '../shared/utils/messaging';
import type { ActivityEntry, ProofProgress } from '@nullshift/common';

export function SidePanelApp() {
  const {
    activity,
    notes,
    provingCircuit,
    provingProgress,
    addActivity,
    setProvingStatus,
    setNotes,
  } = useWalletStore();

  useEffect(() => {
    // Fetch initial activity
    sendToBackground('GET_ACTIVITY', { limit: 50 }, 'sidepanel')
      .then((result) => {
        result.entries.forEach((e: ActivityEntry) => addActivity(e));
      })
      .catch(console.error);

    // Fetch notes for privacy stats
    sendToBackground('GET_NOTES', { status: 'unspent' }, 'sidepanel')
      .then((result) => setNotes(result.notes))
      .catch(console.error);

    // Listen for background events
    onMessage((message) => {
      if (message.type === 'NEW_ACTIVITY') {
        addActivity(message.payload as ActivityEntry);
      }
      if (message.type === 'PROOF_PROGRESS') {
        const p = message.payload as ProofProgress;
        setProvingStatus(p.circuit, p.percent);
      }
      if (message.type === 'PROOF_COMPLETE') {
        setProvingStatus(null, 0);
      }
    });
  }, []);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const typeColor = (type: ActivityEntry['type']) => {
    switch (type) {
      case 'ERROR': return 'text-ns-accent';
      case 'PROOF': return 'text-ns-secondary';
      default: return 'text-ns-primary';
    }
  };

  const unspentCount = notes.filter((n) => !n.spent).length;

  return (
    <div className="h-screen bg-ns-bg-primary flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ns-border">
        <h1 className="font-mono text-sm">
          <span className="text-ns-primary">null</span>
          <span className="text-ns-text-dim">shift.sh</span>
          <span className="text-ns-text-dim text-xs ml-2">// activity</span>
        </h1>
      </div>

      {/* Proof Monitor */}
      {provingCircuit && (
        <div className="px-4 py-3 border-b border-ns-border bg-ns-bg-secondary">
          <p className="font-mono text-xs text-ns-secondary">
            &gt; Generating proof: {provingCircuit}
          </p>
          <div className="w-full h-1.5 bg-ns-bg-card rounded mt-2">
            <div
              className="h-full bg-ns-secondary rounded transition-all"
              style={{ width: `${provingProgress}%` }}
            />
          </div>
          <p className="font-mono text-xs text-ns-text-dim mt-1">{provingProgress}%</p>
        </div>
      )}

      {/* Activity Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="font-mono text-xs text-ns-text-dim mb-3">
          nullshift@labs$ tail -f /var/log/wallet.log
        </p>

        {activity.length === 0 ? (
          <p className="font-mono text-xs text-ns-text-dim">// Waiting for activity...</p>
        ) : (
          activity.map((entry) => (
            <div key={entry.id} className="mb-1">
              <span className="font-mono text-xs text-ns-text-dim">
                [{formatTime(entry.timestamp)}]
              </span>{' '}
              <span className={`font-mono text-xs font-semibold ${typeColor(entry.type)}`}>
                {entry.type.padEnd(8)}
              </span>{' '}
              <span className="font-mono text-xs text-ns-text-DEFAULT">
                {entry.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Privacy Dashboard Footer */}
      <div className="px-4 py-3 border-t border-ns-border">
        <p className="font-mono text-xs text-ns-text-dim mb-2">// privacy dashboard</p>
        <div className="flex justify-between">
          <span className="font-mono text-xs text-ns-text-DEFAULT">Notes: {unspentCount}</span>
          <span className="font-mono text-xs text-ns-text-DEFAULT">Anonymity set: {notes.length}</span>
        </div>

        {/* Recommendations */}
        <div className="mt-2 pt-2 border-t border-ns-border space-y-1">
          {unspentCount === 0 && (
            <p className="font-mono text-xs text-ns-secondary">
              &gt; Shield funds to start building privacy
            </p>
          )}
          {unspentCount > 0 && unspentCount < 3 && (
            <p className="font-mono text-xs text-ns-secondary">
              &gt; Make more shielded txs to grow anonymity set
            </p>
          )}
          {unspentCount > 5 && (
            <p className="font-mono text-xs text-ns-secondary">
              &gt; Consider merging notes to reduce UTXO count
            </p>
          )}
          {notes.length >= 3 && (
            <p className="font-mono text-xs text-ns-primary">
              [GOOD] Anonymity set growing
            </p>
          )}
          {activity.length === 0 && (
            <p className="font-mono text-xs text-ns-text-dim">
              // No activity yet — start shielding
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
