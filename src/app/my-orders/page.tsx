"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import {
  Calendar,
  Clock,
  QrCode,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  subtotal: number;
  customisation?: {
    sizeName?: string;
    flavourName?: string;
    customMessage?: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  pickupDate: string;
  pickupSlotLabel?: string;
  status: string;
  totalAmount: number;
  pickupCode: string;
  items: OrderItem[];
  createdAt: string;
}

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [qrModalCode, setQrModalCode] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders/my-orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error("Failed to load orders", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchOrders();
    }
  }, [authLoading]);

  // Check 24-hour cutoff rule for cancellation
  const isEligibleForCancellation = (pickupDateStr: string, status: string) => {
    if (["CANCELLED", "COLLECTED", "REFUNDED"].includes(status)) {
      return false;
    }
    const pickupTime = new Date(`${pickupDateStr}T10:00:00Z`).getTime();
    const now = Date.now();
    const hoursRemaining = (pickupTime - now) / (1000 * 60 * 60);
    return hoursRemaining >= 24;
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order? Your capacity reservation will be released back to the bakery.")) {
      return;
    }

    setCancellingOrderId(orderId);
    setMessage(null);

    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel order.");
      }

      setMessage({ type: "success", text: "Order successfully cancelled and capacity restored." });
      await fetchOrders();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to cancel order" });
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500">Loading your celebration orders...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Sign In to View Orders</h2>
        <p className="text-xs text-stone-500">
          Please sign in to your CakeCart account to track upcoming orders, access collection QR passes, or manage cancellations.
        </p>
        <Link
          href="/login?redirect=/my-orders"
          className="inline-block px-6 py-3 bg-amber-800 text-white rounded-2xl text-xs font-semibold shadow-md"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          My Celebration Orders
        </h1>
        <p className="text-xs text-stone-500">
          Track baking progress, display your collection QR code, or cancel eligible orders (&gt; 24h prior to pickup).
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
              : "bg-rose-50 text-rose-800 border border-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4">
          <h3 className="font-serif text-xl font-bold text-stone-900">No Orders Yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            You don&apos;t have any active or past cake orders. Explore our fresh bake menu to place an order.
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-800 text-white text-xs font-semibold rounded-xl shadow-xs"
          >
            <span>Explore Cakes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const canCancel = isEligibleForCancellation(order.pickupDate, order.status);

            const statusColors: Record<string, string> = {
              CONFIRMED: "bg-blue-50 text-blue-800 border-blue-200",
              BAKING: "bg-amber-100 text-amber-900 border-amber-300",
              READY: "bg-emerald-100 text-emerald-900 border-emerald-300",
              COLLECTED: "bg-stone-100 text-stone-700 border-stone-300",
              CANCELLED: "bg-rose-100 text-rose-800 border-rose-300",
              EXPIRED: "bg-stone-100 text-stone-500 border-stone-200",
            };

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-[#E8DFD5] p-6 shadow-xs space-y-6"
              >
                {/* Header bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif text-lg font-bold text-stone-900">
                        {order.orderNumber}
                      </h3>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${
                          statusColors[order.status] || "bg-stone-100 text-stone-800"
                        }`}
                      >
                        {order.status.toLowerCase()}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-400 block mt-0.5">
                      Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQrModalCode(order.pickupCode)}
                      className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <QrCode className="w-4 h-4 text-amber-800" />
                      <span>Collection QR Pass</span>
                    </button>

                    <Link
                      href={`/order-confirmation/${order.orderNumber}`}
                      className="text-xs font-semibold text-stone-600 hover:text-stone-900 hover:underline"
                    >
                      Receipt
                    </Link>
                  </div>
                </div>

                {/* Pickup Window & Fulfillment Tracker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50/70 p-4 rounded-2xl border border-stone-100">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-stone-500 uppercase flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-700" />
                      Pickup Date
                    </span>
                    <span className="text-sm font-bold text-stone-900 block">
                      {order.pickupDate}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-stone-500 uppercase flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      Collection Window
                    </span>
                    <span className="text-sm font-bold text-stone-900 block">
                      {order.pickupSlotLabel || "Studio Pickup"}
                    </span>
                  </div>
                </div>

                {/* Items in Order */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                    Cakes in this Order:
                  </span>
                  <div className="space-y-2">
                    {order.items.map((it) => (
                      <div key={it.id} className="text-xs flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100">
                        <div>
                          <span className="font-bold text-stone-900">
                            {it.quantity}x {it.productName}
                          </span>
                          {it.customisation && (
                            <span className="text-stone-500 block text-[11px]">
                              {it.customisation.sizeName} • {it.customisation.flavourName}
                              {it.customisation.customMessage && (
                                <span className="text-amber-900 font-medium ml-1">
                                  (&ldquo;{it.customisation.customMessage}&rdquo;)
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        <span className="font-serif font-bold text-amber-900">
                          ${(it.subtotal / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Bar: Total & Cancellation Logic */}
                <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-stone-500">Order Total: </span>
                    <span className="font-serif text-lg font-bold text-amber-950">
                      ${(order.totalAmount / 100).toFixed(2)}
                    </span>
                  </div>

                  {/* 24-Hour Cancellation Enforcement */}
                  {order.status === "CANCELLED" ? (
                    <span className="text-xs text-rose-700 font-semibold flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      <span>Cancelled • Capacity Returned</span>
                    </span>
                  ) : order.status === "COLLECTED" ? (
                    <span className="text-xs text-stone-500 font-semibold">
                      Completed &amp; Collected
                    </span>
                  ) : canCancel ? (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingOrderId === order.id}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors shadow-xs"
                    >
                      {cancellingOrderId === order.id ? "Cancelling..." : "Cancel Order (Eligible)"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
                      <ShieldAlert className="w-3.5 h-3.5 text-stone-400" />
                      <span>Cancellation closed (&lt; 24h before pickup)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Collection QR Pass Modal */}
      {qrModalCode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-5 text-center shadow-2xl border border-stone-200 animate-scale-in">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Collection QR Code
            </h3>
            <p className="text-xs text-stone-500">
              Present this pass at the bakery pickup counter.
            </p>
            <div className="flex justify-center">
              <QRCodeDisplay value={qrModalCode} size={200} label={qrModalCode} />
            </div>
            <button
              onClick={() => setQrModalCode(null)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
