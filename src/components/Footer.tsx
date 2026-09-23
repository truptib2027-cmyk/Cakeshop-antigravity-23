import React from "react";
import Link from "next/link";
import { Cake, MapPin, Clock, Phone, Mail, ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#21140E] text-[#EDE4DA] mt-20 border-t border-[#3B281D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand & Philosophy */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center">
                <Cake className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                CakeCart
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Bespoke small-batch home bakery dedicated to celebration cakes, bento treats, and inclusive dietary bakes. Handcrafted with organic flour and pure butter.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Certified Hygiene & Kitchen Safety Standards</span>
            </div>
          </div>

          {/* Bakery Studio & Pickups */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold tracking-wide text-white uppercase">
              Collection Studio
            </h4>
            <ul className="space-y-2 text-xs text-stone-300">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>42 Rosewood Lane, Suite B, Artisan Kitchen Quarter</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Pickup Windows: 10am-12pm, 1pm-3pm, 4pm-6pm</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>+1 (555) 234-5678</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span>orders@cakecart.com</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold tracking-wide text-white uppercase">
              Artisan Menu
            </h4>
            <ul className="space-y-2 text-xs text-stone-300">
              <li>
                <Link href="/menu?category=signature-celebration" className="hover:text-amber-400 transition-colors">
                  Signature Celebration Cakes
                </Link>
              </li>
              <li>
                <Link href="/menu?category=bento-mini-cakes" className="hover:text-amber-400 transition-colors">
                  Korean Bento Mini Cakes
                </Link>
              </li>
              <li>
                <Link href="/menu?dietary=eggless" className="hover:text-amber-400 transition-colors">
                  Eggless & Vegan Specials
                </Link>
              </li>
              <li>
                <Link href="/menu?dietary=gluten-free" className="hover:text-amber-400 transition-colors">
                  Gluten-Free Tortes
                </Link>
              </li>
              <li>
                <Link href="/menu?category=cupcake-gift-boxes" className="hover:text-amber-400 transition-colors">
                  Artisan Floral Cupcake Boxes
                </Link>
              </li>
            </ul>
          </div>

          {/* Lead Time & Policies */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold tracking-wide text-white uppercase">
              Ordering Policies
            </h4>
            <div className="bg-[#2D1B13] p-3.5 rounded-xl border border-[#432A1E] text-xs text-stone-300 space-y-2">
              <p>
                <strong className="text-amber-400">48h Lead Time:</strong> Every cake is baked from scratch. Please order at least 2 days prior to pickup.
              </p>
              <p>
                <strong className="text-amber-400">24h Cancellation:</strong> Free cancellation up to 24 hours before your scheduled pickup window.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#3B281D] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} CakeCart Artisan Studio. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Handcrafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for sweet celebrations
          </p>
        </div>
      </div>
    </footer>
  );
}
