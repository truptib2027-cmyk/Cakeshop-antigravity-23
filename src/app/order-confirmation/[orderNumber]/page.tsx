"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  ShoppingBag,
  Printer,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  customisation?: {
    sizeName?: string;
    flavourName?: string;
    customMessage?: string;
    messageFee: number;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  pickupDate: string;
  pickupSlotLabel?: string;
  status: string;
  totalAmount: number;
  messageFee: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupCode: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
}

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${resolvedParams.orderNumber}`);
        if (!res.ok) {
          setError("Order not found");
          return;
        }
        const data = await res.json();
        setOrder(data.order);
      } catch (e: any) {
        setError(e.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [resolvedParams.orderNumber]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500">Preparing your order receipt &amp; collection QR code...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Order Not Found</h2>
        <p className="text-xs text-stone-500">We could not locate this order reference.</p>
        <Link href="/" className="inline-block px-5 py-2.5 bg-amber-800 text-white rounded-xl text-xs font-semibold">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20">
      {/* Success Celebration Banner */}
      <div className="text-center space-y-4 pt-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle className="w-9 h-9" />
        </div>
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-700">
            Payment &amp; Capacity Confirmed
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
            We&apos;re Baking For You!
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Order Reference: <strong className="font-mono text-stone-800">{order.orderNumber}</strong>
          </p>
        </div>
      </div>

      {/* Collection QR Code Card */}
      <div className="bg-gradient-to-br from-amber-50 to-[#FAF3EC] rounded-3xl border border-amber-200 p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-8 text-center sm:text-left">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Digital Collection Pass</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            Show This QR Code at Collection
          </h2>
          <p className="text-xs text-stone-600 max-w-sm leading-relaxed">
            Our baker will scan this pass to verify your custom order and hand off your freshly packaged cake.
          </p>

          <div className="pt-2 text-xs font-mono font-bold text-stone-800 bg-white/80 px-3 py-1.5 rounded-lg inline-block border border-amber-300">
            Pickup Code: {order.pickupCode}
          </div>
        </div>

        <div className="shrink-0">
          <QRCodeDisplay value={order.pickupCode} size={160} label={order.orderNumber} />
        </div>
      </div>

      {/* Pickup Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-700" />
            Pickup Date
          </span>
          <span className="font-serif text-base font-bold text-stone-900 block">
            {order.pickupDate}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            Pickup Window
          </span>
          <span className="font-serif text-base font-bold text-stone-900 block">
            {order.pickupSlotLabel || "Selected Window"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-700" />
            Studio Location
          </span>
          <span className="text-xs font-bold text-stone-900 block">
            42 Rosewood Lane, Suite B
          </span>
        </div>
      </div>

      {/* Itemized Receipt */}
      <div className="bg-white rounded-3xl border border-[#E8DFD5] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-stone-100">
          <h3 className="font-serif text-xl font-bold text-stone-900">
            Order Receipt
          </h3>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 px-3 py-1.5 rounded-xl shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>

        {/* Customer Info */}
        <div className="text-xs text-stone-600 grid grid-cols-1 sm:grid-cols-2 gap-2 pb-4 border-b border-stone-100">
          <div>
            <span className="text-stone-400 block">Customer:</span>
            <span className="font-bold text-stone-900">{order.customerName}</span>
          </div>
          <div>
            <span className="text-stone-400 block">Contact Phone:</span>
            <span className="font-bold text-stone-900">{order.customerPhone}</span>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="text-xs space-y-1 border-b border-stone-100 pb-3">
              <div className="flex justify-between font-bold text-stone-900">
                <span>
                  {item.quantity}x {item.productName}
                </span>
                <span>${(item.subtotal / 100).toFixed(2)}</span>
              </div>
              {item.customisation && (
                <div className="text-[11px] text-stone-500 pl-4 border-l-2 border-amber-300 space-y-0.5 mt-1">
                  <p>
                    Size: {item.customisation.sizeName} • Flavour: {item.customisation.flavourName}
                  </p>
                  {item.customisation.customMessage && (
                    <p className="text-amber-900 font-medium">
                      Piped Greeting (+$3.00): &ldquo;{item.customisation.customMessage}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Receipt Totals */}
        <div className="pt-2 text-xs space-y-2 border-t border-stone-200">
          <div className="flex justify-between text-stone-600">
            <span>Payment Status:</span>
            <span className="text-emerald-700 font-bold uppercase">PAID (Test Mode)</span>
          </div>
          <div className="flex justify-between items-baseline pt-2">
            <span className="font-serif text-base font-bold text-stone-900">Total Paid:</span>
            <span className="font-serif text-2xl font-bold text-amber-950">
              ${(order.totalAmount / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-2">
        <Link
          href="/menu"
          className="text-xs font-semibold text-amber-800 hover:text-amber-900 hover:underline"
        >
          ← Order another cake
        </Link>
        <Link
          href="/my-orders"
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-800 text-white text-xs font-semibold hover:bg-amber-900 transition-all shadow-md shadow-amber-950/20 text-center flex items-center justify-center gap-2"
        >
          <span>View in My Orders</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
