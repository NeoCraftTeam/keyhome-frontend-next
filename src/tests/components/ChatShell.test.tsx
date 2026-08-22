import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

/**
 * ChatShell traduit l'URL en props contrôlées pour la boîte de chat :
 *  - le segment de route (/messages/[uuid]) → `activeConversationId` ;
 *  - `?draft=` → `initialDraft` ;
 *  - `variant` choisit la boîte visiteur (rose) ou bailleur (turquoise).
 * On mocke `next/navigation` et les deux boîtes pour capturer les props reçues.
 */

const nav = vi.hoisted(() => ({
  segment: null as string | null,
  params: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useSelectedLayoutSegment: () => nav.segment,
  useSearchParams: () => nav.params,
}));

interface CapturedProps {
  activeConversationId?: string;
  initialDraft?: string;
  backHref?: string;
}

const captured = vi.hoisted(() => ({
  client: null as CapturedProps | null,
  owner: null as CapturedProps | null,
}));

vi.mock('@/components/chat/KeyHomeChatBox', () => ({
  KeyHomeChatBox: (props: CapturedProps) => {
    captured.client = props;
    return <div data-testid="client-box" />;
  },
  OwnerChatBox: (props: CapturedProps) => {
    captured.owner = props;
    return <div data-testid="owner-box" />;
  },
}));

import ChatShell from '@/components/chat/ChatShell';

describe('ChatShell', () => {
  beforeEach(() => {
    nav.segment = null;
    nav.params = new URLSearchParams();
    captured.client = null;
    captured.owner = null;
  });

  afterEach(cleanup);

  it('boîte visiteur sur l’inbox : aucune conversation active, aucun brouillon', () => {
    render(<ChatShell />);

    expect(screen.getByTestId('client-box')).toBeInTheDocument();
    expect(captured.client?.activeConversationId).toBeUndefined();
    expect(captured.client?.initialDraft).toBeUndefined();
    expect(captured.client?.backHref).toBe('/home');
  });

  it('mappe le segment de route sur activeConversationId', () => {
    nav.segment = 'abc-123';
    render(<ChatShell />);

    expect(captured.client?.activeConversationId).toBe('abc-123');
  });

  it('transmet ?draft= à initialDraft', () => {
    nav.segment = 'abc-123';
    nav.params = new URLSearchParams('draft=Bonjour');
    render(<ChatShell />);

    expect(captured.client?.initialDraft).toBe('Bonjour');
  });

  it('variant owner rend OwnerChatBox avec les props mappées', () => {
    nav.segment = 'owner-conv';
    nav.params = new URLSearchParams('draft=Salut');
    render(<ChatShell variant="owner" />);

    expect(screen.getByTestId('owner-box')).toBeInTheDocument();
    expect(captured.owner?.activeConversationId).toBe('owner-conv');
    expect(captured.owner?.initialDraft).toBe('Salut');
    // La boîte visiteur ne doit pas être montée en même temps.
    expect(screen.queryByTestId('client-box')).toBeNull();
  });
});
