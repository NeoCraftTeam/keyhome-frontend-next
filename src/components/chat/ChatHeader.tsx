'use client';

import type { Conversation } from '@/types/chat';
import type { DeviceType, PresenceStatus } from '@/hooks/usePresence';
import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import { OnlineStatus } from './OnlineStatus';
import {
  ArrowLeft,
  Archive,
  ExternalLink,
  Globe2,
  Home,
  Search,
  Smartphone,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ChatHeaderProps {
  conversation: Conversation;
  presenceStatus: PresenceStatus;
  presenceDevice?: DeviceType;
  onArchive?: () => void;
  onSearch?: () => void;
  searchOpen?: boolean;
  backHref?: string;
  theme?: ChatTheme;
}

/**
 * Top bar of the chat window.
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────┐
 * │ ← (mob) │ [Avatar + name + status] │ Archive  │
 * ├─────────────────────────────────────────────────────────┤
 * │  Ad context card (cover thumb + title + "Voir annonce") │  ← only when ad present
 * └─────────────────────────────────────────────────────────┘
 *
 * Profile navigation lives on the linked-ad row; the top row is display-only.
 */
export function ChatHeader({
  conversation,
  presenceStatus,
  presenceDevice,
  onArchive,
  onSearch,
  searchOpen = false,
  backHref = '/messages',
  theme = CLIENT_THEME,
}: ChatHeaderProps) {
  const participant = conversation.other_participant;
  const ad = conversation.ad;
  const initial = participant?.name?.charAt(0).toUpperCase() ?? '?';
  const adHref = ad
    ? theme.isOwnerPanel
      ? `/owner/ads/${ad.id}`
      : `/ads/${ad.slug}`
    : null;

  return (
    <div
      className="shrink-0"
      style={{
        backgroundColor: theme.isDark ? theme.listBg : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.glassBorder}`,
        boxShadow: theme.isDark ? 'none' : '0 1px 6px rgba(0,0,0,0.05)',
      }}
    >
      {/* ── Top row: back / participant / archive ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 md:py-3">
        {/* Back arrow (mobile) */}
        <Link
          href={backHref}
          className="shrink-0 rounded-full p-1.5 -ml-1 transition-all active:scale-95"
          style={{ color: theme.textMuted }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = theme.accentLight)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Participant — no profile link; ad context is below */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <AvatarBadge
            avatar={participant?.avatar ?? null}
            initial={initial}
            online={presenceStatus === 'online'}
            device={presenceDevice ?? null}
            theme={theme}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-[14px] font-semibold truncate leading-tight"
              style={{ color: theme.textPrimary }}
            >
              {participant?.name ?? 'Utilisateur'}
            </p>
            <OnlineStatus
              status={presenceStatus}
              device={presenceDevice ?? null}
              lastSeenAt={participant?.last_seen_at ?? null}
              theme={theme}
            />
          </div>
        </div>

        {/* Search toggle */}
        {onSearch && (
          <button
            onClick={onSearch}
            className="shrink-0 rounded-full p-2 transition-all active:scale-95"
            style={{
              color: searchOpen ? theme.accent : theme.textMuted,
              backgroundColor: searchOpen ? `${theme.accent}15` : 'transparent',
            }}
            aria-label="Rechercher dans la conversation"
            title="Rechercher"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
        )}

        {/* Archive action */}
        {onArchive && (
          <button
            onClick={onArchive}
            className="shrink-0 rounded-full p-2 transition-all active:scale-95"
            style={{ color: theme.textMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.accentLight;
              e.currentTarget.style.color = theme.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.textMuted;
            }}
            aria-label="Archiver la conversation"
            title="Archiver"
          >
            <Archive className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      {/* ── Ad context card ── */}
      {ad && adHref && (
        <Link
          href={adHref}
          className="flex items-center gap-3 px-4 py-2.5 transition-colors group"
          style={{
            borderTop: `1px solid ${theme.glassBorder}`,
            background: `linear-gradient(to right, ${theme.accentLighter}, transparent 80%)`,
          }}
          title={`Voir l'annonce : ${ad.title}`}
        >
          {/* Cover thumbnail */}
          <div
            className="shrink-0 h-10 w-14 rounded-lg overflow-hidden"
            style={{
              boxShadow: `0 1px 4px rgba(0,0,0,0.10)`,
              border: `1px solid ${theme.glassBorder}`,
            }}
          >
            {ad.cover_image ? (
              <Image
                src={ad.cover_image}
                alt={ad.title}
                width={56}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="h-full w-full flex items-center justify-center"
                style={{ backgroundColor: theme.accentLight }}
              >
                <Home className="h-4 w-4" style={{ color: theme.accent }} />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[11px] font-medium uppercase tracking-wide mb-0.5"
              style={{ color: theme.accent, opacity: 0.65 }}
            >
              Annonce liée
            </p>
            <p
              className="text-[13px] font-semibold truncate leading-tight group-hover:underline decoration-1 underline-offset-2"
              style={{ color: theme.textPrimary }}
            >
              {ad.title}
            </p>
          </div>

          {/* CTA icon */}
          <ExternalLink
            className="shrink-0 h-4 w-4 transition-transform group-hover:translate-x-0.5"
            style={{ color: theme.accent, opacity: 0.6 }}
          />
        </Link>
      )}
    </div>
  );
}

// ── Internal sub-component ────────────────────────────────────────────────────
function AvatarBadge({
  avatar,
  initial,
  online,
  device,
  theme,
}: {
  avatar: string | null;
  initial: string;
  online: boolean;
  device: DeviceType;
  theme: ChatTheme;
}) {
  return (
    <div className="relative shrink-0">
      {avatar ? (
        <Image
          src={avatar}
          alt=""
          width={42}
          height={42}
          className="rounded-full object-cover"
          style={{
            boxShadow: `0 0 0 2px ${theme.accent}20, 0 2px 6px rgba(0,0,0,0.06)`,
          }}
        />
      ) : (
        <div
          className="h-[42px] w-[42px] rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{
            background: `linear-gradient(145deg, ${theme.accent}, ${theme.bubbleGradientEnd})`,
            boxShadow: `0 2px 8px ${theme.accent}30`,
          }}
        >
          {initial}
        </div>
      )}
      {online && (
        <span
          className="absolute -bottom-px -right-px h-4 w-4 rounded-full border-[2px] flex items-center justify-center"
          style={{
            backgroundColor: theme.accent,
            boxShadow: `0 0 6px ${theme.accent}80`,
            borderColor: theme.isDark ? theme.listBg : '#ffffff',
          }}
        >
          {device === 'mobile' ? (
            <Smartphone className="h-[7px] w-[7px] text-white" />
          ) : (
            <Globe2 className="h-[7px] w-[7px] text-white" />
          )}
        </span>
      )}
    </div>
  );
}
