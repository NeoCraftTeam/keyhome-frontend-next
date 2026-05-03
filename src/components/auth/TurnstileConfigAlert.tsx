'use client';

import { Alert, Link } from '@mui/material';

const CF_HOSTNAME_DOC =
  'https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/';
const CF_ERROR_CODES =
  'https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/';

/**
 * User-facing hints when Turnstile invokes error-callback (e.g. 110200 domain not allowed).
 */
export default function TurnstileConfigAlert({
  code,
}: {
  code: string | null;
}) {
  if (!code) {
    return null;
  }

  if (code === '110200') {
    return (
      <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
        Ce domaine n’est pas autorisé pour cette clé Turnstile (erreur{' '}
        <Link
          href={CF_ERROR_CODES}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
        >
          110200
        </Link>
        ). Ajoutez l’hôte exact (ex. <code>localhost</code> ou votre URL Vercel)
        dans Cloudflare → Turnstile → widget → <strong>Hostnames</strong> (
        <Link href={CF_HOSTNAME_DOC} target="_blank" rel="noopener noreferrer">
          documentation
        </Link>
        ). Côté Laravel, avec <code>APP_ENV=local</code>, les clés factices
        s’appliquent même si le <code>.env</code> contient de vraies clés ;
        exécutez <code>php artisan config:clear</code> si le widget ne se met
        pas à jour. Pour forcer les vraies clés en local :{' '}
        <code>TURNSTILE_USE_PRODUCTION_KEYS=true</code> (et sur Next{' '}
        <code>NEXT_PUBLIC_TURNSTILE_USE_PRODUCTION_KEYS=true</code>) puis
        ajoutez le hostname dans Cloudflare.
      </Alert>
    );
  }

  return (
    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
      La vérification Cloudflare Turnstile a échoué (code {code}). Réessayez
      après avoir rechargé la page, ou consultez la{' '}
      <Link href={CF_ERROR_CODES} target="_blank" rel="noopener noreferrer">
        liste des codes d’erreur
      </Link>
      .
    </Alert>
  );
}
