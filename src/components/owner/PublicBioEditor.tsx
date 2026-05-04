'use client';

import {
  BIO_MAX_LENGTH,
  htmlToMarkdownLight,
  markdownLightToHtml,
} from '@/lib/markdown-light';
import {
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FormatListNumbered as FormatListNumberedIcon,
  Link as LinkIcon,
  Title as TitleIcon,
} from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import LinkExtension from '@tiptap/extension-link';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';

interface PublicBioEditorProps {
  /** Markdown source — same shape as `markdownLightToHtml` consumes. */
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  helperText?: string;
}

const WARN_THRESHOLD = Math.round(BIO_MAX_LENGTH * 0.9);

interface ToolbarButtonProps {
  ariaLabel: string;
  tooltip: string;
  onAction: () => void;
  active?: boolean;
  children: React.ReactNode;
}

/**
 * Toolbar button: `mousedown→preventDefault` keeps the TipTap selection alive
 * (TipTap manages its own ProseMirror selection — same UX rule as a textarea
 * here), and `tabIndex={-1}` keeps the buttons out of the keyboard focus
 * order so Tab still cycles normal form fields.
 */
function ToolbarButton({
  ariaLabel,
  tooltip,
  onAction,
  active = false,
  children,
}: ToolbarButtonProps) {
  return (
    <Tooltip title={tooltip}>
      <span>
        <IconButton
          size="small"
          aria-label={ariaLabel}
          aria-pressed={active}
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onAction}
          sx={{
            color: active ? 'primary.main' : 'text.secondary',
            bgcolor: active ? 'rgba(13,148,136,0.10)' : 'transparent',
            borderRadius: 1.25,
            '&:hover': {
              bgcolor: active ? 'rgba(13,148,136,0.18)' : 'rgba(0,0,0,0.04)',
            },
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

interface ToolbarProps {
  editor: Editor | null;
}

function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;
  const promptLink = (): void => {
    const previous = editor.getAttributes('link').href ?? '';
    const url = window.prompt(
      'URL du lien (https:// ou mailto:)',
      previous as string
    );
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const safe =
      /^https?:\/\//i.test(url) || /^mailto:/i.test(url)
        ? url
        : `https://${url}`;
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: safe,
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      })
      .run();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.25,
        flexWrap: 'wrap',
        alignItems: 'center',
        mb: 1,
        px: 0.5,
        py: 0.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.default',
      }}
    >
      <ToolbarButton
        ariaLabel="Mettre en gras"
        tooltip="Gras (Ctrl/Cmd+B)"
        onAction={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
      >
        <FormatBoldIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Mettre en italique"
        tooltip="Italique (Ctrl/Cmd+I)"
        onAction={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
      >
        <FormatItalicIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Sous-titre"
        tooltip="Sous-titre"
        onAction={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        active={editor.isActive('heading', { level: 3 })}
      >
        <TitleIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Liste à puces"
        tooltip="Liste à puces"
        onAction={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
      >
        <FormatListBulletedIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Liste numérotée"
        tooltip="Liste numérotée"
        onAction={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
      >
        <FormatListNumberedIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Ajouter un lien"
        tooltip="Lien (https:// ou mailto:)"
        onAction={promptLink}
        active={editor.isActive('link')}
      >
        <LinkIcon fontSize="small" />
      </ToolbarButton>
    </Box>
  );
}

/**
 * Rich-text bio editor for the owner public profile, powered by TipTap
 * (ProseMirror-based, same engine as Notion / Linear / Cal.com).
 *
 * Storage stays Markdown (backend column unchanged): we convert
 * Markdown → HTML to seed the editor on mount, run TipTap natively in HTML
 * during editing, and emit `htmlToMarkdownLight` back to the consumer on
 * every update. This keeps the wire format simple, sanitization trivial,
 * and roundtrips deterministic against `markdownLightToHtml`.
 */
export default function PublicBioEditor({
  value,
  onChange,
  disabled = false,
  label = 'Bio publique',
  placeholder,
  helperText,
}: PublicBioEditorProps) {
  // Track the last-emitted Markdown so we don't re-seed the editor when the
  // controlled `value` prop reflects an update we just emitted ourselves —
  // that would constantly reset the cursor to the document start.
  const lastEmittedRef = useRef<string>(value);
  const [length, setLength] = useState<number>(value.length);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
        // Keep markup minimal; we don't render strikethrough / blockquote / code blocks.
        strike: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      LinkExtension.configure({
        autolink: false,
        openOnClick: false,
        protocols: ['http', 'https', 'mailto'],
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
    ],
    content: markdownLightToHtml(value),
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'kh-bio-editor',
        'aria-label': label,
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const md = htmlToMarkdownLight(html);
      const truncated =
        md.length > BIO_MAX_LENGTH ? md.slice(0, BIO_MAX_LENGTH) : md;
      setLength(truncated.length);
      lastEmittedRef.current = truncated;
      onChange(truncated);
    },
  });

  // External `value` reset (e.g. switching to edit mode after canceling) →
  // seed editor only when it diverges from what we last emitted.
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedRef.current) return;
    const html = markdownLightToHtml(value);
    if (editor.getHTML() === html) return;
    editor.commands.setContent(html, { emitUpdate: false });
    lastEmittedRef.current = value;
    setLength(value.length);
  }, [value, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [editor, disabled]);

  const overWarn = length >= WARN_THRESHOLD;
  const counterColor = overWarn
    ? length >= BIO_MAX_LENGTH
      ? 'error.main'
      : 'warning.main'
    : 'text.secondary';

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        {label}
      </Typography>

      {!disabled && <Toolbar editor={editor} />}

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: '0 0 0 3px rgba(13,148,136,0.20)',
          },
          '& .kh-bio-editor': {
            minHeight: 140,
            outline: 'none',
            padding: '12px 14px',
            fontSize: '0.95rem',
            lineHeight: 1.55,
          },
          '& .kh-bio-editor p': { my: 0.5 },
          '& .kh-bio-editor h3': {
            fontSize: '1.05rem',
            fontWeight: 700,
            my: 1,
          },
          '& .kh-bio-editor ul, & .kh-bio-editor ol': {
            pl: 3,
            my: 0.75,
          },
          '& .kh-bio-editor a': { color: 'primary.main' },
          '& .kh-bio-editor p.is-editor-empty:first-of-type::before': {
            content: 'attr(data-placeholder)',
            color: 'text.disabled',
            float: 'left',
            height: 0,
            pointerEvents: 'none',
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 0.75,
          gap: 2,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {helperText ??
            (disabled
              ? null
              : 'Sélectionnez du texte puis utilisez la barre d’outils pour le mettre en forme.')}
        </Typography>
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{ color: counterColor, whiteSpace: 'nowrap' }}
        >
          {length} / {BIO_MAX_LENGTH}
        </Typography>
      </Box>
    </Box>
  );
}
