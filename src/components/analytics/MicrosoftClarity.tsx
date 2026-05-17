import { getMicrosoftClarityProjectId } from '@/lib/clarity';
import Script from 'next/script';
import type { ReactElement } from 'react';

/** Loads Microsoft Clarity when `NEXT_PUBLIC_MICROSOFT_CLARITY_PROJECT_ID` is set (Vercel / env). */
export function MicrosoftClarity(): ReactElement | null {
  const clarityProjectId = getMicrosoftClarityProjectId();
  if (!clarityProjectId) {
    return null;
  }

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      src={`https://www.clarity.ms/tag/${clarityProjectId}`}
    />
  );
}
