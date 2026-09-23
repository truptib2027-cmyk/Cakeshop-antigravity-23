"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, Cake, ChefHat, User as UserIcon, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (email.includes("baker")) {
        router.push("/baker");
      } else {
        router.push(redirect);
      }
    } else {
      setError(result.error || "Login failed. Please check your credentials.");
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="py-12 max-w-md mx-auto space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-800 text-white flex items-center justify-center mx-auto shadow-md">
          <Cake className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Welcome to CakeCart
        </h1>
        <p className="text-xs text-stone-500">
          Sign in to track orders, manage custom cake reservations, or access the bakery portal.
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-3xl border border-[#E8DFD5] p-8 shadow-sm space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                id="login-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                id="login-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            id="login-submit-button"
            className="w-full py-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs shadow-md shadow-amber-950/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="pt-4 border-t border-stone-100 space-y-2">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block text-center">
            Instant Demo Sign-In
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("baker@cakecart.com", "BakerSecret123!")}
              className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all"
            >
              <ChefHat className="w-4 h-4 text-amber-700" />
              <span>Baker Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("customer@example.com", "Customer123!")}
              className="p-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-800 hover:bg-stone-100 text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all"
            >
              <UserIcon className="w-4 h-4 text-stone-600" />
              <span>Customer</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-stone-500 pt-2">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-amber-800 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-stone-400">
          Loading sign in portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
