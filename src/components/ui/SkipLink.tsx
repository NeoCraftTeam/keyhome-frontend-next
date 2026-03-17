'use client';

/**
 * Skip link for accessibility — allows keyboard users to jump to main content.
 * Visible on focus only.
 */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      style={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 9999,
        padding: '12px 24px',
        backgroundColor: 'var(--mui-palette-primary-main, #F6475F)',
        color: 'white',
        fontWeight: 600,
        borderRadius: 8,
        textDecoration: 'none',
        transition: 'left 0.2s ease, transform 0.2s ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = '16px';
        e.currentTarget.style.top = '16px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = '-9999px';
      }}
    >
      Aller au contenu principal
    </a>
  );
}
