'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ children, allowedRoles, requiredPermission }) {
  const { user, loading, hasPermission, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (allowedRoles?.length && !hasRole(...allowedRoles)) {
      router.replace('/unauthorized');
      return;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.replace('/unauthorized');
    }
  }, [user, loading, allowedRoles, requiredPermission, hasRole, hasPermission, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
      </div>
    );
  }

  if (!user) return null;

  if (allowedRoles?.length && !hasRole(...allowedRoles)) return null;
  if (requiredPermission && !hasPermission(requiredPermission)) return null;

  return children;
}
