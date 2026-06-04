import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-brand-50/40 px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
