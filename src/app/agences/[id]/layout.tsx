import type { Metadata } from 'next';
import { BRAND_TAGLINE } from '@/lib/brand';
import { absoluteAssetUrl, absoluteUrl } from '@/lib/site-url';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/agencies/${id}`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      const agency = json.data ?? json;
      const name: string = agency.name ?? 'Agence immobilière';
      const total: number = json.meta?.total ?? 0;
      const path = `/agences/${id}`;

      return {
        title: `${name} — Agence immobilière sur KeyHome`,
        description: `${BRAND_TAGLINE}. Découvrez les annonces de l'agence ${name} sur KeyHome.${total ? ` ${total} bien${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}.` : ''} Annonces vérifiées, contact direct.`,
        alternates: { canonical: absoluteUrl(path) },
        openGraph: {
          title: `${name} — Agence immobilière | KeyHome`,
          description: `${BRAND_TAGLINE}. Toutes les annonces de l'agence ${name}. Biens vérifiés disponibles sur KeyHome.`,
          url: absoluteUrl(path),
          siteName: 'KeyHome',
          images: [
            {
              url: absoluteAssetUrl(agency.logo as string | undefined),
              width: 1200,
              height: 630,
              alt: name,
            },
          ],
        },
      };
    }
  } catch {
    // Fail silently — fallback metadata below
  }

  const path = `/agences/${id}`;

  return {
    title: 'Profil agence — KeyHome',
    description: `${BRAND_TAGLINE}. Découvrez les annonces de cette agence immobilière sur KeyHome. Biens vérifiés, contact direct propriétaire.`,
    alternates: { canonical: absoluteUrl(path) },
  };
}

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
