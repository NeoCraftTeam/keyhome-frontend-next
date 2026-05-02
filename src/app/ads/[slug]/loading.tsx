/**
 * Server-rendered loading skeleton shown the instant a user clicks an ad
 * card and Next.js streams the navigation. Without this file Next falls back
 * to keeping the previous page on screen until `AdDetailPage`'s server
 * `await fetch(...)` calls resolve — which is what the user perceives as
 * "the ad takes seconds to open".
 *
 * The skeleton mirrors the real layout (hero image + title + price block) so
 * the LCP looks instantaneous and the page never appears frozen.
 */
export default function AdDetailLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Chargement de l'annonce"
      className="mx-auto w-full max-w-[1280px] px-3 md:px-6 pt-3 md:pt-6"
      style={{ animation: 'kh-skel-in 200ms cubic-bezier(0.22,1,0.36,1)' }}
    >
      {/* Hero image */}
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-gray-200 dark:bg-zinc-800"
        style={{ aspectRatio: '16 / 10' }}
      >
        <span className="kh-shimmer absolute inset-0" />
      </div>

      {/* Title + price stack */}
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_320px] md:gap-6">
        <div className="space-y-2.5">
          <div className="kh-shimmer h-7 w-3/4 rounded-lg" />
          <div className="kh-shimmer h-4 w-1/2 rounded" />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="kh-shimmer h-7 w-20 rounded-full" />
            ))}
          </div>
          <div className="mt-6 space-y-2">
            <div className="kh-shimmer h-3 w-full rounded" />
            <div className="kh-shimmer h-3 w-11/12 rounded" />
            <div className="kh-shimmer h-3 w-9/12 rounded" />
          </div>
        </div>
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block">
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: 'rgba(0,0,0,0.08)' }}
          >
            <div className="kh-shimmer h-9 w-2/3 rounded-lg" />
            <div className="kh-shimmer mt-2 h-3 w-1/3 rounded" />
            <div className="mt-5 space-y-2.5">
              <div className="kh-shimmer h-11 w-full rounded-xl" />
              <div className="kh-shimmer h-11 w-full rounded-xl" />
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .kh-shimmer {
          background: linear-gradient(110deg,
            rgba(0,0,0,0.04) 30%,
            rgba(0,0,0,0.10) 50%,
            rgba(0,0,0,0.04) 70%
          );
          background-size: 200% 100%;
          animation: kh-shimmer 1.4s linear infinite;
        }
        @keyframes kh-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes kh-skel-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .kh-shimmer { animation: none; background: rgba(0,0,0,0.06); }
        }
      `}</style>
    </div>
  );
}
