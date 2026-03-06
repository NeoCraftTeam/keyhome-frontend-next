import type { Metadata } from 'next';
import SurveysClientLayout from './SurveysClientLayout';

export const metadata: Metadata = {
  title: 'Sondages KeyHome',
  description: 'Partagez votre expérience avec KeyHome. Vos réponses sont 100% anonymes.',
  robots: { index: true, follow: true },
};

export default function SurveysLayout({ children }: { children: React.ReactNode }) {
  return <SurveysClientLayout>{children}</SurveysClientLayout>;
}
