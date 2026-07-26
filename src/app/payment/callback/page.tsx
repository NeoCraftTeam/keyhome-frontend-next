import { buildPaymentReturnRedirectUrl } from '@/lib/payment/payment-gateway-return';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Legacy hosted-checkout return URL (`/payment/callback`).
 *
 * Kpay redirects here with `tx_ref`, `reference`, `status`, …
 * Server-side redirect to the canonical `/payment/return` route so browsers
 * receive a normal HTML navigation (not an RSC flight payload) and the shared
 * polling UI handles verification.
 */
export default async function PaymentCallbackPage({
  searchParams,
}: PageProps): Promise<never> {
  redirect(buildPaymentReturnRedirectUrl(await searchParams));
}
