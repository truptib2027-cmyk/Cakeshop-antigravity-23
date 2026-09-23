"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  Cake,
  ShoppingBag,
  User as UserIcon,
  LogOut,
  Calendar,
  ChefHat,
  Menu as MenuIcon,
  X,
  Clock,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { totalCakesCount, finalTotal } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFD5] transition-all">
      {/* Top Banner: Artisan Notice & Lead Time */}
      <div className="bg-[#2A1B14] text-[#FAF7F2] text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Freshly baked from scratch daily • Minimum 48-hour artisan lead time • Limited daily batch capacity</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-md shadow-amber-900/10 group-hover:scale-105 transition-transform">
              <Cake className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#2A1B14] group-hover:text-amber-800 transition-colors">
                CakeCart
              </span>
              <span className="block text-[10px] tracking-widest uppercase font-semibold text-amber-700">
                Home-Bakery Studio
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive("/")
                  ? "bg-amber-100/70 text-amber-900 font-semibold"
                  : "text-stone-700 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
            >
              Home
            </Link>
            <Link
              href="/menu"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive("/menu")
                  ? "bg-amber-100/70 text-amber-900 font-semibold"
                  : "text-stone-700 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
            >
              Browse Menu
            </Link>
            <Link
              href="/checkout"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                isActive("/checkout")
                  ? "bg-amber-100/70 text-amber-900 font-semibold"
                  : "text-stone-700 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-700" />
              Pickup Slots
            </Link>

            {user && (
              <Link
                href="/my-orders"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive("/my-orders")
                    ? "bg-amber-100/70 text-amber-900 font-semibold"
                    : "text-stone-700 hover:text-stone-900 hover:bg-stone-200/50"
                }`}
              >
                My Orders
              </Link>
            )}

            {user?.role === "baker" && (
              <Link
                href="/baker"
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive("/baker")
                    ? "bg-amber-800 text-white"
                    : "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
                }`}
              >
                <ChefHat className="w-4 h-4 text-amber-600" />
                Baker Dashboard
              </Link>
            )}
          </nav>

          {/* Right Action Icons: Cart & Auth */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <Link
              href="/cart"
              id="cart-nav-button"
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 hover:bg-amber-100/80 transition-all text-amber-950 font-medium text-sm shadow-sm"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-amber-800" />
                {totalCakesCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-700 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {totalCakesCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-semibold">
                ${(finalTotal / 100).toFixed(2)}
              </span>
            </Link>

            {/* Auth Dropdown / Buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-stone-900 leading-tight">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] text-amber-700 capitalize font-medium">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => logout()}
                  title="Sign out"
                  className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-stone-800 hover:bg-stone-200/50 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-medium bg-amber-800 text-white hover:bg-amber-900 shadow-sm transition-all"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-200/50 transition-all"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF7F2] border-b border-[#E8DFD5] px-4 pt-2 pb-6 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-stone-800 hover:bg-amber-100"
          >
            Home
          </Link>
          <Link
            href="/menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-stone-800 hover:bg-amber-100"
          >
            Browse Menu
          </Link>
          <Link
            href="/checkout"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-stone-800 hover:bg-amber-100"
          >
            Pickup Slots & Checkout
          </Link>
          {user && (
            <Link
              href="/my-orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-stone-800 hover:bg-amber-100"
            >
              My Orders
            </Link>
          )}
          {user?.role === "baker" && (
            <Link
              href="/baker"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-semibold text-amber-900 bg-amber-100"
            >
              👩‍🍳 Baker Dashboard
            </Link>
          )}
          {!user && (
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-stone-300 font-medium text-stone-800"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-amber-800 text-white font-medium shadow-sm"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
