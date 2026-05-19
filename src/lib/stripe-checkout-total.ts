/**
 * Stripe Custom Checkout requires the UI to read and display the session
 * total (`checkout.total.total.amount`) before calling `checkout.confirm()`.
 */
export function readCheckoutSessionTotalAmount(checkout: {
  total?: { total?: { amount?: string } };
}): string | null {
  const amount = checkout.total?.total?.amount;
  if (typeof amount !== 'string') {
    return null;
  }

  const trimmed = amount.trim();

  return trimmed !== '' ? trimmed : null;
}
