import type { Metadata } from 'next';
import Link from 'next/link';
import { BLOG_POSTS } from '../posts';
import { brand, gradient } from '@/theme/tokens';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return { title: 'Article introuvable | KeyHome' };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `https://keyhome.app/blog/${slug}`,
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `https://keyhome.app/blog/${slug}`,
      publishedTime: post.date,
      siteName: 'KeyHome',
      images: [{ url: 'https://keyhome.app/images/og-cover.png', width: 1200, height: 630, alt: post.title }],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) notFound();

  // JSON-LD BlogPosting schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'KeyHome', url: 'https://keyhome.app' },
    publisher: {
      '@type': 'Organization',
      name: 'KeyHome',
      logo: { '@type': 'ImageObject', url: 'https://keyhome.app/images/logo.png' },
    },
    mainEntityOfPage: `https://keyhome.app/blog/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article style={{ maxWidth: 760, margin: '0 auto', padding: '48px 16px 80px' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
          <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>Accueil</Link>
          {' › '}
          <Link href="/blog" style={{ color: '#888', textDecoration: 'none' }}>Blog</Link>
          {' › '}
          <span style={{ color: '#333' }}>{post.title.length > 40 ? post.title.slice(0, 40) + '…' : post.title}</span>
        </nav>

        {/* Article meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, fontSize: 13, color: '#888' }}>
          <span style={{ background: brand.primaryAlpha10, color: brand.primary, padding: '3px 10px', borderRadius: 100, fontWeight: 600 }}>
            {post.category}
          </span>
          <span>{new Date(post.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span>· {post.readTime} de lecture</span>
        </div>

        <h1 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 24 }}>
          {post.title}
        </h1>

        <p style={{ fontSize: 18, color: '#666', lineHeight: 1.8, marginBottom: 40 }}>
          {post.excerpt}
        </p>

        {/* Article content — rendered from static content field */}
        {post.content ? (
          <div
            style={{
              fontSize: 16,
              lineHeight: 1.9,
              color: '#333',
              marginBottom: 40,
            }}
            dangerouslySetInnerHTML={{
              __html: post.content
                .trim()
                .replace(/^### (.+)$/gm, '<h3 style="font-size:20px;font-weight:700;margin:32px 0 12px">$1</h3>')
                .replace(/^## (.+)$/gm, '<h2 style="font-size:26px;font-weight:800;margin:40px 0 16px">$1</h2>')
                .replace(/^# (.+)$/gm, '<h1 style="font-size:32px;font-weight:800;margin:0 0 24px">$1</h1>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #eee;margin:32px 0">')
                .replace(/^- \[ \] (.+)$/gm, '<li style="list-style:none;margin:6px 0">&#9744; $1</li>')
                .replace(/^- (.+)$/gm, '<li style="margin:6px 0 6px 20px">$1</li>')
                .replace(/^\d+\. (.+)$/gm, '<li style="margin:6px 0 6px 20px">$1</li>')
                .replace(/\n\n/g, '</p><p style="margin:16px 0">'),
            }}
          />
        ) : (
          <div style={{ padding: 40, background: '#f9f9f9', borderRadius: 16, textAlign: 'center', color: '#999', marginBottom: 40 }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>&#128221; Contenu complet à venir</p>
            <p style={{ fontSize: 14 }}>
              Cet article est en cours de rédaction. Revenez bientôt pour le guide complet !
            </p>
          </div>
        )}

        {/* Internal links CTA */}
        <div style={{ padding: 28, border: '1px solid #eee', borderRadius: 16, marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Vous cherchez un logement ?</h2>
          <p style={{ fontSize: 15, color: '#666', marginBottom: 16 }}>
            Trouvez votre prochain logement parmi des milliers d&apos;annonces vérifiées sur KeyHome.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link
              href="/search"
              style={{
                display: 'inline-flex', padding: '10px 20px', borderRadius: 10,
                background: gradient.primary135, color: '#fff',
                fontWeight: 600, fontSize: 14, textDecoration: 'none',
              }}
            >
              Rechercher un logement
            </Link>
            <Link
              href="/immobilier/douala"
              style={{ display: 'inline-flex', padding: '10px 20px', borderRadius: 10, border: '1px solid #ddd', fontSize: 14, textDecoration: 'none', color: '#444' }}
            >
              Immobilier Douala
            </Link>
            <Link
              href="/immobilier/abidjan"
              style={{ display: 'inline-flex', padding: '10px 20px', borderRadius: 10, border: '1px solid #ddd', fontSize: 14, textDecoration: 'none', color: '#444' }}
            >
              Immobilier Abidjan
            </Link>
          </div>
        </div>

        {/* Back to blog */}
        <Link href="/blog" style={{ color: brand.primary, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          ← Retour au blog
        </Link>
      </article>
    </>
  );
}


