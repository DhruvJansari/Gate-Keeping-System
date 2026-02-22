"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { getPanelPathForRole } from "@/lib/roleConfig";
import { InstallPWAButton } from "@/components/InstallPWAButton";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="relative min-h-screen flex items-center justify-center p-8 overflow-hidden">

      {/* Google Fonts */}
      {/* <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&display=swap"
      /> */}

      {/* ── Background image ── */}
      <div
        className="fixed inset-0 z-0 bg-center bg-cover bg-no-repeat saturate-50"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80')",
        }}
      />

      {/* ── Vignette ── */}
      {/* <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.70) 100%)",
        }}
      /> */}

      {/* ── PWA Button ── */}
      <div className="fixed top-5 right-5 z-20">
        <InstallPWAButton />
      </div>

      {/* ── Card ── */}
      <div
        className={`relative z-10 w-full max-w-[420px] bg-white backdrop-blur-2xl border border-white rounded-2xl px-12 pt-12 pb-10 shadow-[0_32px_80px_rgba(0,0,0,0.45),inset_0_0_0_0.5px_rgba(255,255,255,0.12)] transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"
        }`}
      >
        {/* Gold top accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-[#b8935a] rounded-b" />

        {/* ── Brand ── */}
        <div className="flex flex-col items-center text-center mb-9">
          {/* Logo ring */}
          <div className="relative flex items-center justify-center w-[100px] h-[100px] rounded-full border border-[#b8935a] mb-5">
            {/* <div className="absolute inset-[5px] rounded-full border border-[#b8935a]/30" /> */}
            <img
              src="/logo.png"
              alt="VARPL Logo"
              className="relative z-10 w-20 h-20 object-contain"
            />
          </div>

          <h1
            className="text-[1.35rem] font-semibold text-[#1a1a18] leading-snug tracking-wide mb-1.5"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Vaishnodevi Agro Resources
            <br />
            Private Limited
          </h1>
          <p className="text-[0.68rem] font-normal tracking-[0.2em] uppercase text-[#888880]">
            Enterprise Portal
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-[#b8935a]/25" />
          <span className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#b8935a]">
            Sign In
          </span>
          <div className="flex-1 h-px bg-[#b8935a]/25" />
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Username */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="identifier"
              className="text-[0.67rem] font-medium tracking-[0.15em] uppercase text-[#9999990]"
            >
              Username or Email
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
              className="w-full bg-transparent border-0 border-b border-[#b8935a]/35 py-2.5 px-0 text-[0.92rem] text-[#1a1a18] placeholder:text-black/20 placeholder:font-light outline-none focus:border-[#b8935a] transition-colors duration-200"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-[0.67rem] font-medium tracking-[0.15em] uppercase text-[#9999990]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full bg-transparent border-0 border-b border-[#b8935a]/35 py-2.5 px-0 text-[0.92rem] text-[#1a1a18] placeholder:text-black/20 placeholder:font-light outline-none focus:border-[#b8935a] transition-colors duration-200"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-[0.78rem] text-red-600 bg-red-600/[0.07] border-l-2 border-red-600 px-3 py-2.5 tracking-tight">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="group relative rounded-xl w-full mt-1 py-3.5 bg-[#b8935a] text-[#f7f4ef] text-[0.75rem] font-medium tracking-[0.22em] uppercase overflow-hidden rounded-none hover:bg-[#2e2e2a] active:scale-[0.99] disabled:opacity-55 disabled:cursor-not-allowed transition-all duration-300"
          >
            {/* Shimmer overlay */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="relative z-10">
              {submitting ? "Signing in…" : "Continue"}
            </span>
          </button>
        </form>

        {/* ── Footer ── */}
        <p className="mt-8 text-center text-[0.67rem] tracking-[0.08em] text-black/30">
          © {new Date().getFullYear()} VARPL · All rights reserved
        </p>
      </div>
    </div>
  );
}