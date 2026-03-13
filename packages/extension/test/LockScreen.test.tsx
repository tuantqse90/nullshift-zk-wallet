import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LockScreen } from '../src/popup/screens/LockScreen';

// Mock messaging
vi.mock('../src/shared/utils/messaging', () => ({
  sendToBackground: vi.fn().mockResolvedValue({ success: true, address: '0x1234' }),
}));

// Mock store
const mockSetLocked = vi.fn();
const mockSetAddress = vi.fn();
vi.mock('../src/shared/state/walletStore', () => ({
  useWalletStore: () => ({
    hasWallet: true,
    setLocked: mockSetLocked,
    setAddress: mockSetAddress,
  }),
}));

describe('LockScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the NullShift branding', () => {
    render(<LockScreen />);
    expect(screen.getByText('null')).toBeInTheDocument();
    expect(screen.getByText('shift.sh')).toBeInTheDocument();
  });

  it('renders password input', () => {
    render(<LockScreen />);
    const input = screen.getByPlaceholderText(/password/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders unlock button when wallet exists', () => {
    render(<LockScreen />);
    expect(screen.getByText(/Enter the void/i)).toBeInTheDocument();
  });

  it('disables button when password is empty', () => {
    render(<LockScreen />);
    const button = screen.getByRole('button', { name: /Enter the void/i });
    expect(button).toBeDisabled();
  });

  it('enables button when password has 6+ chars', () => {
    render(<LockScreen />);
    const input = screen.getByPlaceholderText(/password/i);
    fireEvent.change(input, { target: { value: 'mypassword123' } });
    const button = screen.getByRole('button', { name: /Enter the void/i });
    expect(button).not.toBeDisabled();
  });

  it('renders terminal prompt', () => {
    render(<LockScreen />);
    expect(screen.getByText(/nullshift@labs\$/)).toBeInTheDocument();
  });
});
