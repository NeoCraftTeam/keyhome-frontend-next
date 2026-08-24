'use client';

import AppAlert from '@/components/ui/feedback/AppAlert';

/**
 * User-facing notice when the anti-bot check cannot complete.
 *
 * Deliberately says nothing about the vendor, the numeric error code, or our
 * configuration. Error text is read by whoever triggers it — including someone
 * probing the login form — and naming the CAPTCHA provider plus its exact
 * failure code hands over a free fingerprint of the stack and of *why* the
 * check failed (unauthorised domain, dummy keys, expired token…). None of that
 * helps a legitimate visitor, who only needs to know what to do next.
 *
 * The code is still surfaced for developers, but only in a development build
 * and only through the console — never in the DOM.
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
 */

/** What the visitor can actually do about it. */
type Remedy = 'retry' | 'browser' | 'contact';

/**
 * Maps a Cloudflare client error code to an actionable remedy.
 *
 * Grouped by code family rather than exact value — Cloudflare documents these
 * as `NNNNNN` families and adds new members over time, so matching on the
 * prefix keeps the mapping valid without tracking every code.
 *
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/
 */
function remedyForCode(code: string): Remedy {
  // 1xxxxx — our own misconfiguration (unauthorised hostname, bad sitekey,
  // deprecated api.js). The visitor can do nothing; retrying will not help.
  if (code.startsWith('1')) {
    return 'contact';
  }

  // 3xxxxx / 6xxxxx — challenge execution or solve failure. In the wild this is
  // overwhelmingly an environment problem on the device: content blocker,
  // hardened privacy mode, an outdated in-app WebView, or a skewed clock. These
  // are exactly the "only on certain devices" reports.
  if (code.startsWith('3') || code.startsWith('6')) {
    return 'browser';
  }

  // 2xxxxx (network / timeout) and anything unrecognised: a retry is the
  // cheapest correct advice.
  return 'retry';
}

const MESSAGES: Record<Remedy, { title: string; body: string }> = {
  retry: {
    title: 'Vérification de sécurité incomplète',
    body: 'La vérification n’a pas abouti. Rechargez la page puis réessayez.',
  },
  browser: {
    title: 'Vérification de sécurité bloquée',
    body:
      'Votre navigateur a empêché la vérification de s’exécuter. Désactivez les ' +
      'bloqueurs de contenu sur cette page, ou réessayez depuis un autre ' +
      'navigateur. Vérifiez aussi que la date et l’heure de votre appareil sont correctes.',
  },
  contact: {
    title: 'Vérification de sécurité indisponible',
    body:
      'La vérification est momentanément indisponible. Réessayez plus tard ; si ' +
      'le problème persiste, contactez le support.',
  },
};

export default function TurnstileConfigAlert({
  code,
}: {
  code: string | null;
}) {
  if (!code) {
    return null;
  }

  const remedy = remedyForCode(code);
  const { title, body } = MESSAGES[remedy];

  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[Turnstile] error-callback code=${code} → remedy=${remedy}. ` +
        'Codes 1xxxxx are configuration issues (check the widget hostnames and ' +
        'that config:clear ran); see ' +
        'https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/'
    );
  }

  return (
    <AppAlert severity="warning" title={title} message={body} sx={{ mb: 2 }} />
  );
}
