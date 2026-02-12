"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getPanelPathForRole } from "@/lib/roleConfig";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(getPanelPathForRole(user.role_name));
  }, [user, loading, router]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center gap-4">
      <img src="/logo.png" alt="VARPL Logo" className="h-16 w-auto object-contain" />
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
    </div>
  );
}
