import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account',
  robots: { index: false, follow: false },
};

export default function RegisterPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Create Account</h1>
      <RegisterForm />
    </div>
  );
}
