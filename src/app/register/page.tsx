'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    router.replace(`/auth?tab=register&redirect=${encodeURIComponent(redirect)}`);
  }, [router, redirect]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-void text-xs font-mono text-magenta animate-pulse">
      Mengarahkan ke halaman pendaftaran akun...
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-void text-xs font-mono text-muted">
          Memuat...
        </div>
      }
    >
      <RegisterRedirectContent />
    </Suspense>
  );
}
