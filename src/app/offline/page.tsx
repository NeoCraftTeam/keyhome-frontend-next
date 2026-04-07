import type { Metadata } from 'next';
import RetryButton from './RetryButton';

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

        <RetryButton />
      </div>
    </div>
  );
}
