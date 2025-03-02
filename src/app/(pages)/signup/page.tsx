'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the login page with a query parameter to show signup form
    router.push('/login?mode=signup');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">Redirecting to authentication page...</p>
    </div>
  );
}