// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { useConfirmDialog } from './useConfirmDialog.js';

describe('useConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state (open=false, loading=false, data=null)', () => {
    let dialogState: ReturnType<typeof useConfirmDialog> | null = null;

    function TestComponent() {
      dialogState = useConfirmDialog({ onConfirm: vi.fn() });
      return <div data-testid="state">{String(dialogState.open)}</div>;
    }

    act(() => {
      render(<TestComponent />);
    });

    expect(dialogState).not.toBeNull();
    expect(dialogState!.open).toBe(false);
    expect(dialogState!.isLoading).toBe(false);
    expect(dialogState!.data).toBeNull();
  });

  it('opens dialog when trigger() is called', () => {
    let dialogState: ReturnType<typeof useConfirmDialog> | null = null;

    function TestComponent() {
      dialogState = useConfirmDialog({ onConfirm: vi.fn() });
      return (
        <div>
          <span data-testid="open">{String(dialogState.open)}</span>
          <button data-testid="trigger" onClick={() => dialogState!.trigger()}>
            Trigger
          </button>
        </div>
      );
    }

    act(() => {
      render(<TestComponent />);
    });

    expect(screen.getByTestId('open').textContent).toBe('false');

    act(() => {
      screen.getByTestId('trigger').click();
    });

    expect(screen.getByTestId('open').textContent).toBe('true');
    expect(dialogState!.open).toBe(true);
  });

  it('closes dialog when cancel() is called', () => {
    let dialogState: ReturnType<typeof useConfirmDialog> | null = null;

    function TestComponent() {
      dialogState = useConfirmDialog({ onConfirm: vi.fn() });
      return (
        <div>
          <span data-testid="open">{String(dialogState.open)}</span>
          <button data-testid="trigger" onClick={() => dialogState!.trigger()}>
            Trigger
          </button>
          <button data-testid="cancel" onClick={() => dialogState!.cancel()}>
            Cancel
          </button>
        </div>
      );
    }

    act(() => {
      render(<TestComponent />);
    });

    act(() => {
      screen.getByTestId('trigger').click();
    });
    expect(screen.getByTestId('open').textContent).toBe('true');

    act(() => {
      screen.getByTestId('cancel').click();
    });
    expect(screen.getByTestId('open').textContent).toBe('false');
    expect(dialogState!.isLoading).toBe(false);
  });

  it('passes data to trigger() and makes it available', () => {
    let dialogState: ReturnType<typeof useConfirmDialog<string>> | null = null;

    function TestComponent() {
      dialogState = useConfirmDialog<string>({ onConfirm: vi.fn() });
      return (
        <div>
          <span data-testid="open">{String(dialogState.open)}</span>
          <span data-testid="data">{dialogState.data ?? 'null'}</span>
          <button data-testid="trigger" onClick={() => dialogState!.trigger('item-123')}>
            Trigger
          </button>
        </div>
      );
    }

    act(() => {
      render(<TestComponent />);
    });

    expect(screen.getByTestId('data').textContent).toBe('null');

    act(() => {
      screen.getByTestId('trigger').click();
    });

    expect(screen.getByTestId('open').textContent).toBe('true');
    expect(dialogState!.data).toBe('item-123');
  });

  it('calls onConfirm with data when confirm() is executed', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    let dialogState: ReturnType<typeof useConfirmDialog<string>> | null = null;

    function TestComponent() {
      dialogState = useConfirmDialog<string>({ onConfirm });
      return (
        <div>
          <button data-testid="trigger" onClick={() => dialogState!.trigger('item-123')}>
            Trigger
          </button>
          <button data-testid="confirm" onClick={() => dialogState!.confirm()}>
            Confirm
          </button>
        </div>
      );
    }

    act(() => {
      render(<TestComponent />);
    });

    act(() => {
      screen.getByTestId('trigger').click();
    });

    await act(async () => {
      screen.getByTestId('confirm').click();
    });

    expect(onConfirm).toHaveBeenCalledWith('item-123');
  });

  it('calls onConfirm when confirm() is executed without data', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    let dialogState: ReturnType<typeof useConfirmDialog> | null = null;

    function TestComponent() {
      dialogState = useConfirmDialog({ onConfirm });
      return (
        <div>
          <button data-testid="trigger" onClick={() => dialogState!.trigger()}>
            Trigger
          </button>
          <button data-testid="confirm" onClick={() => dialogState!.confirm()}>
            Confirm
          </button>
        </div>
      );
    }

    act(() => {
      render(<TestComponent />);
    });

    act(() => {
      screen.getByTestId('trigger').click();
    });

    await act(async () => {
      screen.getByTestId('confirm').click();
    });

    expect(onConfirm).toHaveBeenCalled();
  });

  it('sets isLoading during confirm execution', async () => {
    let resolvePromise!: () => void;
    const confirmPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    const onConfirm = vi.fn().mockReturnValue(confirmPromise);
    let dialogState: ReturnType<typeof useConfirmDialog<string>> | null = null;

    function TestComponent() {
      dialogState = useConfirmDialog<string>({ onConfirm });
      return (
        <div>
          <span data-testid="loading">{String(dialogState.isLoading)}</span>
          <span data-testid="open">{String(dialogState.open)}</span>
          <button data-testid="trigger" onClick={() => dialogState!.trigger('item-123')}>
            Trigger
          </button>
          <button data-testid="confirm" onClick={() => dialogState!.confirm()}>
            Confirm
          </button>
        </div>
      );
    }

    act(() => {
      render(<TestComponent />);
    });

    act(() => {
      screen.getByTestId('trigger').click();
    });

    // Start confirm - this sets isLoading and doesn't resolve immediately
    act(() => {
      screen.getByTestId('confirm').click();
    });

    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(dialogState!.isLoading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise();
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('open').textContent).toBe('false');
    expect(dialogState!.isLoading).toBe(false);
    expect(dialogState!.open).toBe(false);
  });

  it('resets state after confirm completes', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    let dialogState: ReturnType<typeof useConfirmDialog<string>> | null = null;

    function TestComponent() {
      dialogState = useConfirmDialog<string>({ onConfirm });
      return (
        <div>
          <span data-testid="open">{String(dialogState.open)}</span>
          <span data-testid="loading">{String(dialogState.isLoading)}</span>
          <span data-testid="data">{dialogState.data ?? 'null'}</span>
          <button data-testid="trigger" onClick={() => dialogState!.trigger('item-123')}>
            Trigger
          </button>
          <button data-testid="confirm" onClick={() => dialogState!.confirm()}>
            Confirm
          </button>
        </div>
      );
    }

    act(() => {
      render(<TestComponent />);
    });

    act(() => {
      screen.getByTestId('trigger').click();
    });

    await act(async () => {
      screen.getByTestId('confirm').click();
    });

    expect(screen.getByTestId('open').textContent).toBe('false');
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('data').textContent).toBe('null');
  });

  it('resets state after confirm even if onConfirm throws', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('fail'));
    let dialogState: ReturnType<typeof useConfirmDialog<string>> | null = null;

    function TestComponent() {
      dialogState = useConfirmDialog<string>({ onConfirm });
      return (
        <div>
          <span data-testid="open">{String(dialogState.open)}</span>
          <span data-testid="loading">{String(dialogState.isLoading)}</span>
          <span data-testid="data">{dialogState.data ?? 'null'}</span>
          <button data-testid="trigger" onClick={() => dialogState!.trigger('item-123')}>
            Trigger
          </button>
          <button data-testid="confirm" onClick={() => dialogState!.confirm()}>
            Confirm
          </button>
        </div>
      );
    }

    act(() => {
      render(<TestComponent />);
    });

    act(() => {
      screen.getByTestId('trigger').click();
    });

    await act(async () => {
      screen.getByTestId('confirm').click();
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('open').textContent).toBe('false');
    expect(screen.getByTestId('data').textContent).toBe('null');
  });
});
