import { BRAND_TAGLINE, BRAND_TITLE_WITH_TAGLINE } from '@/lib/brand';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = BRAND_TITLE_WITH_TAGLINE;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(ellipse at 50% 40%, #1e1e2e 0%, #0A0A0F 65%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
      }}
    >
      {/* Glow behind title */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 350,
          background:
            'radial-gradient(ellipse, rgba(246,71,95,0.15) 0%, transparent 70%)',
          top: 80,
          left: 250,
        }}
      />

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #F6475F 0%, #d63350 100%)',
            marginBottom: 28,
            boxShadow: '0 8px 32px rgba(246,71,95,0.4)',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
              fill="white"
            />
          </svg>
        </div>

        {/* Brand name */}
        <p
          style={{
            fontSize: 88,
            fontWeight: 800,
            color: '#F8F8FC',
            letterSpacing: '-3px',
            margin: 0,
            lineHeight: 1,
          }}
        >
          KeyHome
        </p>

        {/* Tagline */}
        <p
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: '#F6475F',
            margin: '20px 0 0 0',
            letterSpacing: '-0.5px',
            textAlign: 'center',
            maxWidth: 1000,
            lineHeight: 1.25,
          }}
        >
          {BRAND_TAGLINE}
        </p>

        {/* Separator */}
        <div
          style={{
            width: 60,
            height: 2,
            background:
              'linear-gradient(90deg, transparent, rgba(246,71,95,0.5), transparent)',
            margin: '24px 0',
          }}
        />

        {/* Value props */}
        <p
          style={{
            fontSize: 22,
            color: 'rgba(248,248,252,0.55)',
            margin: 0,
            letterSpacing: '0.3px',
          }}
        >
          Annonces vérifiées · Paiement sécurisé · Contact direct
        </p>

        {/* CTA pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 36,
            paddingLeft: 32,
            paddingRight: 32,
            paddingTop: 14,
            paddingBottom: 14,
            borderRadius: 100,
            background: 'linear-gradient(135deg, #F6475F 0%, #d63350 100%)',
            boxShadow: '0 4px 24px rgba(246,71,95,0.35)',
          }}
        >
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#fff',
              margin: 0,
              letterSpacing: '0.2px',
            }}
          >
            keyhome.app
          </p>
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
