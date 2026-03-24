'use client';

import { writeStoredRegisterAccountRole } from '@/lib/register-intent';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * L'inscription bailleur utilise la même page que les clients (`/register`),
 * avec présélection « Agent » via sessionStorage (pas de `?role=` dans l’URL).
 */
export default function OwnerRegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    writeStoredRegisterAccountRole('agent');
    router.replace('/register');
  }, [router]);

  return null;
}
