'use client';

import type { Conversation } from '@/types/chat';
import type { DeviceType, PresenceStatus } from '@/hooks/usePresence';
import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import { OnlineStatus, resolvePeerLastSeenForDisplay } from './OnlineStatus';
import {
  ArrowLeft,
  Archive,
  Building2,
  ExternalLink,
  Globe2,
  Home,
  Search,
  Smartphone,
  UserRound,
  X,
} from 'lucide-react';
import { khSafeAreaTopSx } from '@/lib/safe-area-insets';
import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useState } from 'react';

interface ChatHeaderProps {
  conversation: Conversation;
  presenceStatus: PresenceStatus;
  presenceDevice?: DeviceType;
  /** Latest activity from thread (e.g. other party's last message `created_at`). */
  peerMessageActivityAt?: string | null;
  onArchive?: () => void;
  onSearch?: () => void;
  searchOpen?: boolean;
  backHref?: string;
  theme?: ChatTheme;
}

/**
 * Top bar of the chat window.
 *
 * Mobile: linked ad is a toolbar button that opens a bottom sheet (more vertical
 * space for messages). Desktop (`md+`): full ad context row under the toolbar.
 */
export function ChatHeader({
  conversation,
  presenceStatus,
  presenceDevice,
  peerMessageActivityAt = null,
  onArchive,
  onSearch,
  searchOpen = false,
  backHref = '/messages',
  theme = CLIENT_THEME,
}: ChatHeaderProps) {
  const participant = conversation.other_participant;
  const resolvedLastSeen = resolvePeerLastSeenForDisplay(
    participant?.last_seen_at,
    peerMessageActivityAt
  );
  const ad = conversation.ad;
  const initial = participant?.name?.charAt(0).toUpperCase() ?? '?';
  const adHref = ad
    ? theme.isOwnerPanel
      ? `/owner/ads/${ad.id}`
      : `/ads/${ad.slug}`
    : null;

  /** Client panel: public landlord page (always available for the other party). */
  const landlordPublicHref =
    !theme.isOwnerPanel && participant?.id
      ? `/bailleurs/${participant.username?.trim() || participant.id}`
      : null;

  const [mobileAdOpen, setMobileAdOpen] = useState(false);
  const mobileAdTitleId = useId();

  const closeMobileAd = useCallback(() => setMobileAdOpen(false), []);

  useEffect(() => {
    if (!mobileAdOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        closeMobileAd();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileAdOpen, closeMobileAd]);

  useEffect(() => {
    if (!mobileAdOpen || typeof document === 'undefined') {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileAdOpen]);

  return (
    <div
      className="shrink-0 touch-manipulation"
      style={{
        // iOS notch / Dynamic Island / status bar — HIG: content must sit below safe area.
        paddingTop: khSafeAreaTopSx,
        backgroundColor: theme.isDark ? theme.listBg : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.glassBorder}`,
        boxShadow: theme.isDark ? 'none' : '0 1px 6px rgba(0,0,0,0.05)',
      }}
    >
      {/* ── Top row: back / participant / ad (mob) / search / archive ── */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 md:py-3">
        {/* Back arrow (mobile) */}
        <Link
          href={backHref}
          className="shrink-0 flex items-center justify-center p-2 -ml-1 min-h-11 min-w-11 transition-opacity active:scale-95 hover:opacity-80"
          style={{ color: theme.textMuted }}
          aria-label="Retour"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>

        {/* Participant — no profile link; ad context is below (desktop) or sheet (mobile) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
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
              lastSeenAt={resolvedLastSeen}
              theme={theme}
            />
          </div>
        </div>

        {/* Client: link to landlord public profile (new tab — keep chat open). */}
        {landlordPublicHref && (
          <Link
            href={landlordPublicHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center justify-center p-2 min-h-11 min-w-11 transition-opacity active:scale-95 hover:opacity-80"
            style={{ color: theme.accent }}
            aria-label="Profil public du bailleur"
            title="Profil public du bailleur"
          >
            <UserRound className="h-5 w-5" aria-hidden />
          </Link>
        )}

        {/* Linked listing — mobile: compact toolbar control */}
        {ad && adHref && (
          <button
            type="button"
            className="md:hidden shrink-0 flex items-center justify-center p-2 min-h-11 min-w-11 transition-opacity active:scale-95 hover:opacity-80"
            style={{
              color: theme.accent,
            }}
            aria-label="Annonce liée"
            aria-expanded={mobileAdOpen}
            aria-haspopup="dialog"
            onClick={() => setMobileAdOpen(true)}
          >
            <Building2 className="h-5 w-5" aria-hidden />
          </button>
        )}

        {/* Search toggle */}
        {onSearch && (
          <button
            onClick={onSearch}
            className="shrink-0 flex items-center justify-center p-2 min-h-11 min-w-11 transition-opacity active:scale-95 hover:opacity-80"
            style={{
              color: searchOpen ? theme.accent : theme.textMuted,
            }}
            aria-label="Rechercher dans la conversation"
            title="Rechercher"
          >
            <Search className="h-5 w-5" />
          </button>
        )}

        {/* Archive action */}
        {onArchive && (
          <button
            onClick={onArchive}
            className="shrink-0 flex items-center justify-center p-2 min-h-11 min-w-11 transition-all active:scale-95"
            style={{ color: theme.textMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.textMuted;
            }}
            aria-label="Archiver la conversation"
            title="Archiver"
          >
            <Archive className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ── Ad context card (desktop / tablet only) ── */}
      {ad && adHref && (
        <div className="hidden md:block">
          <Link
            href={adHref}
            className="flex items-center gap-3 px-4 py-2.5 transition-colors group"
            style={{
              borderTop: `1px solid ${theme.glassBorder}`,
              background: `linear-gradient(to right, ${theme.accentLighter}, transparent 80%)`,
            }}
            title={`Voir l'annonce : ${ad.title}`}
          >
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

            <ExternalLink
              className="shrink-0 h-4 w-4 transition-transform group-hover:translate-x-0.5"
              style={{ color: theme.accent, opacity: 0.6 }}
            />
          </Link>
        </div>
      )}

      {/* Mobile bottom sheet: portaled to body so navbar/AppBar never steals taps from the backdrop. */}
      {typeof document !== 'undefined' &&
        ad &&
        adHref &&
        mobileAdOpen &&
        createPortal(
          <div
            className="md:hidden fixed inset-0 flex flex-col justify-end"
            style={{ zIndex: 14000 }}
          >
            <button
              type="button"
              className="absolute inset-0 border-0 bg-black/45 cursor-pointer"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Fermer"
              onClick={closeMobileAd}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={mobileAdTitleId}
              className="relative rounded-t-2xl px-4 pt-3 shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
              style={{
                backgroundColor: theme.isDark ? theme.listBg : '#ffffff',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <p
                  id={mobileAdTitleId}
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: theme.accent }}
                >
                  Annonce liée
                </p>
                <button
                  type="button"
                  onClick={closeMobileAd}
                  className="shrink-0 flex items-center justify-center p-2 -mr-1 min-h-11 min-w-11 transition-opacity hover:opacity-80"
                  style={{ color: theme.textMuted }}
                  aria-label="Fermer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <Link
                href={adHref}
                onClick={closeMobileAd}
                className="flex items-center gap-3 rounded-xl p-3 -mx-1 mb-1 transition-colors active:opacity-90"
                style={{
                  background: `linear-gradient(to right, ${theme.accentLighter}, transparent 90%)`,
                  border: `1px solid ${theme.glassBorder}`,
                }}
              >
                <div
                  className="shrink-0 h-14 w-18 rounded-lg overflow-hidden"
                  style={{
                    boxShadow: `0 1px 4px rgba(0,0,0,0.10)`,
                    border: `1px solid ${theme.glassBorder}`,
                  }}
                >
                  {ad.cover_image ? (
                    <Image
                      src={ad.cover_image}
                      alt=""
                      width={72}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-full w-full flex items-center justify-center"
                      style={{ backgroundColor: theme.accentLight }}
                    >
                      <Home
                        className="h-5 w-5"
                        style={{ color: theme.accent }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[15px] font-semibold leading-snug"
                    style={{ color: theme.textPrimary }}
                  >
                    {ad.title}
                  </p>
                  <p
                    className="text-[13px] mt-1 flex items-center gap-1 font-medium"
                    style={{ color: theme.accent }}
                  >
                    Ouvrir l&apos;annonce
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  </p>
                </div>
              </Link>
            </div>
          </div>,
          document.body
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
          className="absolute -bottom-px -right-px flex h-[22px] w-[22px] items-center justify-center rounded-full border-2"
          style={{
            backgroundColor: theme.accent,
            boxShadow: `0 0 6px ${theme.accent}80`,
            borderColor: theme.isDark ? theme.listBg : '#ffffff',
          }}
        >
          {device === 'mobile' ? (
            <Smartphone
              className="h-[11px] w-[11px] text-white"
              strokeWidth={2.25}
            />
          ) : (
            <Globe2
              className="h-[11px] w-[11px] text-white"
              strokeWidth={2.25}
            />
          )}
        </span>
      )}
    </div>
  );
}
