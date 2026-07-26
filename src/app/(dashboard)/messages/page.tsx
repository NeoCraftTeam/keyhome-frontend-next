import { KeyHomeChatBox } from '@/components/chat/KeyHomeChatBox';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Vos conversations avec les propriétaires.',
  robots: { index: false, follow: false },
};

/**
 * /messages — MUI X ChatBox handles conversation list + thread layout.
 */
export default function MessagesPage() {
  return <KeyHomeChatBox backHref="/home" />;
}
