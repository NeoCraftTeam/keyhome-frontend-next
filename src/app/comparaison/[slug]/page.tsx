import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COMPARISONS } from '../comparisons';
import { brand, gradient } from '@/theme/tokens';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';
import { buildHreflangAlternates } from '@/i18n/routing';

export function generateStaticParams() {
  return Object.keys(COMPARISONS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = COMPARISONS[slug];
  if (!data) notFound();

  const site = getSiteOrigin();
  const path = `/comparaison/${slug}`;

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    alternates: {
      canonical: absoluteUrl(path),
      languages: buildHreflangAlternates(absoluteUrl(path)),
    },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: absoluteUrl(path),
      siteName: 'KeyHome',
      images: [
        {
          url: `${site}/og?title=${encodeURIComponent(data.title)}&subtitle=${encodeURIComponent(`${data.labelA} vs ${data.labelB} — comparatif`)}`,
          width: 1200,
          height: 630,
          alt: data.metaTitle,
        },
      ],
    },
  };
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = COMPARISONS[slug];

  if (!data) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.metaDescription,
    url: absoluteUrl(`/comparaison/${slug}`),
    publisher: {
      '@type': 'Organization',
      name: 'KeyHome',
      url: absoluteUrl('/'),
    },
    dateModified: new Date().toISOString(),
  };

  // BreadcrumbList JSON-LD for rich snippets
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: getSiteOrigin(),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Comparaisons',
        item: absoluteUrl('/comparaison'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${data.labelA} vs ${data.labelB}`,
        item: absoluteUrl(`/comparaison/${slug}`),
      },
    ],
  };

  const cellStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    fontSize: 14,
    lineHeight: 1.6,
    verticalAlign: 'top',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '40px 20px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Breadcrumb */}
        <nav
          style={{
            fontSize: 13,
            color: 'var(--kh-text-muted)',
            marginBottom: 24,
          }}
        >
          <Link
            href="/"
            style={{ color: 'var(--kh-text-muted)', textDecoration: 'none' }}
          >
            KeyHome
          </Link>
          {' › '}
          <Link
            href="/comparaison"
            style={{ color: 'var(--kh-text-muted)', textDecoration: 'none' }}
          >
            Comparaisons
          </Link>
          {' › '}
          <span style={{ color: 'var(--kh-text-primary)', fontWeight: 600 }}>
            {data.labelA} vs {data.labelB}
          </span>
        </nav>

        {/* Header */}
        <h1
          style={{
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 1.25,
            marginBottom: 20,
            color: 'var(--kh-text-strong)',
          }}
        >
          {data.title}
        </h1>
        <p
          style={{
            color: 'var(--kh-text-secondary)',
            lineHeight: 1.8,
            fontSize: 16,
            marginBottom: 40,
            maxWidth: 760,
          }}
        >
          {data.intro}
        </p>

        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            background: '#111',
            borderRadius: '12px 12px 0 0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px',
              color: 'var(--kh-text-muted)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Critère
          </div>
          <div
            style={{
              padding: '16px',
              background: gradient.primary135,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {data.labelA}
          </div>
          <div
            style={{
              padding: '16px',
              background: '#1C1C2E',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {data.labelB}
          </div>
        </div>

        {/* Comparison sections */}
        {data.sections.map((section) => (
          <div key={section.title}>
            {/* Section header */}
            <div
              style={{
                background: 'var(--kh-bg-alt)',
                padding: '10px 16px',
                borderLeft: `4px solid ${brand.primary}`,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--kh-text-accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {section.title}
            </div>
            {/* Rows */}
            {section.items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  background:
                    i % 2 === 0 ? 'var(--kh-row-even)' : 'var(--kh-row-odd)',
                  borderLeft: '1px solid var(--kh-border-subtle)',
                  borderRight: '1px solid var(--kh-border-subtle)',
                }}
              >
                <div
                  style={{
                    ...cellStyle,
                    fontWeight: 500,
                    color: 'var(--kh-text-primary)',
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    ...cellStyle,
                    color: 'var(--kh-text-accent)',
                    borderLeft: '1px solid var(--kh-border-subtle)',
                  }}
                >
                  {item.a}
                </div>
                <div
                  style={{
                    ...cellStyle,
                    color: 'var(--kh-text-accent)',
                    borderLeft: '1px solid var(--kh-border-subtle)',
                  }}
                >
                  {item.b}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div
          style={{
            border: '1px solid var(--kh-border-subtle)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            height: 8,
          }}
        />

        {/* Verdict */}
        <div
          style={{
            marginTop: 40,
            padding: '28px 32px',
            background: 'var(--kh-bg-tinted)',
            borderRadius: 16,
            borderLeft: `4px solid ${brand.primary}`,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: brand.primaryDark,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <EmojiEventsIcon style={{ fontSize: 22 }} />
            Notre verdict
          </h2>
          <p
            style={{
              lineHeight: 1.8,
              color: 'var(--kh-text-accent)',
              fontSize: 15,
              margin: 0,
            }}
          >
            {data.verdict}
          </p>
        </div>

        {/* Related links */}
        <section style={{ marginTop: 56 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--kh-text-primary)',
              marginBottom: 16,
            }}
          >
            Explorez par vous-même
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {data.relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '12px 22px',
                  borderRadius: 100,
                  background: gradient.primary135,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(246,71,95,0.25)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Other comparisons */}
        <section style={{ marginTop: 48 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--kh-text-primary)',
              marginBottom: 14,
            }}
          >
            Autres comparaisons
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {Object.values(COMPARISONS)
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/comparaison/${c.slug}`}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 100,
                    border: '1px solid var(--kh-border)',
                    fontSize: 14,
                    color: 'var(--kh-text-accent)',
                    textDecoration: 'none',
                    background: 'var(--kh-bg-surface)',
                  }}
                >
                  {c.labelA} vs {c.labelB}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </>
  );
}
