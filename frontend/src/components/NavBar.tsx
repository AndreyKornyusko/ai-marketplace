'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CartNavIcon } from '@/components/cart/CartNavIcon';
import { AuthNavLinks } from '@/components/auth/AuthNavLinks';

export function NavBar(): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden items-center gap-6 sm:flex">
        <Link
          href="/products"
          className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
        >
          Products
        </Link>
        <Link
          href="/support"
          className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
        >
          Support
        </Link>
        <AuthNavLinks />
        <CartNavIcon />
      </nav>

      {/* Mobile: cart always visible + hamburger */}
      <div className="flex items-center gap-3 sm:hidden">
        <CartNavIcon />
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
        >
          {open ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-40 border-b border-gray-200 bg-white px-4 py-4 shadow-lg sm:hidden">
          <nav className="flex flex-col gap-4">
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Products
            </Link>
            <Link
              href="/support"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Support
            </Link>
            <div className="flex gap-4">
              <AuthNavLinks />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
