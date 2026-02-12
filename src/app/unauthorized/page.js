'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-100">
      <img 
        src="/logo.png" 
        alt="VARPL Logo" 
        className="h-16 w-auto object-contain mb-2" 
      />
      <h1 className="text-2xl font-bold text-zinc-900">Access Denied</h1>
      <p className="text-zinc-600">You do not have permission to view this page.</p>
      <Link
        href="/"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
