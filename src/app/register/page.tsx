"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, User as UserIcon, Phone, Cake, AlertCircle, Sparkles, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await register({
      fullName,
      email,
      phone,
      password,
      role,
    });

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      // Full redirect to ensure cookies are refreshed in the browser session
      setTimeout(() => {
        window.location.href = role === "baker" ? "/baker" : "/menu";
      }, 500);
    } else {
      setError(result.error || "Registration failed. Please try a different email.");
    }
  };

  const handleQuickFill = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFullName(`Customer ${randomSuffix}`);
    setEmail(`user${randomSuffix}@cakecart.com`);
    setPhone("+1 (555) 019-2831");
    setPassword("CustomerSecret123!");
    setError(null);
  };

  return (
    <div className="py-12 max-w-md mx-auto space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-800 text-white flex items-center justify-center mx-auto shadow-md">
          <Cake className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Create Your CakeCart Account
        </h1>
        <p className="text-xs text-stone-500">
          Join to reserve fresh celebration cakes and manage your pickup orders.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#E8DFD5] p-8 shadow-sm space-y-6">
        {/* Quick Fill Testing Helper */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
          <div className="text-[11px] text-amber-900">
            <span className="font-bold block">Quick Testing Helper:</span>
            <span>Click to generate random test credentials</span>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            className="px-3 py-1.5 bg-amber-800 text-white text-xs font-semibold rounded-xl hover:bg-amber-900 transition-colors shadow-xs flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto Fill</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            {error.includes("already exists") && (
              <p className="text-[11px] text-stone-600 pl-6">
                This account is already registered. Please{" "}
                <Link href="/login" className="font-bold text-amber-800 underline">
                  Sign in here
                </Link>{" "}
                instead.
              </p>
            )}
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Account created! Redirecting to menu...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">Full Name *</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                id="register-name-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                id="register-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">Mobile Phone</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                id="register-phone-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">Password (min 6 chars) *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                id="register-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/20"
              />
            </div>
          </div>

          {/* Account Role Selector */}
          <div className="space-y-1 pt-1">
            <label className="text-xs font-semibold text-stone-700">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("customer")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  role === "customer"
                    ? "border-amber-800 bg-amber-50 text-amber-900"
                    : "border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole("baker")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  role === "baker"
                    ? "border-amber-800 bg-amber-50 text-amber-900"
                    : "border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                Baker / Staff
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            id="register-submit-button"
            className="w-full py-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs shadow-md shadow-amber-950/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all mt-2"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-amber-800 hover:underline">
            Sign In with 1-click demo accounts
          </Link>
        </div>
      </div>
    </div>
  );
}
