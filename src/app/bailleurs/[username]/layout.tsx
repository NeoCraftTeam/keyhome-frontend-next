import type { Metadata } from 'next';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  try {
    const res = await fetch(`${API_URL}/users/${username}/public-profile`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      const user = json.data ?? json;
      const displayName: string =
        user.display_name ??
        (`${user.firstname ?? ''} ${user.lastname ?? ''}`.trim() ||
          'Propriétaire');
      const total: number = user.total_active_ads ?? 0;
      const city: string = user.city_name ? ` à ${user.city_name}` : '';
      const avatarUrl: string =
        user.avatar ?? 'https://keyhome.app/images/logo.png';

      return {
        title: `${displayName} — Propriétaire immobilier | KeyHome`,
        description: `Découvrez les ${total ? `${total} annonce${total > 1 ? 's' : ''} de ` : 'annonces de '}${displayName}${city} sur KeyHome. Biens vérifiés, contact direct.`,
        alternates: { canonical: `https://keyhome.app/bailleurs/${username}` },
        openGraph: {
          title: `${displayName} — Propriétaire | KeyHome`,
          description: `Profil propriétaire de ${displayName} sur KeyHome.${total ? ` ${total} bien${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}.` : ''}`,
          url: `https://keyhome.app/bailleurs/${username}`,
          siteName: 'KeyHome',
          images: [
            { url: avatarUrl, width: 400, height: 400, alt: displayName },
          ],
        },
      };
    }
  } catch {
    // Fail silently — fallback metadata below
  }

  return {
    title: 'Profil propriétaire — KeyHome',
    description:
      'Découvrez les annonces de ce propriétaire sur KeyHome. Biens immobiliers vérifiés, contact direct.',
    alternates: { canonical: `https://keyhome.app/bailleurs/${username}` },
  };
}

export default function BailleurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
