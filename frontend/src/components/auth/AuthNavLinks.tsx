'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function AuthNavLinks(): React.JSX.Element {
  const { user, logout } = useAuth();

  if (user !== null) {
    return (
      <>
        <Link
          href="/account"
          className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
        >
          Account
        </Link>
        <button
          type="button"
          onClick={logout}
          className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
        >
          Logout
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
      >
        Login
      </Link>
      <Link
        href="/register"
        className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
      >
        Register
      </Link>
    </>
  );
}
