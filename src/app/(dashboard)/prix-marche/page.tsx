import type { Metadata } from 'next';
import PrixMarcheClient from './PrixMarcheClient';

export const metadata: Metadata = {
  title: 'Prix du marché immobilier',
  description: 'Analysez les prix immobiliers par quartier avec notre carte thermique et estimez votre loyer.',
};

export default function PrixMarchePage() {
  return <PrixMarcheClient />;
}
