'use client';

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  type SxProps,
  type Theme,
} from '@mui/material';
import { type MouseEvent, useState } from 'react';

// ─── helpers ─────────────────────────────────────────────────────────────────

function toGcalStamp(date: string, time: string): string {
  return (
    date.replace(/-/g, '') + 'T' + time.slice(0, 5).replace(':', '') + '00'
  );
}

function buildIcs(
  title: string,
  date: string,
  start: string,
  end: string,
  location: string,
  description: string
): string {
  const uid =
    typeof crypto !== 'undefined'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KeyHome//keyhome.app//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART;TZID=Africa/Douala:${toGcalStamp(date, start)}`,
    `DTEND;TZID=Africa/Douala:${toGcalStamp(date, end)}`,
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description.replace(/\n/g, '\\n')}` : '',
    location ? `LOCATION:${location}` : '',
    `UID:${uid}@keyhome.app`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

function downloadIcs(
  title: string,
  date: string,
  start: string,
  end: string,
  location: string,
  description: string
): void {
  const content = buildIcs(title, date, start, end, location, description);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = title.replace(/[^a-z0-9]/gi, '-') + '.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── item config ─────────────────────────────────────────────────────────────

const ITEMS = [
  { key: 'google', label: 'Google Calendar', bg: '#4285F4', letter: 'G' },
  { key: 'apple', label: 'Apple Calendar', bg: '#1c1c1e', letter: '' },
  { key: 'outlook', label: 'Outlook.com', bg: '#0078D4', letter: 'O' },
  { key: 'ical', label: 'Fichier iCal', bg: '#e05c2b', letter: '📅' },
] as const;

// ─── brand SVG icons (inline mode) ───────────────────────────────────────────

function GoogleCalSvg({ size = 28 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="3.5"
        width="19"
        height="18"
        rx="2"
        stroke="#DADCE0"
        strokeWidth="1.2"
        fill="white"
      />
      <rect x="2.5" y="3.5" width="19" height="6.5" fill="#1A73E8" rx="2" />
      <rect x="2.5" y="7" width="19" height="3" fill="#1A73E8" />
      <line
        x1="7.5"
        y1="2"
        x2="7.5"
        y2="5"
        stroke="#5F6368"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="16.5"
        y1="2"
        x2="16.5"
        y2="5"
        stroke="#5F6368"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="17" r="2" fill="#EA4335" />
      <circle cx="12" cy="17" r="2" fill="#FBBC04" />
      <circle cx="16.5" cy="17" r="2" fill="#34A853" />
    </svg>
  );
}

function AppleCalSvg({ size = 28 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="3.5"
        width="19"
        height="18"
        rx="2"
        stroke="#DADCE0"
        strokeWidth="1.2"
        fill="white"
      />
      <rect x="2.5" y="3.5" width="19" height="6.5" fill="#FF3B30" rx="2" />
      <rect x="2.5" y="7" width="19" height="3" fill="#FF3B30" />
      <line
        x1="7.5"
        y1="2"
        x2="7.5"
        y2="5"
        stroke="#8E8E93"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="16.5"
        y1="2"
        x2="16.5"
        y2="5"
        stroke="#8E8E93"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <text
        x="12"
        y="20"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="700"
        fill="#1C1C1E"
        fontFamily="-apple-system,sans-serif"
      >
        17
      </text>
    </svg>
  );
}

function OutlookSvg({ size = 28 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="13" height="14" rx="2" fill="#0078D4" />
      <circle cx="8.5" cy="12" r="3.5" fill="white" />
      <circle cx="8.5" cy="12" r="1.8" fill="#0078D4" />
      <rect x="12" y="7.5" width="10" height="9" rx="1.5" fill="#50B4F0" />
      <polyline
        points="12,7.5 17,12 22,7.5"
        stroke="white"
        strokeWidth="1.1"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ICalSvg({ size = 28 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="3.5"
        width="19"
        height="18"
        rx="2"
        stroke="#DADCE0"
        strokeWidth="1.2"
        fill="white"
      />
      <rect x="2.5" y="3.5" width="19" height="6.5" fill="#E05C2B" rx="2" />
      <rect x="2.5" y="7" width="19" height="3" fill="#E05C2B" />
      <line
        x1="7.5"
        y1="2"
        x2="7.5"
        y2="5"
        stroke="#9E9E9E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="16.5"
        y1="2"
        x2="16.5"
        y2="5"
        stroke="#9E9E9E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 14v4.5M9.5 16.5L12 19l2.5-2.5"
        stroke="#E05C2B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function inlineIcon(key: string) {
  if (key === 'google') return <GoogleCalSvg size={28} />;
  if (key === 'apple') return <AppleCalSvg size={28} />;
  if (key === 'outlook') return <OutlookSvg size={28} />;
  return <ICalSvg size={28} />;
}

// ─── component ───────────────────────────────────────────────────────────────

function AppleSvg({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 14 14"
      width={size}
      height={size}
      fill="#fff"
      aria-hidden="true"
    >
      <path d="M11.05 7.42c-.02-1.8 1.47-2.67 1.54-2.71-0.84-1.23-2.15-1.4-2.62-1.42-1.12-.11-2.19.66-2.76.66-.57 0-1.45-.64-2.38-.62-1.22.02-2.35.71-2.97 1.8-1.27 2.2-.32 5.46.91 7.25.61.88 1.33 1.87 2.28 1.83.92-.04 1.26-.59 2.37-.59 1.1 0 1.41.59 2.37.57.98-.02 1.6-.9 2.2-1.78.69-.99.97-1.96 1-2.01-.02-.01-1.92-.74-1.94-2.98z" />
      <path d="M9.27 2.18c.51-.61.85-1.46.76-2.31-.73.03-1.62.49-2.14 1.09-.47.54-.88 1.4-.77 2.23.81.06 1.64-.41 2.15-1.01z" />
    </svg>
  );
}

export interface CalendarExportMenuProps {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  /** MUI button size. Default: 'small' */
  buttonSize?: 'small' | 'medium';
  /** MUI button variant. Default: 'outlined' */
  buttonVariant?: 'text' | 'outlined' | 'contained';
  /** Use teal accent for owner panel. Default: false */
  teal?: boolean;
  /**
   * Inline mode: render clickable icon tiles directly instead of a dropdown.
   * Use on success / confirmation screens.
   */
  inline?: boolean;
  sx?: SxProps<Theme>;
}

export default function CalendarExportMenu({
  title,
  date,
  startTime,
  endTime,
  location = '',
  description = '',
  buttonSize = 'small',
  buttonVariant = 'outlined',
  teal = false,
  inline = false,
  sx,
}: CalendarExportMenuProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);

  const start5 = startTime.slice(0, 5);
  const end5 = endTime.slice(0, 5);

  const googleUrl = [
    'https://calendar.google.com/calendar/render?action=TEMPLATE',
    `&text=${encodeURIComponent(title)}`,
    `&dates=${toGcalStamp(date, start5)}/${toGcalStamp(date, end5)}`,
    `&details=${encodeURIComponent(description)}`,
    `&location=${encodeURIComponent(location)}`,
    '&ctz=Africa%2FDouala',
  ].join('');

  const outlookUrl = [
    'https://outlook.live.com/calendar/0/action/compose',
    `?subject=${encodeURIComponent(title)}`,
    `&startdt=${encodeURIComponent(`${date}T${start5}:00`)}`,
    `&enddt=${encodeURIComponent(`${date}T${end5}:00`)}`,
    `&body=${encodeURIComponent(description)}`,
    `&location=${encodeURIComponent(location)}`,
  ].join('');

  function handleItem(key: string) {
    setAnchor(null);
    if (key === 'google')
      window.open(googleUrl, '_blank', 'noopener,noreferrer');
    else if (key === 'outlook')
      window.open(outlookUrl, '_blank', 'noopener,noreferrer');
    else downloadIcs(title, date, start5, end5, location, description);
  }

  // ── Inline mode: icon tiles ────────────────────────────────────────────────
  if (inline) {
    return (
      <Box
        sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', ...(sx as object) }}
      >
        {ITEMS.map(({ key, label }) => (
          <Box
            key={key}
            component="button"
            onClick={() => handleItem(key)}
            title={label}
            aria-label={`Ajouter à ${label}`}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              p: 0,
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                borderRadius: 1,
              },
            }}
          >
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.14)',
                },
              }}
            >
              {inlineIcon(key)}
            </Box>
            <Box
              component="span"
              sx={{
                fontSize: '0.6rem',
                color: 'text.secondary',
                textAlign: 'center',
                lineHeight: 1.2,
                maxWidth: 60,
              }}
            >
              {label}
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  // ── Dropdown mode: button + MUI Menu (Portal) ──────────────────────────────
  return (
    <>
      <Button
        size={buttonSize}
        variant={buttonVariant}
        startIcon={<CalendarMonthIcon sx={{ fontSize: '1em' }} />}
        onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
        aria-haspopup="true"
        aria-expanded={open}
        sx={{
          fontSize: '0.72rem',
          fontWeight: 500,
          textTransform: 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          ...(teal && {
            color: 'teal.main',
            borderColor: 'teal.main',
            '&:hover': {
              borderColor: 'teal.dark',
              bgcolor: 'rgba(13,148,136,0.05)',
            },
          }),
          ...sx,
        }}
      >
        Ajouter au calendrier
      </Button>

      {/* MUI Menu uses a Portal → always above dialog/drawer stack */}
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        elevation={4}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: { sx: { minWidth: 190, borderRadius: 2, mt: 0.5 } },
        }}
      >
        {ITEMS.map(({ key, label, bg, letter }) => (
          <MenuItem
            key={key}
            onClick={() => handleItem(key)}
            dense
            sx={{ gap: 1.5, py: 0.75 }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 22,
                height: 22,
                borderRadius: 0.75,
                bgcolor: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: key === 'ical' ? '0.7rem' : '0.65rem',
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {key === 'apple' ? <AppleSvg size={12} /> : letter}
            </Box>
            <Box sx={{ fontSize: '0.8rem', color: 'text.primary' }}>
              {label}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
