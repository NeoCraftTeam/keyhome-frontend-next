import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

const BRAND_COLOR = '#F6475F';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const title = searchParams.get('title') ?? 'KeyHome';
  const subtitle =
    searchParams.get('subtitle') ?? 'Votre patrimoine immobilier en poche';
  const type = searchParams.get('type') ?? 'default';
  const imageUrl = searchParams.get('image');

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#141419',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Radial glow */}
      <div
        style={{
          position: 'absolute',
          top: -120,
          left: -120,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${BRAND_COLOR}33 0%, transparent 70%)`,
        }}
      />

      {/* Property image strip (ad pages) */}
      {type === 'ad' && imageUrl && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '45%',
            display: 'flex',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.85,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to right, #141419 0%, transparent 40%)',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: '100%',
          padding: '56px 64px',
          maxWidth: type === 'ad' && imageUrl ? '60%' : '100%',
          gap: 16,
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: BRAND_COLOR,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            🏠
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 22 }}>
            KeyHome
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            color: '#ffffff',
            fontSize: title.length > 50 ? 36 : 44,
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: '#ffffffaa',
            fontSize: 20,
            lineHeight: 1.4,
            marginTop: 4,
          }}
        >
          {subtitle}
        </div>

        {/* CTA bar */}
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              background: BRAND_COLOR,
              color: '#fff',
              padding: '10px 24px',
              borderRadius: 100,
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            keyhome.app
          </div>
          <div style={{ color: '#ffffff66', fontSize: 15 }}>
            Annonces vérifiées · Contact direct · Mobile Money
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}
