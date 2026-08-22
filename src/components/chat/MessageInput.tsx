'use client';

import type { Message, MessageAttachment } from '@/types/chat';
import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import { ReplyPreview } from './ReplyPreview';
import { VoiceRecorder } from './VoiceRecorder';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset';
import { useChatDraft } from '@/hooks/useChatDrafts';
import { Check, FileText, Mic, Paperclip, Send, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Maximum number of attachments per outgoing message (matches backend cap). */
const MAX_ATTACHMENTS_PER_MESSAGE = 5;

interface PendingItem {
  /** Local UUID-ish id used as React key. */
  id: string;
  file: File;
  /** Object URL — only set for previewable images. */
  previewUrl: string | null;
  /** Server-confirmed attachment descriptor; null while uploading. */
  attachment: MessageAttachment | null;
  /** 0..100, or null when finished. */
  uploadProgress: number | null;
}

interface MessageInputProps {
  onSend: (
    body: string,
    attachments?: MessageAttachment[],
    replyToId?: string
  ) => Promise<void>;
  onUpload: (
    file: File,
    onProgress?: (pct: number) => void
  ) => Promise<MessageAttachment>;
  onTyping: () => void;
  /** Clears typing whispers — call before opening voice capture. */
  stopTyping?: () => void;
  /** Notify peer when microphone capture is active (Reverb whisper). */
  setVoiceRecordingActive?: (active: boolean) => void;
  replyTo: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
  theme?: ChatTheme;
  /** Conversation uuid — clé du brouillon persistant (survit au switch de conv). */
  conversationUuid: string;
  /** Pre-filled text (e.g. coming from the ad detail page). Seeds the draft only if empty. */
  initialDraft?: string;
}

/**
 * Message compose area with file-preview-before-send flow.
 *
 * Selecting a file shows an inline preview card (image thumbnail or document
 * pill). The upload runs in the background. The user can optionally type a
 * caption, then hit Send (or Enter) to dispatch. The × button discards.
 *
 * Enter to send, Shift+Enter for newlines.
 */
export function MessageInput({
  onSend,
  onUpload,
  onTyping,
  stopTyping,
  setVoiceRecordingActive,
  replyTo,
  onCancelReply,
  disabled = false,
  theme = CLIENT_THEME,
  conversationUuid,
  initialDraft = '',
}: MessageInputProps) {
  // Draft persists in a module-level store keyed by conversation uuid, so the
  // in-progress text survives ChatWindow remounts when switching conversations.
  const [body, setBody] = useChatDraft(conversationUuid, initialDraft);
  const [isSending, setIsSending] = useState(false);

  // Multi-attachment compose state — up to MAX_ATTACHMENTS_PER_MESSAGE.
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  // Track per-item cancellation so an in-flight upload result is dropped.
  const cancelledIdsRef = useRef<Set<string>>(new Set());

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount to avoid memory leaks
  const pendingRef = useRef<PendingItem[]>([]);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(
    () => () => {
      pendingRef.current.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    },
    []
  );

  // On mount, size the textarea to fit any restored/seeded draft. Only pull
  // focus (and place the cursor) when the draft was seeded from ?draft= — an
  // explicit "start composing" intent — not when merely restoring a saved draft.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || !body) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    if (initialDraft) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removePending = useCallback((id: string) => {
    cancelledIdsRef.current.add(id);
    setPending((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const clearAllPending = useCallback(() => {
    pendingRef.current.forEach((p) => {
      cancelledIdsRef.current.add(p.id);
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    setPending([]);
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = body.trim();
    const readyAttachments = pending
      .map((p) => p.attachment)
      .filter((a): a is MessageAttachment => a !== null);
    const stillUploading = pending.some((p) => p.attachment === null);

    // Refuse if nothing to send OR uploads still pending
    if ((!trimmed && readyAttachments.length === 0) || isSending) return;
    if (stillUploading) return;

    const bodyToSend = trimmed;
    const attachmentsToSend =
      readyAttachments.length > 0 ? readyAttachments : undefined;
    // Snapshot the pending list so we can restore on failure (re-creating the
    // PendingItem entries with their already-uploaded server descriptors so
    // the user does not have to re-attach the files).
    const pendingSnapshot: PendingItem[] = pending
      .filter((p) => p.attachment !== null)
      .map((p) => ({
        id: p.id,
        file: p.file,
        previewUrl: p.previewUrl,
        attachment: p.attachment,
        uploadProgress: null,
      }));

    // Clear instantly for responsive UX
    setBody('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    clearAllPending();

    setIsSending(true);
    try {
      await onSend(bodyToSend, attachmentsToSend, replyTo?.uuid);
    } catch {
      // Restore text + attachments on failure so the user can retry without
      // losing their work. The cancelled-id guard set in clearAllPending is
      // forgotten by re-creating the items with the same ids and we mark them
      // as ready (uploadProgress: null, attachment: existing descriptor).
      setBody(bodyToSend);
      if (pendingSnapshot.length > 0) {
        pendingSnapshot.forEach((p) => cancelledIdsRef.current.delete(p.id));
        setPending(pendingSnapshot);
      }
    } finally {
      setIsSending(false);
    }
  }, [
    body,
    setBody,
    isSending,
    onSend,
    replyTo?.uuid,
    pending,
    clearAllPending,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;

      // Reset the input so the same file can be re-selected later
      if (fileRef.current) fileRef.current.value = '';

      const remainingSlots = MAX_ATTACHMENTS_PER_MESSAGE - pending.length;
      const accepted = files.slice(0, Math.max(0, remainingSlots));

      const newItems: PendingItem[] = accepted.map((file) => ({
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : null,
        attachment: null,
        uploadProgress: 0,
      }));

      setPending((prev) => [...prev, ...newItems]);

      // Upload each file in parallel — independent progress per file.
      newItems.forEach(async (item) => {
        try {
          const attachment = await onUpload(item.file, (pct) => {
            if (cancelledIdsRef.current.has(item.id)) return;
            setPending((prev) =>
              prev.map((p) =>
                p.id === item.id ? { ...p, uploadProgress: pct } : p
              )
            );
          });
          if (cancelledIdsRef.current.has(item.id)) return;
          setPending((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, attachment, uploadProgress: null } : p
            )
          );
        } catch {
          if (cancelledIdsRef.current.has(item.id)) return;
          removePending(item.id);
        }
      });
    },
    [pending.length, onUpload, removePending]
  );

  const handleVoiceReady = useCallback(
    async (attachment: MessageAttachment) => {
      setShowVoiceRecorder(false);
      setIsSending(true);
      try {
        // WhatsApp-style: stop recording → upload already ran in VoiceRecorder; send immediately.
        await onSend('', [attachment], replyTo?.uuid);
      } catch {
        const id = `voice-${Date.now()}`;
        setPending((prev) => [
          ...prev,
          {
            id,
            file: new File([], attachment.original_name, {
              type: attachment.mime_type,
            }),
            previewUrl: null,
            attachment,
            uploadProgress: null,
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [onSend, replyTo?.uuid]
  );

  const stillUploading = pending.some((p) => p.attachment === null);
  const canSend =
    (!!body.trim() || pending.some((p) => p.attachment !== null)) &&
    !stillUploading &&
    !isSending &&
    !disabled;

  // iOS keyboard handling: shrinking visualViewport leaves position-fixed
  // bars trapped behind the keyboard. We bump the input up by that delta
  // via translateY so the textarea always stays above the keyboard.
  const keyboardInset = useVisualViewportInset();

  return (
    <div
      className="shrink-0 relative z-10"
      style={{
        backgroundColor: theme.isDark ? theme.listBg : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: `1px solid ${theme.glassBorder}`,
        boxShadow: theme.isDark ? 'none' : '0 -1px 6px rgba(0,0,0,0.03)',
        // When the on-screen keyboard is visible, lift the bar above it
        // (visualViewport-aware). 0 when no keyboard, so desktop is untouched.
        transform:
          keyboardInset > 0 ? `translateY(-${keyboardInset}px)` : undefined,
        transition:
          keyboardInset === 0
            ? 'transform 200ms cubic-bezier(0.22,1,0.36,1)'
            : undefined,
        // Honour the home indicator only when keyboard is hidden.
        paddingBottom:
          keyboardInset > 0 ? 0 : 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* ── Multi-attachment preview row (horizontal scroll on overflow) ──── */}
      {pending.length > 0 && (
        <div className="px-3 pt-3 pb-1 flex flex-wrap gap-2">
          {pending.map((item) => {
            const isImg = item.file.type.startsWith('image/');
            return (
              <div key={item.id} className="relative inline-block">
                {isImg && item.previewUrl ? (
                  <div
                    className="relative rounded-xl overflow-hidden bg-gray-100"
                    style={{ width: 96, height: 96 }}
                  >
                    <Image
                      src={item.previewUrl}
                      alt={item.file.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {item.uploadProgress !== null && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 rounded-xl">
                        <div className="w-14 h-1.5 rounded-full bg-white/30 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-white transition-all duration-200"
                            style={{ width: `${item.uploadProgress}%` }}
                          />
                        </div>
                        <span className="mt-1.5 text-[10px] text-white tabular-nums">
                          {item.uploadProgress}%
                        </span>
                      </div>
                    )}
                    {item.attachment && (
                      <div className="absolute bottom-1.5 right-1.5 rounded-full bg-green-500 p-0.5">
                        <Check className="h-[9px] w-[9px] text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                    style={{
                      backgroundColor: theme.accentLighter,
                      border: `1px solid ${theme.glassBorder}`,
                    }}
                  >
                    <FileText
                      className="h-7 w-7 shrink-0"
                      style={{ color: theme.accent }}
                    />
                    <div className="min-w-0">
                      <p
                        className="text-[12px] font-medium truncate max-w-[140px]"
                        style={{ color: theme.textPrimary }}
                      >
                        {item.file.name}
                      </p>
                      {item.uploadProgress !== null ? (
                        <>
                          <div className="mt-1 h-1 w-32 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-200"
                              style={{
                                width: `${item.uploadProgress}%`,
                                backgroundColor: theme.accent,
                              }}
                            />
                          </div>
                          <p
                            className="mt-0.5 text-[10px]"
                            style={{ color: theme.textMuted }}
                          >
                            {item.uploadProgress}%
                          </p>
                        </>
                      ) : (
                        <p className="text-[10px] text-green-600 font-medium mt-0.5">
                          Prêt
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removePending(item.id)}
                  className="absolute -top-2 -right-2 rounded-full bg-gray-600/85 text-white hover:bg-gray-800 transition-colors"
                  style={{ padding: 3 }}
                  aria-label="Annuler la pièce jointe"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}

          {pending.length < MAX_ATTACHMENTS_PER_MESSAGE && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center rounded-xl border-2 border-dashed transition-colors hover:bg-black/5"
              style={{
                width: 96,
                height: 96,
                borderColor: theme.glassBorder,
                color: theme.textMuted,
              }}
              aria-label="Ajouter un fichier"
            >
              <Paperclip className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* Voice note recorder — replaces the input row while recording */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onCancel={() => setShowVoiceRecorder(false)}
          onReady={handleVoiceReady}
          onUpload={onUpload}
          onRecordingActiveChange={setVoiceRecordingActive}
          theme={theme}
        />
      )}

      {/* Reply bar */}
      {replyTo && (
        <ReplyPreview
          message={replyTo}
          onCancel={onCancelReply}
          theme={theme}
        />
      )}

      {/* Input row — hidden while voice recorder is active */}
      {!showVoiceRecorder && (
        <div className="flex items-end gap-2 px-3 py-2.5">
          {/* Attachment button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={disabled || pending.length >= MAX_ATTACHMENTS_PER_MESSAGE}
            className="shrink-0 rounded-full p-2 text-gray-400 transition-all duration-200 disabled:opacity-40 active:scale-95"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.accent;
              e.currentTarget.style.backgroundColor = theme.accentLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Joindre un fichier"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              autoResize();
              onTyping();
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              pending.length > 0
                ? 'Ajouter une légende…'
                : 'Écrivez un message…'
            }
            className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-[14px] outline-none transition-all duration-200 min-h-[42px] max-h-40 overflow-y-auto disabled:opacity-50"
            style={{
              backgroundColor: theme.inputBg,
              color: theme.textPrimary,
              boxShadow: theme.isDark
                ? `0 0 0 1px ${theme.glassBorder}`
                : '0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 2px rgba(0,0,0,0.02)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.accent}40, 0 2px 8px rgba(0,0,0,0.04)`;
            }}
            onBlur={(e) =>
              (e.currentTarget.style.boxShadow = theme.isDark
                ? `0 0 0 1px ${theme.glassBorder}`
                : '0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 2px rgba(0,0,0,0.02)')
            }
          />

          {/* Mic / Send button — mic appears when there's nothing to send,
            send button replaces it as soon as the user types or attaches. */}
          {!body.trim() && pending.length === 0 ? (
            <button
              onClick={() => {
                stopTyping?.();
                setShowVoiceRecorder(true);
              }}
              disabled={disabled}
              className="shrink-0 rounded-full p-2.5 text-white transition-all duration-200 disabled:opacity-30 active:scale-[0.92]"
              style={{
                background: `linear-gradient(145deg, ${theme.accent}, ${theme.bubbleGradientEnd})`,
                boxShadow: `0 2px 10px ${theme.accent}40`,
                minWidth: 42,
                minHeight: 42,
              }}
              aria-label="Enregistrer un message vocal"
            >
              <Mic className="h-[18px] w-[18px]" />
            </button>
          ) : (
            <button
              onClick={() => void handleSend()}
              disabled={!canSend}
              className="shrink-0 rounded-full p-2.5 text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.92]"
              style={{
                background: `linear-gradient(145deg, ${theme.accent}, ${theme.bubbleGradientEnd})`,
                boxShadow: canSend ? `0 2px 10px ${theme.accent}40` : 'none',
                minWidth: 42,
                minHeight: 42,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.boxShadow = `0 4px 16px ${theme.accent}50`;
                  e.currentTarget.style.transform = 'scale(1.04)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = canSend
                  ? `0 2px 10px ${theme.accent}40`
                  : 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label="Envoyer"
            >
              <Send className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
