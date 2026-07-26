/**
 * Query parameters appended by hosted checkout gateways (Kpay).
 */

export type PaymentReturnParams = {
  txRef: string | null;
  gatewayReference: string | null;
  status: string | null;
};

export function parsePaymentReturnParams(
  searchParams: URLSearchParams
): PaymentReturnParams {
  const txRef = searchParams.get('tx_ref');
  const gatewayReference =
    searchParams.get('reference') ??
    searchParams.get('paymentId') ??
    searchParams.get('trx_ref') ??
    searchParams.get('transaction_id');

  return {
    txRef: txRef && txRef.trim() !== '' ? txRef.trim() : null,
    gatewayReference:
      gatewayReference && gatewayReference.trim() !== ''
        ? gatewayReference.trim()
        : null,
    status: searchParams.get('status'),
  };
}

export function hasPaymentReturnReference(
  params: PaymentReturnParams
): boolean {
  return params.txRef !== null || params.gatewayReference !== null;
}

/** Kpay may use `completed`; accept other common success synonyms too. */
export function isGatewayRedirectSuccess(status: string | null): boolean {
  if (!status) {
    return false;
  }
  const s = status.toLowerCase();
  return (
    s === 'successful' ||
    s === 'success' ||
    s === 'completed' ||
    s === 'complete' ||
    s === 'paid'
  );
}

export type PaymentVerifySnapshot = {
  status?: string | null;
  is_paid?: boolean;
};

/**
 * Decide whether a verify response should surface as failure while the hosted
 * checkout redirect still reports success (sandbox lag, webhook delay, etc.).
 */
export function shouldDeferVerifyFailure(
  verify: PaymentVerifySnapshot | null | undefined,
  redirectStatus: string | null
): boolean {
  if (!isGatewayRedirectSuccess(redirectStatus)) {
    return false;
  }

  if (verify?.is_paid === true) {
    return false;
  }

  const normalized = verify?.status?.toLowerCase() ?? '';

  return (
    normalized === '' ||
    normalized === 'pending' ||
    normalized === 'failed' ||
    normalized === 'declined' ||
    normalized === 'error'
  );
}

/**
 * Maps verify API output + redirect query to a UI terminal state.
 * Returns `retry` when polling should continue (redirect says paid, API disagrees).
 * Returns `pending` when the redirect reports success but verify never confirms
 * after retries are exhausted — the customer was probably charged but the
 * webhook hasn't landed yet; show "confirmation en cours" rather than a
 * misleading "success" (credits/access aren't actually granted yet).
 */
export function resolvePaymentVerifyUiState(
  verify: PaymentVerifySnapshot | null | undefined,
  redirectStatus: string | null,
  options: { retriesExhausted?: boolean } = {}
): 'success' | 'pending' | 'failed' | 'cancelled' | 'retry' {
  const exhausted = options.retriesExhausted === true;

  if (isGatewayRedirectCancelled(redirectStatus)) {
    return 'cancelled';
  }

  if (verify?.is_paid === true || verify?.status?.toLowerCase() === 'success') {
    return 'success';
  }

  if (verify?.status?.toLowerCase() === 'cancelled') {
    return 'cancelled';
  }

  if (verify?.status?.toLowerCase() === 'completed') {
    return 'success';
  }

  if (shouldDeferVerifyFailure(verify, redirectStatus)) {
    return exhausted ? 'pending' : 'retry';
  }

  if (
    verify?.status?.toLowerCase() === 'failed' ||
    verify?.status?.toLowerCase() === 'declined' ||
    verify?.status?.toLowerCase() === 'error'
  ) {
    return 'failed';
  }

  if (isGatewayRedirectFailed(redirectStatus)) {
    return 'failed';
  }

  if (isGatewayRedirectSuccess(redirectStatus)) {
    return exhausted ? 'pending' : 'retry';
  }

  return exhausted ? 'failed' : 'retry';
}

export function isGatewayRedirectCancelled(status: string | null): boolean {
  if (!status) {
    return false;
  }
  const s = status.toLowerCase();
  return s === 'cancelled' || s === 'canceled';
}

export function isGatewayRedirectFailed(status: string | null): boolean {
  if (!status) {
    return false;
  }
  const s = status.toLowerCase();
  return s === 'declined' || s === 'failed' || s === 'error' || s === 'expired';
}

export const VALID_PAYMENT_RETURN_FLOWS = [
  'credit',
  'unlock',
  'subscription',
  'boost',
] as const;

export type PaymentReturnFlow = (typeof VALID_PAYMENT_RETURN_FLOWS)[number];

type SearchParamRecord = Readonly<
  Record<string, string | string[] | undefined>
>;

function readSearchParam(
  input: URLSearchParams | SearchParamRecord,
  key: string
): string | null {
  if (input instanceof URLSearchParams) {
    return input.get(key);
  }

  const value = input[key];
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && value[0]) {
    return value[0];
  }

  return null;
}

function toUrlSearchParams(
  input: URLSearchParams | SearchParamRecord
): URLSearchParams {
  if (input instanceof URLSearchParams) {
    return new URLSearchParams(input);
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      params.set(key, value);
    } else if (Array.isArray(value) && value[0]) {
      params.set(key, value[0]);
    }
  }

  return params;
}

/** Infer return flow when legacy `/payment/callback` omits `?flow=`. */
export function inferPaymentReturnFlow(
  input: URLSearchParams | SearchParamRecord
): PaymentReturnFlow {
  const flow = readSearchParam(input, 'flow');
  if (flow && VALID_PAYMENT_RETURN_FLOWS.includes(flow as PaymentReturnFlow)) {
    return flow as PaymentReturnFlow;
  }

  if (readSearchParam(input, 'ad_id')) {
    return 'unlock';
  }

  return 'credit';
}

/**
 * Canonical redirect target for hosted-checkout callbacks
 * (`KPAY_REDIRECT_URL` → `/payment/callback`).
 */
export function buildPaymentReturnRedirectUrl(
  input: URLSearchParams | SearchParamRecord
): string {
  const params = toUrlSearchParams(input);

  if (!params.has('flow')) {
    params.set('flow', inferPaymentReturnFlow(params));
  }

  return `/payment/return?${params.toString()}`;
}
