import { KeyHomeChatBox } from '@/components/chat/KeyHomeChatBox';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Messages — KeyHome',
  description: 'Vos conversations avec les propriétaires.',
};

/**
 * /messages — MUI X ChatBox handles conversation list + thread layout.
 */
export default function MessagesPage() {
  return <KeyHomeChatBox backHref="/home" />;
}
