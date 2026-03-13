import { describe, it, expect } from 'vitest';
import { useWalletStore } from '../src/shared/state/walletStore';

describe('walletStore', () => {
  it('initializes with locked state', () => {
    const state = useWalletStore.getState();
    expect(state.locked).toBe(true);
    expect(state.hasWallet).toBe(false);
    expect(state.address).toBeNull();
  });

  it('defaults to Monad network', () => {
    const state = useWalletStore.getState();
    expect(state.chainId).toBe(143);
    expect(state.networkName).toBe('Monad');
    expect(state.nativeSymbol).toBe('MON');
  });

  it('setLocked updates locked state', () => {
    useWalletStore.getState().setLocked(false);
    expect(useWalletStore.getState().locked).toBe(false);
    useWalletStore.getState().setLocked(true);
    expect(useWalletStore.getState().locked).toBe(true);
  });

  it('setAddress updates address and hasWallet', () => {
    useWalletStore.getState().setAddress('0x1234567890abcdef' as `0x${string}`);
    const state = useWalletStore.getState();
    expect(state.address).toBe('0x1234567890abcdef');
    expect(state.hasWallet).toBe(true);
  });

  it('setBalances updates both balances', () => {
    useWalletStore.getState().setBalances('1.5', '2.3');
    const state = useWalletStore.getState();
    expect(state.shieldedBalance).toBe('1.5');
    expect(state.publicBalance).toBe('2.3');
  });

  it('setChain updates chainId and networkName', () => {
    useWalletStore.getState().setChain(11155111, 'Ethereum Sepolia', 'ETH');
    const state = useWalletStore.getState();
    expect(state.chainId).toBe(11155111);
    expect(state.networkName).toBe('Ethereum Sepolia');
    expect(state.nativeSymbol).toBe('ETH');
  });

  it('setChain defaults symbol for Monad', () => {
    useWalletStore.getState().setChain(143, 'Monad');
    expect(useWalletStore.getState().nativeSymbol).toBe('MON');
  });

  it('addActivity prepends to activity list', () => {
    const entry = {
      id: '1',
      type: 'SHIELD' as const,
      message: 'Shielded 1 MON',
      timestamp: Date.now(),
    };
    useWalletStore.getState().addActivity(entry);
    const state = useWalletStore.getState();
    expect(state.activity[0]).toEqual(entry);
  });

  it('setProvingStatus updates circuit and progress', () => {
    useWalletStore.getState().setProvingStatus('deposit', 42);
    const state = useWalletStore.getState();
    expect(state.provingCircuit).toBe('deposit');
    expect(state.provingProgress).toBe(42);
  });

  it('setProvingStatus clears on null', () => {
    useWalletStore.getState().setProvingStatus(null, 0);
    const state = useWalletStore.getState();
    expect(state.provingCircuit).toBeNull();
    expect(state.provingProgress).toBe(0);
  });
});
