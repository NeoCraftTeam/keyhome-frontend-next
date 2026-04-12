'use client';

import CodeIcon from '@mui/icons-material/Code';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LinkIcon from '@mui/icons-material/Link';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownBioEditorProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
}

const CHEATSHEET = [
  {
    syntax: '**texte**',
    label: 'Gras',
    icon: <FormatBoldIcon sx={{ fontSize: 16 }} />,
  },
  {
    syntax: '*texte*',
    label: 'Italique',
    icon: <FormatItalicIcon sx={{ fontSize: 16 }} />,
  },
  { syntax: '# Titre', label: 'Titre', icon: null },
  {
    syntax: '- élément',
    label: 'Liste',
    icon: <FormatListBulletedIcon sx={{ fontSize: 16 }} />,
  },
  {
    syntax: '[texte](url)',
    label: 'Lien',
    icon: <LinkIcon sx={{ fontSize: 16 }} />,
  },
  { syntax: '`code`', label: 'Code', icon: <CodeIcon sx={{ fontSize: 16 }} /> },
];

const markdownRendererSx = {
  '& h1, & h2, & h3': { fontWeight: 700, mt: 1.5, mb: 0.5 },
  '& h1': { fontSize: '1.15rem' },
  '& h2': { fontSize: '1rem' },
  '& h3': { fontSize: '0.95rem' },
  '& p': {
    my: 0.5,
    lineHeight: 1.7,
    fontSize: '0.875rem',
    color: 'text.secondary',
  },
  '& ul, & ol': { pl: 2.5, my: 0.5 },
  '& li': { fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.7 },
  '& a': { color: 'primary.main', textDecoration: 'underline' },
  '& code': {
    bgcolor: 'action.hover',
    px: 0.6,
    py: 0.2,
    borderRadius: 1,
    fontSize: '0.8rem',
    fontFamily: 'monospace',
  },
  '& strong': { fontWeight: 700 },
  '& em': { fontStyle: 'italic' },
};

export default function MarkdownBioEditor({
  value,
  onChange,
  disabled = false,
  maxLength = 2000,
  placeholder = "Décrivez-vous : votre expérience, vos biens, votre zone d'activité…",
}: MarkdownBioEditorProps) {
  const [tab, setTab] = useState<0 | 1>(0);
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertSyntax = (syntax: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    let inserted = syntax;
    if (syntax === '**texte**' && selected) inserted = `**${selected}**`;
    else if (syntax === '*texte*' && selected) inserted = `*${selected}*`;
    else if (syntax === '`code`' && selected) inserted = `\`${selected}\``;
    const newVal = value.slice(0, start) + inserted + value.slice(end);
    onChange(newVal.slice(0, maxLength));
    requestAnimationFrame(() => {
      el.selectionStart = start + inserted.length;
      el.selectionEnd = start + inserted.length;
      el.focus();
    });
  };

  if (disabled) {
    return (
      <Box sx={markdownRendererSx}>
        {value ? (
          <ReactMarkdown>{value}</ReactMarkdown>
        ) : (
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ fontStyle: 'italic' }}
          >
            Aucune bio renseignée.
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        '&:focus-within': { borderColor: 'primary.main' },
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          pt: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: (t) =>
            t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'grey.50',
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v as 0 | 1)}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              py: 0,
              fontSize: '0.78rem',
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
        >
          <Tab label="Écrire" />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VisibilityIcon sx={{ fontSize: 14 }} />
                Prévisualiser
              </Box>
            }
          />
        </Tabs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          {tab === 0 &&
            CHEATSHEET.slice(0, 4).map((c) => (
              <Tooltip key={c.label} title={`${c.label}: ${c.syntax}`} arrow>
                <IconButton
                  size="small"
                  onClick={() => insertSyntax(c.syntax)}
                  aria-label={c.label}
                  sx={{ color: 'text.secondary' }}
                >
                  {c.icon ?? (
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{ lineHeight: 1 }}
                    >
                      H
                    </Typography>
                  )}
                </IconButton>
              </Tooltip>
            ))}
          <Tooltip title="Aide Markdown" arrow>
            <IconButton
              size="small"
              onClick={() => setShowCheatsheet((s) => !s)}
              aria-label="Aide Markdown"
              sx={{ color: showCheatsheet ? 'primary.main' : 'text.secondary' }}
            >
              <HelpOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Cheatsheet */}
      <Collapse in={showCheatsheet}>
        <Box
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: (t) =>
              t.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(0,0,0,0.02)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ mr: 0.5 }}
          >
            Aide Markdown :
          </Typography>
          {CHEATSHEET.map((c) => (
            <Chip
              key={c.label}
              label={
                <span>
                  <strong>{c.label}</strong>{' '}
                  <code style={{ fontSize: '0.75rem' }}>{c.syntax}</code>
                </span>
              }
              size="small"
              variant="outlined"
              onClick={() => {
                setTab(0);
                insertSyntax(c.syntax);
              }}
              sx={{
                height: 24,
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            />
          ))}
        </Box>
      </Collapse>

      {/* Editor / Preview */}
      {tab === 0 ? (
        <Box sx={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
            placeholder={placeholder}
            rows={6}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              lineHeight: 1.7,
              background: 'transparent',
              color: 'inherit',
              minHeight: 120,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 6,
              right: 10,
              pointerEvents: 'none',
            }}
          >
            <Typography
              variant="caption"
              color={
                value.length > maxLength * 0.9
                  ? 'warning.main'
                  : 'text.disabled'
              }
            >
              {value.length}/{maxLength}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: 2, minHeight: 120, ...markdownRendererSx }}>
          {value.trim() ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ fontStyle: 'italic' }}
            >
              Aucun contenu à prévisualiser.
            </Typography>
          )}
        </Box>
      )}

      {/* Footer */}
      <Divider />
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="caption" color="text.disabled">
          Supporte le Markdown — <strong>**gras**</strong>, <em>*italique*</em>,
          # Titres, - Listes
        </Typography>
      </Box>
    </Paper>
  );
}
