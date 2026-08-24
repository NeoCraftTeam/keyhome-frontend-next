import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';

import AppAlert, {
  resolveAppAlertColors,
} from '@/components/ui/feedback/AppAlert';
import { lightTheme } from '@/theme/theme';
import { dark, semantic } from '@/theme/tokens';

function renderAlert(ui: React.ReactElement) {
  return render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);
}

describe('AppAlert', () => {
  it('renders a plain-text message', () => {
    renderAlert(<AppAlert severity="info" message="Bonjour" />);
    expect(screen.getByText('Bonjour')).toBeInTheDocument();
  });

  it('renders rich children instead of the message body', () => {
    renderAlert(
      <AppAlert severity="warning">
        <a href="/x">Un lien</a>
      </AppAlert>
    );
    expect(screen.getByRole('link', { name: 'Un lien' })).toBeInTheDocument();
  });

  it('renders the title and hint when provided', () => {
    renderAlert(
      <AppAlert
        severity="error"
        title="Oups"
        message="Ça a échoué"
        hint="Réessayez plus tard"
      />
    );
    expect(screen.getByText('Oups')).toBeInTheDocument();
    expect(screen.getByText('Ça a échoué')).toBeInTheDocument();
    expect(screen.getByText('Réessayez plus tard')).toBeInTheDocument();
  });

  it('exposes an assertive alert role for errors', () => {
    renderAlert(<AppAlert severity="error" message="Erreur" />);
    const el = screen.getByRole('alert');
    expect(el).toHaveAttribute('aria-live', 'assertive');
  });

  it('exposes a polite status role for non-errors', () => {
    renderAlert(<AppAlert severity="success" message="OK" />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  describe('resolveAppAlertColors (dark-mode safety)', () => {
    it('uses the brand semantic colour in light mode', () => {
      expect(resolveAppAlertColors('error', 'light').color).toBe(
        semantic.error
      );
      expect(resolveAppAlertColors('success', 'light').color).toBe(
        semantic.success
      );
    });

    it('uses brighter colours in dark mode so the alert stays visible', () => {
      expect(resolveAppAlertColors('error', 'dark').color).toBe(
        dark.errorBright
      );
      expect(resolveAppAlertColors('success', 'dark').color).toBe(
        dark.successBright
      );
      // The dark-brick #C13515 that vanished on the dark paper must be gone.
      expect(resolveAppAlertColors('error', 'dark').color).not.toBe(
        semantic.error
      );
    });

    it('defines a distinct, non-empty colour set for every severity in both modes', () => {
      (['error', 'success', 'warning', 'info'] as const).forEach((sev) => {
        for (const mode of ['light', 'dark'] as const) {
          const c = resolveAppAlertColors(sev, mode);
          expect(c.bg).toBeTruthy();
          expect(c.border).toBeTruthy();
          expect(c.color).toBeTruthy();
        }
        // Dark tint must differ from light (stronger alpha).
        expect(resolveAppAlertColors(sev, 'dark').bg).not.toBe(
          resolveAppAlertColors(sev, 'light').bg
        );
      });
    });
  });
});
