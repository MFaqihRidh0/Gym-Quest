'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    router.replace(`/auth?tab=login&redirect=${encodeURIComponent(redirect)}`);
  }, [router, redirect]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent text-xs font-mono text-cyan animate-pulse">
      Mengarahkan ke halaman masuk...
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-transparent text-xs font-mono text-muted">
          Memuat...
        </div>
      }
    >
      <LoginRedirectContent />
    </Suspense>
  );
}
