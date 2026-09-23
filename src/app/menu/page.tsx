"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";

interface ProductOption {
  id: string;
  type: "size" | "flavour";
  name: string;
  priceModifier: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  minLeadTimeHours: number;
  categories: string[];
  dietaryTags: string[];
  options: ProductOption[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface DietaryTag {
  id: string;
  name: string;
  slug: string;
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDietary, setSelectedDietary] = useState<string>("all");
  const [selectedFlavour, setSelectedFlavour] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number>(10000); // 10000 cents = $100
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setCategories(data.categories || []);
          setDietaryTags(data.dietaryTags || []);
        }
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (selectedCategory !== "all") {
        const cat = categories.find((c) => c.slug === selectedCategory);
        if (!cat || !product.categories.includes(cat.id)) {
          return false;
        }
      }

      // Dietary filter
      if (selectedDietary !== "all") {
        if (!product.dietaryTags.includes(selectedDietary)) {
          return false;
        }
      }

      // Flavour filter
      if (selectedFlavour !== "all") {
        const hasFlavour = product.options.some(
          (o) => o.type === "flavour" && o.name.toLowerCase().includes(selectedFlavour.toLowerCase())
        );
        if (!hasFlavour) return false;
      }

      // Size filter
      if (selectedSize !== "all") {
        const hasSize = product.options.some(
          (o) => o.type === "size" && o.name.toLowerCase().includes(selectedSize.toLowerCase())
        );
        if (!hasSize) return false;
      }

