import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

// ChatToast is a notistack custom-content component; stub the runtime import.
vi.mock('notistack', () => ({ closeSnackbar: vi.fn() }));

import ChatToast from '@/components/chat/ChatToast';
import { lightTheme, darkTheme } from '@/theme/theme';

/**
 * ChatToast used to hardcode `#ffffff` / `#1a1a1a`, so in dark mode it rendered
 * as an unreadable white card. It now reads `background.paper` / `text.primary`
 * from the active MUI theme. These tests lock that in.
 */

/** Normalize a hex to jsdom's `rgb(...)` form, the same way the DOM does. */
function asRgb(color: string): string {
  const el = document.createElement('div');
  el.style.backgroundColor = color;
  return el.style.backgroundColor;
}

function renderToast(theme: typeof lightTheme, message = 'Nouveau message') {
  const props = {
    id: 'toast-1',
    message,
    accentColor: '#F6475F',
  } as unknown as React.ComponentProps<typeof ChatToast>;
  return render(
    <ThemeProvider theme={theme}>
      <ChatToast {...props} />
    </ThemeProvider>
  );
}

describe('ChatToast', () => {
  it('renders the message as an alert', () => {
    renderToast(lightTheme, 'Coucou de Marie');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Coucou de Marie')).toBeInTheDocument();
  });

  it('uses the theme surface + text colour in dark mode (not a hardcoded white card)', () => {
    const root = renderToast(darkTheme).container.firstChild as HTMLElement;
    expect(root.style.backgroundColor).toBe(
      asRgb(darkTheme.palette.background.paper)
    );
    expect(root.style.color).toBe(asRgb(darkTheme.palette.text.primary));
    expect(root.style.backgroundColor).not.toBe('rgb(255, 255, 255)');
  });

  it('adapts its surface + text colour between light and dark themes', () => {
    const dark = renderToast(darkTheme).container.firstChild as HTMLElement;
    const light = renderToast(lightTheme).container.firstChild as HTMLElement;
    expect(dark.style.backgroundColor).not.toBe(light.style.backgroundColor);
    expect(dark.style.color).not.toBe(light.style.color);
  });

  it('keeps the accent colour on the left border regardless of theme', () => {
    const root = renderToast(darkTheme).container.firstChild as HTMLElement;
    expect(root.style.borderLeft).toContain(asRgb('#F6475F'));
  });
});
