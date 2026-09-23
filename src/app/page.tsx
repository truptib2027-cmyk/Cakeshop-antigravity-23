import React from "react";
import Link from "next/link";
import Image from "next/image";
import { dataStore } from "@/db/dataStore";
import {
  Sparkles,
  Calendar,
  Clock,
  Heart,
  ShieldCheck,
  ChevronRight,
  Star,
  Award,
  Leaf,
  EggOff,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = dataStore.getProducts().slice(0, 4);
  const categories = dataStore.getCategories();
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingCapacity = dataStore.getCapacityRange(todayStr, 7);

  return (
    <div className="space-y-20 pb-12">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#F5ECE0] via-[#FAF3EC] to-[#F1E5D8] border border-[#E8DFD5] p-8 md:p-14 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold tracking-wide border border-amber-300/60 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Small-Batch Artisan Bakery • Daily Capacity Capped</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#2A1B14] leading-[1.12]">
              Handcrafted cakes for life’s most{" "}
              <span className="text-amber-800 italic underline decoration-amber-400 decoration-wavy decoration-2">
                delicious
              </span>{" "}
              celebrations.
            </h1>

            <p className="text-base sm:text-lg text-stone-600 max-w-xl leading-relaxed">
              Every morning we bake each cake from pure butter, Madagascar vanilla, and Valrhona chocolate. Reserved in advance with strict daily capacity limits so your cake gets undivided artisan attention.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/menu"
                id="hero-order-button"
                className="px-6 py-3.5 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-base shadow-md shadow-amber-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <span>Browse Menu & Order</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/checkout"
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-semibold text-base border border-stone-300 shadow-xs hover:border-stone-400 transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>Check Pickup Dates</span>
              </Link>
            </div>

            {/* Quality Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E0D5C9]">
              <div>
                <span className="block font-serif text-xl sm:text-2xl font-bold text-amber-900">48h</span>
                <span className="text-xs text-stone-600">Fresh Lead Time</span>
              </div>
              <div>
                <span className="block font-serif text-xl sm:text-2xl font-bold text-amber-900">12</span>
                <span className="text-xs text-stone-600">Max Cakes / Day</span>
              </div>
              <div>
                <span className="block font-serif text-xl sm:text-2xl font-bold text-amber-900">100%</span>
                <span className="text-xs text-stone-600">Natural Ingredients</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=80"
                alt="Velvet Raspberry Celebration Cake"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                <span className="text-xs font-semibold tracking-wider uppercase text-amber-300">
                  Signature Special
                </span>
                <p className="font-serif text-xl font-bold">
                  Velvet Raspberry Celebration Cake
                </p>
                <p className="text-xs text-stone-200 mt-1">
                  Layered with organic coulis & 24k edible gold dust
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Live Capacity Ticker / Availability Notice */}
      <section className="bg-white rounded-2xl border border-[#E8DFD5] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-stone-100">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-700" />
              Live Bakery Capacity Preview
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              To guarantee perfection, our oven capacity is limited to 12 bespoke cakes per day.
            </p>
          </div>
          <Link
            href="/checkout"
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 hover:underline flex items-center gap-1"
          >
            <span>View Full 14-Day Calendar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {upcomingCapacity.map((item, idx) => {
            const dateObj = new Date(item.bakeryDate + "T00:00:00");
            const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
            const monthDay = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const isTodayOrTomorrow = idx < 2; // minimum 48h lead time indicator

            return (
              <div
                key={item.bakeryDate}
                className={`p-3 rounded-xl border text-center transition-all ${
                  item.isClosed
                    ? "bg-stone-100 border-stone-200 opacity-60"
                    : isTodayOrTomorrow
                    ? "bg-stone-50/70 border-stone-200"
                    : item.remainingCakes <= 3
                    ? "bg-amber-50/90 border-amber-300"
                    : "bg-emerald-50/50 border-emerald-200"
                }`}
              >
                <span className="block text-xs font-bold text-stone-700">{dayName}</span>
                <span className="block text-[11px] text-stone-500">{monthDay}</span>
                <div className="mt-2">
                  {item.isClosed ? (
                    <span className="text-[10px] font-bold text-stone-500 bg-stone-200 px-2 py-0.5 rounded">
                      Closed
                    </span>
                  ) : isTodayOrTomorrow ? (
                    <span className="text-[10px] font-semibold text-stone-600 bg-stone-200/80 px-1.5 py-0.5 rounded">
                      &lt;48h Lead
                    </span>
                  ) : item.remainingCakes === 0 ? (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      Sold Out
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-800">
                      {item.remainingCakes} left
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Featured Cakes */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-amber-700">
              Chef’s Signatures
            </span>
            <h2 className="font-serif text-3xl font-bold text-stone-900 mt-1">
              Curated Celebration Creations
            </h2>
          </div>
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 hover:text-amber-900 group"
          >
            <span>View Full Menu & Combo Offers</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col group"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  {product.dietaryTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-semibold bg-white/95 backdrop-blur-xs text-stone-800 px-2 py-0.5 rounded-full shadow-xs capitalize"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-stone-400 block">From</span>
                    <span className="font-serif text-lg font-bold text-amber-900">
                      ${(product.basePrice / 100).toFixed(2)}
                    </span>
                  </div>

                  <Link
                    href={`/cake/${product.slug}`}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200/80 hover:bg-amber-800 hover:text-white transition-all shadow-xs"
                  >
                    Customise
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Celebration Party Combo Promo Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 text-white p-8 md:p-12 shadow-lg border border-amber-800/40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400 text-stone-950 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>LIMITED CELEBRATION COMBO DEAL • 25% OFF</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
              Ultimate Party Celebration Combo
            </h2>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Everything you need for an unforgettable celebration in one booking: 8&quot; Signature Cake + Box of 6 Fresh Artisan Muffins + Pastel Confetti Balloon Bouquet + 24k Gold Candles with Sparklers. Save over 25% compared to individual items!
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/cake/ultimate-celebration-party-combo"
                className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <span>Order Combo for $79.00</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/menu"
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all"
              >
                Browse All Menu Add-Ons
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-xl border-2 border-amber-400/40">
              <img
                src="https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80"
                alt="Celebration Combo"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-amber-400 text-stone-950 text-xs font-black px-3 py-1 rounded-full shadow-md">
                SAVE 25%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The CakeCart Way (Process) */}
      <section className="bg-[#FAF3EB] rounded-3xl p-8 sm:p-12 border border-[#E4D8CA]">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <span className="text-xs uppercase font-bold tracking-widest text-amber-700">
            How It Works
          </span>
          <h2 className="font-serif text-3xl font-bold text-stone-900">
            Bespoke Baking, Made Seamless
          </h2>
          <p className="text-sm text-stone-600">
            Reserve your baking slot with confidence. We handle everything from hand-piping your message to packaging in insulated cake boxes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-serif font-bold text-lg flex items-center justify-center">
              1
            </div>
            <h4 className="font-serif font-bold text-stone-900">Select Date & Slot</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Choose your collection date (min 48 hours in advance) and preferred pickup window.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-serif font-bold text-lg flex items-center justify-center">
              2
            </div>
            <h4 className="font-serif font-bold text-stone-900">Personalize Cake</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Pick your cake size, sponge flavour, and craft a custom message up to 40 characters.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-serif font-bold text-lg flex items-center justify-center">
              3
            </div>
            <h4 className="font-serif font-bold text-stone-900">Artisan Baking</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Chef Sophie bakes your cake in our studio oven on the morning of collection.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-serif font-bold text-lg flex items-center justify-center">
              4
            </div>
            <h4 className="font-serif font-bold text-stone-900">Studio Pickup</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Show your digital QR code confirmation at our pickup counter for express collection.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Customer Testimonials */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="font-serif text-3xl font-bold text-stone-900">
            Loved by Cake Lovers
          </h2>
          <p className="text-xs text-stone-500">
            Real celebrations made sweeter with CakeCart.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-4 shadow-xs">
            <div className="flex gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xs text-stone-600 italic leading-relaxed">
              “The Velvet Raspberry Cake was the star of my sister’s 30th birthday! The hand-piped message was immaculate and the vanilla bean sponge was cloud-like.”
            </p>
            <div className="border-t border-stone-100 pt-3">
              <span className="block text-xs font-bold text-stone-900">Sarah Jenkins</span>
              <span className="block text-[10px] text-stone-400">Ordered for 8&quot; Classic</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-4 shadow-xs">
            <div className="flex gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xs text-stone-600 italic leading-relaxed">
              “As someone with celiac disease, finding a genuinely delicious gluten-free birthday cake used to be impossible. CakeCart&apos;s Flourless Torte was out of this world.”
            </p>
            <div className="border-t border-stone-100 pt-3">
              <span className="block text-xs font-bold text-stone-900">Michael Chang</span>
              <span className="block text-[10px] text-stone-400">Dietary Specials Collection</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-4 shadow-xs">
            <div className="flex gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xs text-stone-600 italic leading-relaxed">
              “The pickup window system and QR code scanner made collection effortless. No long waits, cake was chilled and boxed securely with ribbon.”
            </p>
            <div className="border-t border-stone-100 pt-3">
              <span className="block text-xs font-bold text-stone-900">Aisha Patel</span>
              <span className="block text-[10px] text-stone-400">Afternoon Pickup Window</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
