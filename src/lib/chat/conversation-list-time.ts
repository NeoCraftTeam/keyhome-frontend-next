import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Inbox row clock: today → `HH:mm`; yesterday → `hier · HH:mm`;
 * same year → `dd/MM · HH:mm`; older → `dd/MM/yyyy · HH:mm`.
 */
export function formatConversationListTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const time = format(d, 'HH:mm', { locale: fr });
  if (isToday(d)) {
    return time;
  }
  if (isYesterday(d)) {
    return `hier · ${time}`;
  }
  const now = new Date();
  if (d.getFullYear() === now.getFullYear()) {
    return `${format(d, 'dd/MM', { locale: fr })} · ${time}`;
  }
  return `${format(d, 'dd/MM/yyyy', { locale: fr })} · ${time}`;
}
