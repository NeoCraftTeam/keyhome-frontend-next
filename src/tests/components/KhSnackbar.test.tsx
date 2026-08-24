import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, it, vi } from 'vitest';

import KhSnackbar, {
  resolveSnackbarFill,
} from '@/components/ui/feedback/KhSnackbar';
import { lightTheme } from '@/theme/theme';
import { semantic } from '@/theme/tokens';

function renderSnackbar(ui: React.ReactElement) {
  return render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);
}

describe('KhSnackbar', () => {
  it('does not render the message while closed', () => {
    renderSnackbar(
      <KhSnackbar
        open={false}
        message="Enregistré"
        severity="success"
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText('Enregistré')).not.toBeInTheDocument();
  });

  it('renders the message with a status role when open', () => {
    renderSnackbar(
      <KhSnackbar
        open
        message="Enregistré"
        severity="success"
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Enregistré')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('announces errors assertively', () => {
    renderSnackbar(
      <KhSnackbar open message="Échec" severity="error" onClose={vi.fn()} />
    );
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-live',
      'assertive'
    );
  });

  it('calls onClose when the close button is pressed', () => {
    const onClose = vi.fn();
    renderSnackbar(
      <KhSnackbar open message="Coucou" severity="info" onClose={onClose} />
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  describe('resolveSnackbarFill (brand alignment + contrast)', () => {
    it('uses the brand green for success, not the owner teal', () => {
      expect(resolveSnackbarFill('success').bg).toBe(semantic.success);
      expect(resolveSnackbarFill('success').bg).not.toBe('#0D9488');
    });

    it('uses white text on error/info and dark text on amber warning', () => {
      expect(resolveSnackbarFill('error').fg).toBe('#FFFFFF');
      expect(resolveSnackbarFill('info').fg).toBe('#FFFFFF');
      expect(resolveSnackbarFill('warning').fg).toBe('#1A1A1A');
      expect(resolveSnackbarFill('warning').bg).toBe(semantic.warning);
    });
  });
});