      // Price filter
      if (product.basePrice > maxPrice) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.description.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });
  }, [products, categories, selectedCategory, selectedDietary, selectedFlavour, selectedSize, maxPrice, searchQuery]);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedDietary("all");
    setSelectedFlavour("all");
    setSelectedSize("all");
    setMaxPrice(10000);
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedDietary !== "all" ||
    selectedFlavour !== "all" ||
    selectedSize !== "all" ||
    maxPrice < 10000 ||
    searchQuery.trim().length > 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs uppercase font-bold tracking-widest text-amber-700">
          Small-Batch Bake Menu & Party Sets
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900">
          Our Celebration Creations & Combos
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          Artisan cakes, freshly baked muffin boxes, celebration candles, helium balloon bouquets & value combo bundles. Handcrafted fresh with 48h advance notice.
        </p>
      </div>

      {/* Featured Combo Offer Promotion Banner */}
      <div className="bg-gradient-to-br from-amber-900 via-stone-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-amber-800/40">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SPECIAL COMBO OFFER • SAVE UP TO 25%</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Party Bundles: Cake + Muffins + Balloons + Candles
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
            Everything you need for an unforgettable celebration in one seamless booking. Enjoy fresh handcrafted bakes, gourmet muffin boxes, and party accessories at bundle rates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
          <button
            onClick={() => setSelectedCategory("party-combos")}
            className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔥 Explore Combo Deals</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setSelectedCategory("muffins")}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-all cursor-pointer"
          >
            🧁 Fresh Muffins
          </button>
          <button
            onClick={() => setSelectedCategory("candles-balloons")}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-all cursor-pointer"
          >
            🎈 Candles & Balloons
          </button>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="bg-white rounded-3xl border border-[#E8DFD5] p-6 shadow-sm space-y-6">
        {/* Search Bar & Reset */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="menu-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cakes, muffins, balloons, candles, flavours..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-700 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-amber-800 text-white shadow-xs"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.slug)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === c.slug
                    ? "bg-amber-800 text-white shadow-xs"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {c.slug === "party-combos" && <span>🔥</span>}
                {c.slug === "muffins" && <span>🧁</span>}
                {c.slug === "candles-balloons" && <span>🎈</span>}
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters: Dietary, Flavour, Size, Max Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-stone-100">
          {/* Dietary Tag Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Dietary Tag</label>
            <select
              value={selectedDietary}
              onChange={(e) => setSelectedDietary(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-800 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-800/20"
            >
              <option value="all">All Dietary Preferences</option>
              <option value="eggless">Eggless Only</option>
              <option value="gluten-free">Gluten-Free Only</option>
              <option value="nut-free">Nut-Free Only</option>
              <option value="vegan">Vegan Only</option>
            </select>
          </div>

          {/* Flavour Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Flavour Profile</label>
            <select
              value={selectedFlavour}
              onChange={(e) => setSelectedFlavour(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-800 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-800/20"
            >
              <option value="all">All Flavours</option>
              <option value="Vanilla">Madagascar Vanilla</option>
              <option value="Chocolate">Belgian Dark Chocolate</option>
              <option value="Caramel">Salted Caramel Biscoff</option>
              <option value="Lemon">Meyer Lemon Lavender</option>
              <option value="Pistachio">Pistachio Rose Cardamom</option>
              <option value="Blueberry">Wild Mountain Blueberry</option>
              <option value="Gold">Champagne 24k Gold</option>
            </select>
          </div>

          {/* Size Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Item Size / Type</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-800 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-amber-800/20"
            >
              <option value="all">All Sizes & Sets</option>
              <option value="6&quot;">6&quot; Petite / Bento</option>
              <option value="8&quot;">8&quot; Classic Celebration</option>
              <option value="10&quot;">10&quot; Grand Party</option>
              <option value="Cupcake">Cupcake Boxes</option>
              <option value="Muffin">Artisan Muffin Boxes</option>
              <option value="Balloon">Helium Balloon Bouquets</option>
              <option value="Candle">Celebration Candle Packs</option>
              <option value="Party Pack">Party Combos & Bundles</option>
            </select>
          </div>

          {/* Max Price Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-stone-700">
              <span>Max Starting Price</span>
              <span className="text-amber-800 font-bold">${(maxPrice / 100).toFixed(0)}</span>
            </div>
            <input
              type="range"
              min="500"
              max="10000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
              className="w-full accent-amber-800 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-500">
          Showing {filteredProducts.length} handcrafted creation(s)
        </span>
        <span className="text-xs text-amber-800 font-medium">
          Lead time: Minimum 48 hours
        </span>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-4 border border-stone-200 animate-pulse space-y-4">
              <div className="aspect-4/3 bg-stone-200 rounded-2xl" />
              <div className="h-5 bg-stone-200 rounded-md w-3/4" />
              <div className="h-4 bg-stone-100 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
            <Filter className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-xl font-bold text-stone-900">
            No cakes match your filters
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try adjusting your category, flavour, dietary restrictions, or price range.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-amber-800 text-white text-xs font-semibold hover:bg-amber-900 transition-colors shadow-xs"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl border border-[#E8DFD5] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Image banner */}
              <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                  {product.categories.includes("cat-5") && (
                    <span className="text-[10px] font-extrabold bg-amber-400 text-stone-950 px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <span>🔥</span>
                      <span>25% OFF COMBO</span>
                    </span>
                  )}
                  {product.categories.includes("cat-6") && !product.categories.includes("cat-5") && (
                    <span className="text-[10px] font-bold bg-rose-700 text-white px-2.5 py-1 rounded-full shadow-xs">
                      🧁 FRESH MUFFINS
                    </span>
                  )}
                  {product.categories.includes("cat-7") && !product.categories.includes("cat-5") && (
                    <span className="text-[10px] font-bold bg-stone-900 text-amber-300 px-2.5 py-1 rounded-full shadow-xs">
                      🎈 PARTY ESSENTIAL
                    </span>
                  )}
                  {product.dietaryTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold bg-white/95 backdrop-blur-xs text-stone-800 px-2.5 py-1 rounded-full shadow-xs capitalize"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                  48h Notice
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2.5">
                  <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-amber-800 transition-colors leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Combo Offer Banner */}
                  {product.categories.includes("cat-5") && (
                    <div className="bg-amber-50 border border-amber-200/90 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>All-in-One Party Bundle</span>
                      </div>
                      <span className="font-extrabold text-[10px] bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full shadow-2xs">
                        SAVE 25%
                      </span>
                    </div>
                  )}

                  {/* Options tags preview */}
                  <div className="pt-1 flex flex-wrap gap-1">
                    {product.options
                      .filter((o) => o.type === "flavour")
                      .slice(0, 2)
                      .map((opt) => (
                        <span
                          key={opt.id}
                          className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md"
                        >
                          {opt.name}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-stone-400 block font-medium">Starting from</span>
                    <span className="font-serif text-2xl font-bold text-amber-900">
                      ${(product.basePrice / 100).toFixed(2)}
                    </span>
                  </div>

                  <Link
                    href={`/cake/${product.slug}`}
                    className="px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
                  >
                    <span>{product.categories.includes("cat-5") ? "Customise Combo" : "Customise & Order"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
