"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
// import { useTheme } from "@/context/ThemeContext";
import { getPanelPathForRole } from "@/lib/roleConfig";
import { SunIcon, MoonIcon } from "@/components/Icons";
import { InstallPWAButton } from "@/components/InstallPWAButton";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, user } = useAuth();
  // const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace(getPanelPathForRole(user.role_name));
    }
  }, [user, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = await login(identifier, password);
      toast.success("Login successful! Redirecting...");
      router.replace(getPanelPathForRole(data.user.role_name));
    } catch (err) {
      toast.error(err.message || "Login failed");
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

      {/* Install PWA Button — top right */}
      <div className="absolute top-4 right-4 z-20">
        <InstallPWAButton />
      </div>

      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-xl relative z-10">
        <div className="mb-6 flex justify-center">
          <img 
            src="/logo.png" 
            alt="VARPL Logo" 
            className="h-20 w-auto object-contain" 
          />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900 text-center">
          Vaishnodevi Agro Resources Pvt. Ltd.
        </h1>
        <p className="mb-8 text-sm text-slate-500 text-center">
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Username or Email
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your username"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-bold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg shadow-blue-500/20"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
