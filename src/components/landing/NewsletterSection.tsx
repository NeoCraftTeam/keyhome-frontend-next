'use client';

import { brand, gradient, semantic } from '@/theme/tokens';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useLandingTheme } from './LandingThemeContext';

/** RFC-5322 compatible enough for client-side gating; backend re-validates. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function NewsletterSection() {
  const { bgAlt, text, textSub, surface, border } = useLandingTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError('Adresse e-mail invalide.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? ''}/newsletter/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ email: trimmed }),
        }
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data?.message ?? 'Une erreur est survenue.');
      }

      setIsSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      style={{
        background: bgAlt,
        transition: 'background 0.4s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top gradient divider */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${brand.primary}, transparent)`,
        }}
      />

      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: '64px 24px',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div
            aria-hidden
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: gradient.primary135,
              marginBottom: 24,
              boxShadow: `0 8px 24px ${brand.primaryAlpha30}`,
            }}
          >
            <EmailOutlined style={{ color: '#fff', fontSize: 28 }} />
          </div>

          <h2
            style={{
              color: text,
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 12,
            }}
          >
            Restez informé des meilleures offres
          </h2>

          <p
            style={{
              color: textSub,
              fontSize: '1.05rem',
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            Recevez en exclusivité les nouvelles annonces, les tendances du
            marché et les conseils immobiliers directement dans votre boîte
            mail.
          </p>

          {isSuccess ? (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                color: brand.primary,
                fontWeight: 600,
                fontSize: '1.05rem',
              }}
            >
              <CheckCircleOutline aria-hidden style={{ fontSize: 24 }} />
              <span>Inscription réussie ! Merci de nous rejoindre.</span>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 0,
                  border: `1.5px solid ${error ? semantic.errorBright : border}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: surface,
                  transition: 'border-color 0.2s',
                }}
              >
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'newsletter-error' : undefined}
                  suppressHydrationWarning
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: text,
                    fontSize: '1rem',
                  }}
                  aria-label="Adresse e-mail pour la newsletter"
                />
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  style={{
                    padding: '14px 24px',
                    background: isLoading ? textSub : gradient.primary,
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.2s',
                    minWidth: 120,
                    minHeight: 44,
                  }}
                >
                  {isLoading ? 'En cours…' : "S'abonner"}
                </button>
              </div>

              {error && (
                <p
                  id="newsletter-error"
                  role="alert"
                  style={{
                    color: semantic.errorBright,
                    fontSize: '0.875rem',
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}

              <p style={{ color: textSub, fontSize: '0.8rem', margin: 0 }}>
                Pas de spam. Désinscription en un clic à tout moment.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
