import ChatShell from '@/components/chat/ChatShell';
import { Suspense } from 'react';

/**
 * Persistent owner messages layout (WhatsApp-Web style), teal variant.
 *
 * Shared by `/owner/messages` and `/owner/messages/[uuid]`, so it — and the
 * `ChatShell` below it (conversation list + WebSocket + thread) — mounts once
 * and survives navigation between the inbox and any conversation. The page
 * files are empty coquilles: all UI lives in the shell, which reads the active
 * conversation from the URL segment. Mirrors the visitor `messages/layout.tsx`.
 *
 * `ChatShell` reads `?draft=` via `useSearchParams`, so it must sit under a
 * Suspense boundary (Next.js requirement for `useSearchParams` in a layout).
 */
export default function OwnerMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <ChatShell variant="owner" />
      </Suspense>
      {children}
    </>
  );
}
