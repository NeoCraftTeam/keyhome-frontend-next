'use client';

import Link from 'next/link';
import { brand } from '@/theme/tokens';
import type { BlogPost } from '@/app/blog/posts';
import { motion, useReducedMotion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

interface BlogPostsListProps {
  posts: BlogPost[];
}

export default function BlogPostsList({ posts }: BlogPostsListProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {posts.map((post, index) => (
        <motion.article
          key={post.slug}
          variants={reduceMotion ? undefined : cardVariants}
          initial={reduceMotion ? false : 'hidden'}
          whileInView={reduceMotion ? undefined : 'show'}
          viewport={{ once: true, margin: '-40px' }}
          custom={index}
          whileHover={
            reduceMotion
              ? undefined
              : {
                  y: -4,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.1)',
                  transition: { duration: 0.25 },
                }
          }
          style={{
            border: '1px solid var(--kh-border-subtle)',
            borderRadius: 16,
            padding: 28,
            background: 'var(--kh-bg-surface)',
            transition: reduceMotion ? 'box-shadow 0.2s' : undefined,
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
        </motion.article>
      ))}
    </div>
  );
}
