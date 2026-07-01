// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { act as reactAct } from 'react';
import { ConfirmDialog } from './ConfirmDialog.js';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';

/**
 * 🧪 Case 3 Integration Test — Auth TenantManagementContainer Pattern
 *
 * Validates the exact consumption pattern used by
 * ABDAuth/src/components/admin/tenants/TenantManagementContainer.tsx:
 *
 *   1. useConfirmDialog<string> with an onConfirm that calls fetch
 *      wrapped in toast.promise — tested here as a simpler equivalent
 *   2. <ConfirmDialog> wired to the hook's state
 *   3. Full trigger → dialog open → confirm → fetch → close lifecycle
 *
 * This covers the Auth TenantManagementContainer route that is
 * not accessible via E2E (it redirects to Gobernance).
 * The Gobernance TenantManagementContainer uses the identical pattern.
 */

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function TestComponent({ id }: { id: string }) {
  const deleteDialog = useConfirmDialog<string>({
    onConfirm: async (itemId) => {
      const response = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al eliminar item');
      }
    },
  });

  return (
    <div>
      <button
        aria-label="Delete item"
        onClick={() => deleteDialog.trigger(id)}
      >
        Delete
      </button>

      <ConfirmDialog
        open={deleteDialog.open}
        title="ELIMINAR ITEM"
        message="¿Estás seguro de eliminar este elemento?"
        confirmLabel="ELIMINAR"
        cancelLabel="CANCELAR"
        variant="danger"
        isLoading={deleteDialog.isLoading}
        onConfirm={deleteDialog.confirm}
        onCancel={deleteDialog.cancel}
      />
    </div>
  );
}

describe('Case 3 — Auth TenantManagementContainer (consumption pattern)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens ConfirmDialog when delete button is clicked', () => {
    reactAct(() => {
      render(<TestComponent id="item-456" />);
    });

    // Dialog should not be visible initially
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    // Click delete button to trigger the dialog
    reactAct(() => {
      fireEvent.click(screen.getByLabelText('Delete item'));
    });

    // Dialog should now be visible with all expected content
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('ELIMINAR ITEM')).toBeInTheDocument();
    expect(
      screen.getByText('¿Estás seguro de eliminar este elemento?')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'ELIMINAR' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('CANCELAR')
    ).toBeInTheDocument();
  });

  it('cancel closes the dialog without calling the API', async () => {
    reactAct(() => {
      render(<TestComponent id="item-456" />);
    });

    // Open dialog
    reactAct(() => {
      fireEvent.click(screen.getByLabelText('Delete item'));
    });
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    // Click cancel — should close dialog
    reactAct(() => {
      fireEvent.click(screen.getByText('CANCELAR'));
    });

    // API should NOT have been called
    expect(mockFetch).not.toHaveBeenCalled();

    // Wait for exit animation (ANIM_DURATION = 200ms) + small buffer
    await waitFor(
      () => {
        expect(
          screen.queryByRole('alertdialog')
        ).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('confirm calls fetch DELETE with the correct ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    reactAct(() => {
      render(<TestComponent id="item-789" />);
    });

    // Open dialog
    reactAct(() => {
      fireEvent.click(screen.getByLabelText('Delete item'));
    });
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    // Confirm
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'ELIMINAR' }));
    });
    expect(mockFetch).toHaveBeenCalledWith('/api/items/item-789', {
      method: 'DELETE',
    });
  });

  it('disables confirm button and shows spinner while request is in flight', async () => {
    let resolveFetch!: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    mockFetch.mockReturnValue(fetchPromise);

    reactAct(() => {
      render(<TestComponent id="item-789" />);
    });

    // Open dialog
    reactAct(() => {
      fireEvent.click(screen.getByLabelText('Delete item'));
    });

    const confirmBtn = screen.getByRole('button', { name: 'ELIMINAR' });

    // Click confirm — starts the async operation
    reactAct(() => {
      fireEvent.click(confirmBtn);
    });

    // Wait for React to flush the loading state update
    await vi.waitFor(() => {
      expect(confirmBtn).toBeDisabled();
    }, { timeout: 2000 });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Resolve the fetch
    await act(async () => {
      resolveFetch({ ok: true, json: async () => ({}) });
    });
  });

  it('handles API error and resets state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    });

    reactAct(() => {
      render(<TestComponent id="item-999" />);
    });

    // Open dialog
    reactAct(() => {
      fireEvent.click(screen.getByLabelText('Delete item'));
    });

    // Confirm — the fetch returns non-ok, which throws
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'ELIMINAR' }));
    });

    // After error, the exit animation plays, then the dialog unmounts
    await waitFor(
      () => {
        expect(
          screen.queryByRole('alertdialog')
        ).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('restores hook state after network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    let dialogState: ReturnType<typeof useConfirmDialog<string>> | null = null;

    function TestWithStateCapture() {
      dialogState = useConfirmDialog<string>({
        onConfirm: async (id) => {
          const response = await fetch(`/api/items/${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Error');
          }
        },
      });
      return (
        <div>
          <span data-testid="open">{String(dialogState.open)}</span>
          <span data-testid="loading">{String(dialogState.isLoading)}</span>
          <button onClick={() => dialogState!.trigger('item-xxx')}>
            Trigger
          </button>
          <ConfirmDialog
            open={dialogState.open}
            title="ELIMINAR"
            message="¿Confirmas?"
            confirmLabel="ELIMINAR"
            cancelLabel="CANCELAR"
            isLoading={dialogState.isLoading}
            onConfirm={dialogState.confirm}
            onCancel={dialogState.cancel}
          />
        </div>
      );
    }

    reactAct(() => {
      render(<TestWithStateCapture />);
    });

    // Open dialog
    reactAct(() => {
      screen.getByText('Trigger').click();
    });

    // Confirm (fetch will throw)
    await act(async () => {
      screen.getByRole('button', { name: 'ELIMINAR' }).click();
    });

    // Hook state should be fully reset
    expect(dialogState!.open).toBe(false);
    expect(dialogState!.isLoading).toBe(false);
  });
});
