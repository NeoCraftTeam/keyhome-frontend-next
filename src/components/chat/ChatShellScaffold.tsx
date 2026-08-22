'use client';

import type { ChatTheme } from '@/components/chat/chat-theme';
import {
  CLIENT_DARK_THEME,
  CLIENT_THEME,
  OWNER_DARK_THEME,
  OWNER_THEME,
} from '@/components/chat/chat-theme';
import { khSafeAreaTopSx } from '@/lib/safe-area-insets';
import { useOwnerTheme } from '@/providers/OwnerThemeProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useMediaQuery, useTheme } from '@mui/material';

/** Sidebar width on desktop (px) — must match {@link KeyHomeChatBox}. */
const SIDEBAR_W = 320;

/**
 * Squelette de la coquille chat (sidebar + fil vide) rendu pendant la
 * restauration du cache persistant (`useIsRestoring()`), au tout premier
 * chargement à froid. Dimensionné comme le rendu final de `KeyHomeChatBox`
 * (sidebar 320 px + fil), donc aucun layout shift quand les données du cache
 * remplacent le squelette — comportement WhatsApp Web.
 *
 * Les navigations douces ont déjà le cache en mémoire → ce scaffold ne
 * s'affiche jamais dans ce cas, uniquement au rechargement à froid.
 */
function ShellScaffold({ theme }: { theme: ChatTheme }) {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const sidebar = (
    <div
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
      style={{ backgroundColor: theme.listBg }}
      aria-busy="true"
      data-testid="chat-shell-scaffold"
    >
      {/* Header — same padding as ConversationList so the border sits identically */}
      <div
        className="px-5 pb-4 shrink-0"
        style={{
          paddingTop: `calc(${khSafeAreaTopSx} + 1.25rem)`,
          borderBottom: `1px solid ${theme.glassBorder}`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div
            className="h-6 w-28 rounded-lg animate-pulse"
            style={{ backgroundColor: theme.inputBg }}
          />
        </div>
        <div
          className="h-[42px] w-full rounded-xl animate-pulse"
          style={{ backgroundColor: theme.inputBg }}
        />
      </div>

      {/* Conversation rows */}
      <div className="flex flex-col overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-5 py-3.5"
            style={{ borderBottom: `1px solid ${theme.glassBorder}` }}
          >
            <div
              className="h-12 w-12 rounded-full shrink-0 animate-pulse"
              style={{ backgroundColor: theme.inputBg }}
            />
            <div className="flex-1 flex flex-col gap-2.5">
              <div
                className="h-3.5 w-[45%] rounded-full animate-pulse"
                style={{ backgroundColor: theme.inputBg }}
              />
              <div
                className="h-3 w-[65%] rounded-full animate-pulse"
                style={{ backgroundColor: theme.inputBg }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="absolute inset-0 flex flex-col overflow-hidden">
        {sidebar}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex overflow-hidden">
      <div
        className="flex flex-col min-h-0 shrink-0 overflow-hidden"
        style={{
          width: SIDEBAR_W,
          borderRight: `1px solid ${theme.glassBorder}`,
        }}
      >
        {sidebar}
      </div>
      {/* Empty thread pane — same background as the resolved thread */}
      <div
        className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden"
        style={{ backgroundColor: theme.chatBg }}
      />
    </div>
  );
}

function ClientShellScaffold() {
  const { mode } = useThemeMode();
  return (
    <ShellScaffold theme={mode === 'dark' ? CLIENT_DARK_THEME : CLIENT_THEME} />
  );
}

function OwnerShellScaffold() {
  const { mode } = useOwnerTheme();
  return (
    <ShellScaffold theme={mode === 'dark' ? OWNER_DARK_THEME : OWNER_THEME} />
  );
}

/**
 * Themed entry point — resolves the client (pink) or owner (teal) palette from
 * its own provider, so it can only be rendered under the matching subtree.
 */
export default function ChatShellScaffold({
  variant,
}: {
  variant: 'client' | 'owner';
}) {
  return variant === 'owner' ? <OwnerShellScaffold /> : <ClientShellScaffold />;
}
