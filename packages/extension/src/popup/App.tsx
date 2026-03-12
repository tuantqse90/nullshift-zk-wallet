import { useEffect, useState } from 'react';
import { useWalletStore } from '../shared/state/walletStore';
import { sendToBackground } from '../shared/utils/messaging';
import { onMessage } from '../shared/utils/messaging';
import { LockScreen } from './screens/LockScreen';
import { HomeScreen } from './screens/HomeScreen';

export function PopupApp() {
  const { locked, setLocked, setAddress, setProvingStatus } = useWalletStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check wallet status on mount
    sendToBackground('GET_WALLET_STATUS', undefined, 'popup')
      .then((status) => {
        setLocked(status.locked);
        if (status.address) setAddress(status.address);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Listen for background broadcasts
    onMessage((message) => {
      if (message.type === 'LOCK_WALLET') {
        setLocked(true);
      }
      if (message.type === 'PROOF_PROGRESS' && message.payload) {
        const p = message.payload as { circuit: string; percent: number };
        setProvingStatus(p.circuit, p.percent);
      }
      if (message.type === 'PROOF_COMPLETE') {
        setProvingStatus(null, 0);
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-ns-bg-primary flex items-center justify-center">
        <p className="font-mono text-ns-primary animate-pulse">
          nullshift@labs$ loading...
        </p>
      </div>
    );
  }

  if (locked) {
    return <LockScreen />;
  }

  return <HomeScreen />;
}
