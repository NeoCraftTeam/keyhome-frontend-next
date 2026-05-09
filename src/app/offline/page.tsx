import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Hors ligne',
};

export default function OfflinePage() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0A0A0F',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '1.5rem',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div
          style={{
            width: 88,
            height: 88,
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            background: 'rgba(246,71,95,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local /public asset; must work without optimizer when offline */}
          <img
            src="/icons/icon-512x512.png"
            alt="KeyHome"
            width={52}
            height={52}
            style={{ display: 'block', borderRadius: 12 }}
          />
        </div>

        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            margin: '0 0 0.75rem',
            letterSpacing: '-0.02em',
          }}
        >
          Vous êtes hors ligne
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.6,
            margin: '0 0 2rem',
          }}
        >
          Cette page n&apos;a pas pu être chargée. Vérifiez votre connexion
          internet, puis utilisez « Réessayer » pour relancer le chargement.
        </p>

        {/* GET submit = full navigation to current URL. Works when client bundles fail offline. */}
        <form method="get" style={{ display: 'inline' }}>
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #F6475F 0%, #E11D48 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '14px 32px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </form>

        <p style={{ margin: '1.25rem 0 0', fontSize: '0.9rem' }}>
          <a
            href="/home"
            style={{ color: 'rgba(246,71,95,0.95)', fontWeight: 600 }}
          >
            Aller à l&apos;accueil
          </a>
        </p>
      </div>
    </div>
  );
}
