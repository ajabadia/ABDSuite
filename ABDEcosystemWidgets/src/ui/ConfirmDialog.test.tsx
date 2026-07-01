// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { act as reactAct } from 'react';
import { ConfirmDialog } from './ConfirmDialog.js';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'ELIMINAR',
    message: '¿Estás seguro de eliminar este elemento?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open is true', () => {
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} />);
    });
    expect(screen.getByText('ELIMINAR')).toBeInTheDocument();
    expect(screen.getByText('¿Estás seguro de eliminar este elemento?')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} open={false} />);
    });
    expect(screen.queryByText('ELIMINAR')).not.toBeInTheDocument();
  });

  it('renders default button labels', () => {
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} />);
    });
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('renders custom button labels', () => {
    reactAct(() => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmLabel="BORRAR"
          cancelLabel="VOLVER"
        />
      );
    });
    expect(screen.getByText('BORRAR')).toBeInTheDocument();
    expect(screen.getByText('VOLVER')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    });
    reactAct(() => {
      fireEvent.click(screen.getByText('Confirmar'));
    });
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    });
    reactAct(() => {
      fireEvent.click(screen.getByText('Cancelar'));
    });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when backdrop is clicked', () => {
    const onCancel = vi.fn();
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    });
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    reactAct(() => {
      fireEvent.click(backdrop!);
    });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel on Escape key', () => {
    const onCancel = vi.fn();
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    });
    reactAct(() => {
      fireEvent.keyDown(document.querySelector('[role="alertdialog"]')!, {
        key: 'Escape',
        code: 'Escape',
      });
    });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('does not call onCancel on Escape when isLoading', () => {
    const onCancel = vi.fn();
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} onCancel={onCancel} />);
    });
    reactAct(() => {
      fireEvent.keyDown(document.querySelector('[role="alertdialog"]')!, {
        key: 'Escape',
        code: 'Escape',
      });
    });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('disables buttons when isLoading', () => {
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />);
    });
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('shows spinner when isLoading', () => {
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />);
    });
    const confirmBtn = screen.getByText('Confirmar').closest('button');
    expect(confirmBtn?.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders with danger variant as default', () => {
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} />);
    });
    expect(document.querySelector('.text-red-500')).toBeInTheDocument();
  });

  it('renders with warning variant', () => {
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);
    });
    expect(document.querySelector('.text-amber-500')).toBeInTheDocument();
  });

  it('renders with info variant', () => {
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} variant="info" />);
    });
    expect(document.querySelector('.text-primary')).toBeInTheDocument();
  });

  it('sets role="alertdialog" for accessibility', () => {
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} />);
    });
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('sets aria-modal="true"', () => {
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} />);
    });
    expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('does not call onCancel when backdrop clicked during loading', () => {
    const onCancel = vi.fn();
    reactAct(() => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} onCancel={onCancel} />);
    });
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    reactAct(() => {
      fireEvent.click(backdrop!);
    });
    expect(onCancel).not.toHaveBeenCalled();
  });
});
