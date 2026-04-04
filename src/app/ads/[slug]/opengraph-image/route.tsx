import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toFixed(1)}M FCFA`;
  }
  if (price >= 1_000) {
    return `${Math.round(price / 1_000)}k FCFA`;
  }
  return `${price} FCFA`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<ImageResponse> {
  const { slug } = await params;

  let ad: {
    title?: string;
    price?: number;
    surface_area?: number;
    bedrooms?: number;
    quarter?: { name?: string; city_name?: string };
    images?: Array<{ large?: string; url?: string }>;
  } = {};

  try {
    const res = await fetch(`${API_URL}/ads/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      ad = await res.json();
    }
  } catch {
    // fallback to empty
  }

  const imageUrl = ad.images?.[0]?.large ?? ad.images?.[0]?.url ?? null;
  const location = [ad.quarter?.name, ad.quarter?.city_name]
    .filter(Boolean)
    .join(', ');

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        fontFamily: 'sans-serif',
        backgroundColor: '#0f172a',
        position: 'relative',
      }}
    >
      {/* Background image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.4,
          }}
        />
      )}

      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#F6475F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            K
          </div>
          <span style={{ color: 'white', fontWeight: 600, fontSize: 18 }}>
            KeyHome
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            color: 'white',
            fontSize: 36,
            fontWeight: 800,
            lineHeight: 1.2,
            maxWidth: 700,
          }}
        >
          {ad.title ?? 'Annonce immobilière'}
        </div>

        {/* Location */}
        {location && (
          <div style={{ color: '#94a3b8', fontSize: 20 }}>📍 {location}</div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
          {ad.price && (
            <div
              style={{
                backgroundColor: '#F6475F',
                color: 'white',
                padding: '8px 20px',
                borderRadius: 99,
                fontWeight: 700,
                fontSize: 22,
              }}
            >
              {formatPrice(ad.price)}/mois
            </div>
          )}
          {ad.surface_area && (
            <div
              style={{
                color: 'white',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ opacity: 0.7 }}>Surface</span>
              <strong>{ad.surface_area} m²</strong>
            </div>
          )}
          {ad.bedrooms !== undefined && ad.bedrooms > 0 && (
            <div
              style={{
                color: 'white',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ opacity: 0.7 }}>Chambres</span>
              <strong>{ad.bedrooms}</strong>
            </div>
          )}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}
