import Link from 'next/link';
import BlogPostsList from '@/components/blog/BlogPostsList';
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

      <BlogPostsList posts={BLOG_POSTS} />

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
