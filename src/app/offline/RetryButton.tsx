'use client';

export default function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      style={{
        background: 'linear-gradient(to right, #F6475F, #D93A50)',
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        padding: '14px 32px',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'opacity 0.2s',
      }}
      onMouseOver={(e) => ((e.target as HTMLButtonElement).style.opacity = '0.9')}
      onMouseOut={(e) => ((e.target as HTMLButtonElement).style.opacity = '1')}
    >
      Réessayer
    </button>
  );
}
