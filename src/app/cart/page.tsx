"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import {
  ShoppingBag,
  Trash2,
  Calendar,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronLeft,
} from "lucide-react";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalCakesCount,
    subtotal,
    totalMessageFees,
    finalTotal,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Your Cake Box is Empty
        </h1>
        <p className="text-xs text-stone-500 leading-relaxed">
          Looks like you haven&apos;t added any handcrafted celebration creations yet. Explore our fresh menu to reserve your cake.
        </p>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-800 text-white text-xs font-semibold hover:bg-amber-900 transition-all shadow-md shadow-amber-950/20"
        >
          <span>Browse Bake Menu</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Review Your Cake Box
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {totalCakesCount} cake item(s) selected • Customised to your celebration
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Empty Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-[#E8DFD5] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row gap-5"
            >
              {/* Product Thumbnail */}
              <div className="relative w-full sm:w-32 h-32 rounded-2xl overflow-hidden bg-stone-100 shrink-0">
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      {item.productName}
                    </h3>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Customisations List */}
                  <div className="text-xs text-stone-600 space-y-1 pt-1">
                    {item.customisation.sizeName && (
                      <p>
                        <strong className="text-stone-700">Size:</strong>{" "}
                        {item.customisation.sizeName}
                        {item.customisation.sizePriceModifier > 0 && (
                          <span className="text-amber-800 ml-1">
                            (+${(item.customisation.sizePriceModifier / 100).toFixed(2)})
                          </span>
                        )}
                      </p>
                    )}
                    {item.customisation.flavourName && (
                      <p>
                        <strong className="text-stone-700">Flavour:</strong>{" "}
                        {item.customisation.flavourName}
                        {item.customisation.flavourPriceModifier > 0 && (
                          <span className="text-amber-800 ml-1">
                            (+${(item.customisation.flavourPriceModifier / 100).toFixed(2)})
                          </span>
                        )}
                      </p>
                    )}
                    {item.customisation.customMessage ? (
                      <p className="bg-amber-50 p-2 rounded-xl border border-amber-200/60 text-amber-950 font-medium">
                        <strong className="text-amber-900 block text-[11px] uppercase tracking-wider">
                          Piped Message (+$3.00):
                        </strong>
                        &ldquo;{item.customisation.customMessage}&rdquo;
                      </p>
                    ) : (
                      <p className="text-stone-400 italic">No custom message</p>
                    )}

                    {item.customisation.referenceImageUrl && (
                      <p className="text-[11px] text-amber-800 font-medium">
                        ✓ Decor reference photo attached
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Quantity & Line Total */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-stone-600 hover:bg-stone-200 font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-stone-900 font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-stone-600 hover:bg-stone-200 font-bold text-xs"
                    >
                      +
                    </button>
                  </div>

                  <span className="font-serif text-xl font-bold text-amber-900">
                    ${(item.lineTotal / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Continue browsing */}
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 transition-colors pt-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Add another cake to your order</span>
          </Link>
        </div>

        {/* Right: Order Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-[#E8DFD5] p-6 shadow-sm space-y-5">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Order Breakdown
            </h3>

            <div className="text-xs text-stone-600 space-y-2.5">
              <div className="flex justify-between">
                <span>Cakes &amp; Upgrades:</span>
                <span>${(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Hand-Piped Messages:</span>
                <span>${(totalMessageFees / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Studio Collection &amp; Box:</span>
                <span>Complimentary</span>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-between items-baseline">
              <span className="font-bold text-stone-900 text-sm">Estimated Total:</span>
              <span className="font-serif text-2xl font-bold text-amber-950">
                ${(finalTotal / 100).toFixed(2)}
              </span>
            </div>

            {/* Lead Time & Capacity Notice */}
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 text-xs text-amber-950 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Next Step: Select Pickup Date</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                On the next screen, you will reserve your pickup date (min 48h lead time) and collection window. A 10-minute hold will reserve your cakes.
              </p>
            </div>

            <Link
              href="/checkout"
              id="proceed-to-checkout-button"
              className="w-full py-4 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-center text-sm shadow-md shadow-amber-950/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span>Choose Pickup Slot &amp; Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
