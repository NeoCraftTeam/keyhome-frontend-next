import type { PaymentHistoryItem } from '@/types';

/** Single formatter instance avoids per-cell `Intl` construction on large lists. */
const PAYMENT_HISTORY_DATE_FORMATTER = new Intl.DateTimeFormat('fr-CM', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatPaymentHistoryDate(iso: string): string {
  return PAYMENT_HISTORY_DATE_FORMATTER.format(new Date(iso));
}

const LEGACY_METHOD_LABELS: Record<string, string> = {
  mobile_money: 'Mobile',
  orange_money: 'Mobile',
  card: 'Carte',
};

const LEGACY_METHOD_DETAILS: Record<string, string> = {
  mobile_money: 'MTN Mobile Money',
  orange_money: 'Orange Money',
};

/** Primary line in the Méthode column (Mobile, Carte, PayPal…). */
export function paymentHistoryMethodPrimary(item: PaymentHistoryItem): string {
  if (item.payment_method_label) {
    return item.payment_method_label;
  }

  const key = item.payment_method ?? '';

  return LEGACY_METHOD_LABELS[key] ?? (key !== '' ? key : '—');
}

/** Secondary line (operator, •••• 4242, wallet hint). */
export function paymentHistoryMethodSecondary(
  item: PaymentHistoryItem
): string | null {
  if (item.payment_method_detail) {
    return item.payment_method_detail;
  }

  const key = item.payment_method ?? '';

  return LEGACY_METHOD_DETAILS[key] ?? null;
}

export function paymentHistoryStatusLabel(item: PaymentHistoryItem): string {
  if (item.status_label) {
    return item.status_label;
  }

  return (
    {
      success: 'Payé',
      failed: 'Échoué',
      cancelled: 'Annulé',
      pending: 'En attente',
      refunded: 'Remboursé',
    }[item.status] ?? item.status
  );
}
