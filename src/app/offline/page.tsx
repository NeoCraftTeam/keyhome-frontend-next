import type { Metadata } from 'next';

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
        {/* Offline illustration */}
        <div
          style={{
            width: 80,
            height: 80,
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            background: 'rgba(246,71,95,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
          }}
        >
          📡
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
          Impossible de charger cette page. Vérifiez votre connexion internet
          puis réessayez.
        </p>

        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'linear-gradient(to right, #F6475F, #D93A50)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '14px 32px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) => ((e.target as HTMLButtonElement).style.opacity = '0.9')}
          onMouseOut={(e) => ((e.target as HTMLButtonElement).style.opacity = '1')}
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
