'use client';

import type { Message, MessageAttachment } from '@/types/chat';
import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import { ReplyPreview } from './ReplyPreview';
import { Check, FileText, Paperclip, Send, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  replyTo: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
  theme?: ChatTheme;
  /** Pre-filled text (e.g. coming from the ad detail page). Only applied on first mount. */
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
  replyTo,
  onCancelReply,
  disabled = false,
  theme = CLIENT_THEME,
  initialDraft = '',
}: MessageInputProps) {
  const [body, setBody] = useState(initialDraft);
  const [isSending, setIsSending] = useState(false);

  // Pending attachment state
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(
    null
  );
  const [pendingAttachment, setPendingAttachment] =
    useState<MessageAttachment | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  // Flag to ignore upload result after user cancels
  const uploadCancelledRef = useRef(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Revoke the object URL on unmount to avoid memory leaks
  const pendingPreviewUrlRef = useRef<string | null>(null);
  useEffect(() => {
    pendingPreviewUrlRef.current = pendingPreviewUrl;
  }, [pendingPreviewUrl]);
  useEffect(
    () => () => {
      if (pendingPreviewUrlRef.current)
        URL.revokeObjectURL(pendingPreviewUrlRef.current);
    },
    []
  );

  // When a draft is pre-filled, resize the textarea and place cursor at the end.
  useEffect(() => {
    if (!initialDraft) return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearPending = useCallback(() => {
    uploadCancelledRef.current = true;
    if (pendingPreviewUrlRef.current)
      URL.revokeObjectURL(pendingPreviewUrlRef.current);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setPendingAttachment(null);
    setUploadProgress(null);
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
    // Allow send when there is text OR a ready attachment (or both)
    if ((!trimmed && !pendingAttachment) || isSending) return;

    // Clear the input INSTANTLY for responsive UX — don't wait for the API.
    const bodyToSend = trimmed;
    const attachmentToSend = pendingAttachment;
    setBody('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    clearPending();

    setIsSending(true);
    try {
      await onSend(
        bodyToSend,
        attachmentToSend ? [attachmentToSend] : undefined,
        replyTo?.uuid
      );
    } catch {
      // Restore text on failure so the user can retry.
      setBody(bodyToSend);
    } finally {
      setIsSending(false);
    }
  }, [body, isSending, onSend, replyTo?.uuid, pendingAttachment, clearPending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset cancel flag before new upload
      uploadCancelledRef.current = false;

      // Create a local preview URL immediately — no waiting for upload
      const previewUrl = URL.createObjectURL(file);
      setPendingFile(file);
      setPendingPreviewUrl(previewUrl);
      setPendingAttachment(null);
      setUploadProgress(0);

      try {
        const attachment = await onUpload(file, (pct) => {
          if (!uploadCancelledRef.current) setUploadProgress(pct);
        });
        if (!uploadCancelledRef.current) {
          setPendingAttachment(attachment);
          setUploadProgress(null);
        }
      } catch {
        if (!uploadCancelledRef.current) clearPending();
      }
    },
    [onUpload, clearPending]
  );

  const isImage = pendingFile?.type.startsWith('image/');
  const canSend =
    (!!body.trim() || !!pendingAttachment) && !isSending && !disabled;

  return (
    <div
      className="shrink-0"
      style={{
        backgroundColor: theme.isDark ? theme.listBg : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: `1px solid ${theme.glassBorder}`,
        boxShadow: theme.isDark ? 'none' : '0 -1px 6px rgba(0,0,0,0.03)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* ── Attachment preview ──────────────────────────────────────────── */}
      {pendingFile && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative inline-block">
            {isImage && pendingPreviewUrl ? (
              /* Image thumbnail */
              <div
                className="relative rounded-xl overflow-hidden bg-gray-100"
                style={{ width: 108, height: 108 }}
              >
                <Image
                  src={pendingPreviewUrl}
                  alt={pendingFile.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {/* Upload progress overlay */}
                {uploadProgress !== null && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 rounded-xl">
                    <div className="w-16 h-1.5 rounded-full bg-white/30 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="mt-1.5 text-[10px] text-white tabular-nums">
                      {uploadProgress}%
                    </span>
                  </div>
                )}
                {/* Ready checkmark */}
                {pendingAttachment && (
                  <div className="absolute bottom-1.5 right-1.5 rounded-full bg-green-500 p-0.5">
                    <Check className="h-[9px] w-[9px] text-white" />
                  </div>
                )}
              </div>
            ) : (
              /* Document pill */
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
                    {pendingFile.name}
                  </p>
                  {uploadProgress !== null ? (
                    <>
                      <div className="mt-1 h-1 w-32 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{
                            width: `${uploadProgress}%`,
                            backgroundColor: theme.accent,
                          }}
                        />
                      </div>
                      <p
                        className="mt-0.5 text-[10px]"
                        style={{ color: theme.textMuted }}
                      >
                        {uploadProgress}%
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] text-green-600 font-medium mt-0.5">
                      Prêt à envoyer
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Discard button */}
            <button
              type="button"
              onClick={clearPending}
              className="absolute -top-2 -right-2 rounded-full bg-gray-600/85 text-white hover:bg-gray-800 transition-colors"
              style={{ padding: 3 }}
              aria-label="Annuler la pièce jointe"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Reply bar */}
      {replyTo && (
        <ReplyPreview
          message={replyTo}
          onCancel={onCancelReply}
          theme={theme}
        />
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-3 py-2.5">
        {/* Attachment button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled || !!pendingFile}
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
          accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx"
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
            pendingFile ? 'Ajouter une légende…' : 'Écrivez un message…'
          }
          className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-[14px] outline-none transition-all duration-200 min-h-[42px] max-h-40 overflow-y-auto disabled:opacity-50"
          style={{
            backgroundColor: theme.inputBg,
            color: theme.textPrimary,
            boxShadow: theme.isDark
              ? `0 0 0 1px ${theme.glassBorder}`
              : '0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 2px rgba(0,0,0,0.02)',
          }}
          onFocus={(e) =>
            (e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.accent}40, 0 2px 8px rgba(0,0,0,0.04)`)
          }
          onBlur={(e) =>
            (e.currentTarget.style.boxShadow = theme.isDark
              ? `0 0 0 1px ${theme.glassBorder}`
              : '0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 2px rgba(0,0,0,0.02)')
          }
        />

        {/* Send button */}
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
      </div>
    </div>
  );
}
