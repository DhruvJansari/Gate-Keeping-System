import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-100">
      <img
        src="/logo.png"
        alt="VARPL Logo"
        className="h-16 w-auto object-contain mb-2"
      />
      <p className="text-7xl font-black text-zinc-200 select-none">404</p>
      <h1 className="text-2xl font-bold text-zinc-900 -mt-4">Page Not Found</h1>
      <p className="text-zinc-600 text-sm">The page you are looking for does not exist or has been moved.</p>
      <Link
        href="/"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 text-sm font-medium"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
