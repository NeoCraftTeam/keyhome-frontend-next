import Link from 'next/link';
import { BLOG_POSTS } from './posts';
import { brand } from '@/theme/tokens';

export default function BlogPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>
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
        <span style={{ color: 'var(--kh-text-accent)' }}>Blog</span>
      </nav>

      <h1
        style={{
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 800,
          marginBottom: 12,
        }}
      >
        Blog <span style={{ color: brand.primary }}>KeyHome</span>
      </h1>
      <p
        style={{
          fontSize: 17,
          color: 'var(--kh-text-secondary)',
          lineHeight: 1.7,
          marginBottom: 48,
          maxWidth: 600,
        }}
      >
        Guides pratiques, analyses de marché et conseils pour trouver votre
        logement en Afrique sans stress.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {BLOG_POSTS.map((post) => (
          <article
            key={post.slug}
            style={{
              border: '1px solid var(--kh-border-subtle)',
              borderRadius: 16,
              padding: 28,
              transition: 'box-shadow 0.2s',
              background: 'var(--kh-bg-surface)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginBottom: 12,
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

            <Link
              href={`/blog/${post.slug}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}
              >
                {post.title}
              </h2>
            </Link>

            <p
              style={{
                fontSize: 15,
                color: 'var(--kh-text-secondary)',
                lineHeight: 1.7,
                marginBottom: 16,
              }}
            >
              {post.excerpt}
            </p>

            <Link
              href={`/blog/${post.slug}`}
              style={{
                color: brand.primary,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Lire l&apos;article →
            </Link>
          </article>
        ))}
      </div>

      {/* Cross-links */}
      <section
        style={{
          marginTop: 56,
          padding: 28,
          background: 'var(--kh-bg-alt)',
          borderRadius: 16,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          Explorer KeyHome
        </h2>
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 14 }}
        >
          <Link
            href="/search"
            style={{ color: brand.primary, textDecoration: 'none' }}
          >
            🔍 Rechercher un logement
          </Link>
          <span style={{ color: 'var(--kh-border)' }}>·</span>
          <Link
            href="/immobilier/douala"
            style={{ color: brand.primary, textDecoration: 'none' }}
          >
            Immobilier Douala
          </Link>
          <span style={{ color: 'var(--kh-border)' }}>·</span>
          <Link
            href="/immobilier/abidjan"
            style={{ color: brand.primary, textDecoration: 'none' }}
          >
            Immobilier Abidjan
          </Link>
          <span style={{ color: 'var(--kh-border)' }}>·</span>
          <Link
            href="/immobilier/cotonou"
            style={{ color: brand.primary, textDecoration: 'none' }}
          >
            Immobilier Cotonou
          </Link>
        </div>
      </section>
    </div>
  );
}
