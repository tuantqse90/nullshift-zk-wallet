// ============================================================
// NullShift — Zustand Wallet Store
// ============================================================
// Shared state between popup, dashboard, and sidepanel.
// Communicates with background service worker via chrome.runtime.
// ============================================================

import { create } from 'zustand';
import type { Address, ChainId, OwnedNote, ActivityEntry } from '@nullshift/common';

interface WalletState {
  // Wallet status
  locked: boolean;
  hasWallet: boolean;
  address: Address | null;

  // Balances
  shieldedBalance: string;
  publicBalance: string;

  // Network
  chainId: ChainId;
  networkName: string;
  nativeSymbol: string;

  // Notes
  notes: OwnedNote[];

  // Activity
  activity: ActivityEntry[];

  // Proof status
  provingCircuit: string | null;
  provingProgress: number;

  // Actions
  setLocked: (locked: boolean) => void;
  setAddress: (address: Address | null) => void;
  setBalances: (shielded: string, publicBal: string) => void;
  setChain: (chainId: ChainId, name: string, symbol?: string) => void;
  setNotes: (notes: OwnedNote[]) => void;
  addActivity: (entry: ActivityEntry) => void;
  setProvingStatus: (circuit: string | null, progress: number) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  // Initial state
  locked: true,
  hasWallet: false,
  address: null,
  shieldedBalance: '0',
  publicBalance: '0',
  chainId: 143, // Default: Monad
  networkName: 'Monad',
  nativeSymbol: 'MON',
  notes: [],
  activity: [],
  provingCircuit: null,
  provingProgress: 0,

  // Actions
  setLocked: (locked) => set({ locked }),
  setAddress: (address) => set({ address, hasWallet: !!address }),
  setBalances: (shielded, publicBal) =>
    set({ shieldedBalance: shielded, publicBalance: publicBal }),
  setChain: (chainId, name, symbol) => set({ chainId, networkName: name, nativeSymbol: symbol ?? (chainId === 143 ? 'MON' : 'ETH') }),
  setNotes: (notes) => set({ notes }),
  addActivity: (entry) =>
    set((state) => ({
      activity: [entry, ...state.activity].slice(0, 500),
    })),
  setProvingStatus: (circuit, progress) =>
    set({ provingCircuit: circuit, provingProgress: progress }),
}));
