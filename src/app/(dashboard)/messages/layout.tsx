import ChatShell from '@/components/chat/ChatShell';
import { Suspense } from 'react';

/**
 * Persistent messages layout (WhatsApp-Web style).
 *
 * This layout is shared by `/messages` and `/messages/[uuid]`, so it — and the
 * `ChatShell` below it (conversation list + WebSocket + thread) — mounts once
 * and survives navigation between the inbox and any conversation. The page
 * files are empty coquilles: all UI lives in the shell, which reads the active
 * conversation from the URL segment.
 *
 * `ChatShell` reads `?draft=` via `useSearchParams`, so it must sit under a
 * Suspense boundary (Next.js requirement for `useSearchParams` in a layout).
 */
export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <ChatShell />
      </Suspense>
      {children}
    </>
  );
}
