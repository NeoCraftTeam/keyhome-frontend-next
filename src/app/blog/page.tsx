import Link from 'next/link';
import { BLOG_POSTS } from './posts';

export default function BlogPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
        <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>Accueil</Link>
        {' › '}
        <span style={{ color: '#333' }}>Blog</span>
      </nav>

      <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, marginBottom: 12 }}>
        Blog <span style={{ color: '#F6475F' }}>KeyHome</span>
      </h1>
      <p style={{ fontSize: 17, color: '#666', lineHeight: 1.7, marginBottom: 48, maxWidth: 600 }}>
        Guides pratiques, analyses de marché et conseils pour trouver votre logement en Afrique sans stress.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {BLOG_POSTS.map((post) => (
          <article
            key={post.slug}
            style={{
              border: '1px solid #eee',
              borderRadius: 16,
              padding: 28,
              transition: 'box-shadow 0.2s',
            }}
          >
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 13, color: '#888' }}>
              <span style={{ background: 'rgba(246,71,95,0.1)', color: '#F6475F', padding: '3px 10px', borderRadius: 100, fontWeight: 600 }}>
                {post.category}
              </span>
              <span>{new Date(post.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>· {post.readTime} de lecture</span>
            </div>

            <Link
              href={`/blog/${post.slug}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
                {post.title}
              </h2>
            </Link>

            <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: 16 }}>
              {post.excerpt}
            </p>

            <Link
              href={`/blog/${post.slug}`}
              style={{ color: '#F6475F', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
            >
              Lire l&apos;article →
            </Link>
          </article>
        ))}
      </div>

      {/* Cross-links */}
      <section style={{ marginTop: 56, padding: 28, background: '#f9f9f9', borderRadius: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Explorer KeyHome</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 14 }}>
          <Link href="/search" style={{ color: '#F6475F', textDecoration: 'none' }}>🔍 Rechercher un logement</Link>
          <span style={{ color: '#ddd' }}>·</span>
          <Link href="/immobilier/douala" style={{ color: '#F6475F', textDecoration: 'none' }}>Immobilier Douala</Link>
          <span style={{ color: '#ddd' }}>·</span>
          <Link href="/immobilier/abidjan" style={{ color: '#F6475F', textDecoration: 'none' }}>Immobilier Abidjan</Link>
          <span style={{ color: '#ddd' }}>·</span>
          <Link href="/immobilier/cotonou" style={{ color: '#F6475F', textDecoration: 'none' }}>Immobilier Cotonou</Link>
        </div>
      </section>
    </div>
  );
}


