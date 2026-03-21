'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * L'inscription bailleur utilise la même page que les clients (`/register`),
 * avec présélection du type « Agent » via le paramètre d'URL.
 */
export default function OwnerRegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/register?role=agent');
  }, [router]);

  return null;
}
