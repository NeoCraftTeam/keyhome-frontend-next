import { markdownBlogToHtml } from '@/lib/markdown-blog';
import { absoluteAssetUrl, absoluteUrl, getSiteOrigin } from '@/lib/site-url';
import { brand, gradient } from '@/theme/tokens';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BLOG_POSTS } from '../posts';

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

  const site = getSiteOrigin();
  const path = `/blog/${slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: absoluteUrl(path),
      languages: {
        'fr-FR': absoluteUrl(path),
        'x-default': absoluteUrl(path),
      },
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: absoluteUrl(path),
      publishedTime: post.date,
      siteName: 'KeyHome',
      images: [
        {
          url: `${site}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
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
  const site = getSiteOrigin();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': absoluteUrl(`/blog/${slug}#article`),
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    image: {
      '@type': 'ImageObject',
      url: `${site}/images/og-cover.png`,
      width: 1200,
      height: 630,
    },
    inLanguage: 'fr-FR',
    author: {
      '@type': 'Organization',
      '@id': `${site}/#organization`,
      name: 'KeyHome',
      url: site,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${site}/#organization`,
      name: 'KeyHome',
      logo: {
        '@type': 'ImageObject',
        url: absoluteAssetUrl('/images/logo.png'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/blog/${slug}`),
    },
    isPartOf: {
      '@type': 'Blog',
      '@id': `${site}/blog#blog`,
      name: 'Blog KeyHome',
      url: `${site}/blog`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article
        style={{ maxWidth: 760, margin: '0 auto', padding: '48px 16px 80px' }}
      >
        {/* Breadcrumb */}
        <nav
          style={{
            fontSize: 14,
            color: 'var(--kh-text-muted)',
            marginBottom: 32,
          }}
        >
          <Link
            href="/"
            style={{ color: 'var(--kh-text-muted)', textDecoration: 'none' }}
          >
            Accueil
          </Link>
          {' › '}
          <Link
            href="/blog"
            style={{ color: 'var(--kh-text-muted)', textDecoration: 'none' }}
          >
            Blog
          </Link>
          {' › '}
          <span style={{ color: 'var(--kh-text-accent)' }}>
            {post.title.length > 40
              ? post.title.slice(0, 40) + '…'
              : post.title}
          </span>
        </nav>

        {/* Article meta */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--kh-text-muted)',
          }}
        >
          <span
            style={{
              background: brand.primaryAlpha10,
              color: brand.primary,
              padding: '3px 10px',
              borderRadius: 100,
              fontWeight: 600,
            }}
          >
            {post.category}
          </span>
          <span>
            {new Date(post.date).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span>· {post.readTime} de lecture</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(26px, 5vw, 40px)',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: 24,
          }}
        >
          {post.title}
        </h1>

        <p
          style={{
            fontSize: 18,
            color: 'var(--kh-text-secondary)',
            lineHeight: 1.8,
            marginBottom: 40,
          }}
        >
          {post.excerpt}
        </p>

        {/* Article content — rendered from static content field */}
        {post.content ? (
          <div
            style={{
              fontSize: 16,
              lineHeight: 1.9,
              color: 'var(--kh-text-primary)',
              marginBottom: 40,
            }}
            dangerouslySetInnerHTML={{
              __html: markdownBlogToHtml(post.content),
            }}
          />
        ) : (
          <div
            style={{
              padding: 40,
              background: 'var(--kh-bg-alt)',
              borderRadius: 16,
              textAlign: 'center',
              color: 'var(--kh-text-muted)',
              marginBottom: 40,
            }}
          >
            <p style={{ fontSize: 16, marginBottom: 8 }}>
              &#128221; Contenu complet à venir
            </p>
            <p style={{ fontSize: 14 }}>
              Cet article est en cours de rédaction. Revenez bientôt pour le
              guide complet !
            </p>
          </div>
        )}

        {/* Internal links CTA */}
        <div
          style={{
            padding: 28,
            border: '1px solid var(--kh-border-subtle)',
            borderRadius: 16,
            marginBottom: 40,
            background: 'var(--kh-bg-surface)',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Vous cherchez un logement ?
          </h2>
          <p
            style={{
              fontSize: 15,
              color: 'var(--kh-text-secondary)',
              marginBottom: 16,
            }}
          >
            Trouvez votre prochain logement parmi des milliers d&apos;annonces
            vérifiées sur KeyHome.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link
              href="/search"
              style={{
                display: 'inline-flex',
                padding: '10px 20px',
                borderRadius: 10,
                background: gradient.primary135,
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Rechercher un logement
            </Link>
            <Link
              href="/immobilier/douala"
              style={{
                display: 'inline-flex',
                padding: '10px 20px',
                borderRadius: 10,
                border: '1px solid var(--kh-border)',
                fontSize: 14,
                textDecoration: 'none',
                color: 'var(--kh-text-accent)',
                background: 'var(--kh-bg-surface)',
              }}
            >
              Immobilier Douala
            </Link>
            <Link
              href="/immobilier/abidjan"
              style={{
                display: 'inline-flex',
                padding: '10px 20px',
                borderRadius: 10,
                border: '1px solid var(--kh-border)',
                fontSize: 14,
                textDecoration: 'none',
                color: 'var(--kh-text-accent)',
                background: 'var(--kh-bg-surface)',
              }}
            >
              Immobilier Abidjan
            </Link>
          </div>
        </div>

        {/* Back to blog */}
        <Link
          href="/blog"
          style={{
            color: brand.primary,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          ← Retour au blog
        </Link>
      </article>
    </>
  );
}
