import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-paper to-brand-50 px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
