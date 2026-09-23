"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ChefHat,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  QrCode,
  Flame,
  PackageCheck,
  ShoppingBag,
  Settings,
  Sparkles,
  Search,
} from "lucide-react";

interface OrderCustomisation {
  sizeName?: string;
  flavourName?: string;
  customMessage?: string;
  referenceImageUrl?: string;
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  subtotal: number;
  customisation?: OrderCustomisation;
}

interface Order {
  id: string;
  orderNumber: string;
  pickupDate: string;
  pickupSlotLabel?: string;
  status: "CONFIRMED" | "BAKING" | "READY" | "COLLECTED" | "CANCELLED" | "EXPIRED" | "PENDING";
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupCode: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
}

interface DailyCapacity {
  id: string;
  bakeryDate: string;
  maxCakes: number;
  reservedCakes: number;
  isClosed: boolean;
  notes?: string;
}

export default function BakerDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [orders, setOrders] = useState<Order[]>([]);
  const [capacities, setCapacities] = useState<DailyCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Capacity Edit Modal State
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [modalMaxCakes, setModalMaxCakes] = useState(12);
  const [modalIsClosed, setModalIsClosed] = useState(false);
  const [modalNotes, setModalNotes] = useState("");

  // Quick Pickup Code Scanner
  const [lookupCode, setLookupCode] = useState("");
  const [lookupResult, setLookupResult] = useState<Order | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const fetchOrdersAndCapacity = async () => {
    try {
      const [ordersRes, capRes] = await Promise.all([
        fetch(`/api/baker/orders?date=${selectedDate}`),
        fetch(`/api/capacity?days=14`),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }

      if (capRes.ok) {
        const cData = await capRes.json();
        setCapacities(cData.capacities || []);

        const currentCap = (cData.capacities as DailyCapacity[]).find((c) => c.bakeryDate === selectedDate);
        if (currentCap) {
          setModalMaxCakes(currentCap.maxCakes);
          setModalIsClosed(currentCap.isClosed);
          setModalNotes(currentCap.notes || "");
        }
      }
    } catch (e) {
      console.error("Dashboard fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "baker") {
        router.push("/login?redirect=/baker");
        return;
      }
      fetchOrdersAndCapacity();
    }
  }, [authLoading, user, selectedDate]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId);
    setMessage(null);
    try {
      const res = await fetch("/api/baker/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setMessage({ type: "success", text: `Order updated to ${newStatus}.` });
      await fetchOrdersAndCapacity();
      if (lookupResult?.id === orderId) {
        setLookupResult({ ...lookupResult, status: newStatus as any });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Status update error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/baker/capacity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bakeryDate: selectedDate,
          maxCakes: modalMaxCakes,
          isClosed: modalIsClosed,
          notes: modalNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update capacity");

      setMessage({ type: "success", text: `Capacity saved for ${selectedDate}.` });
      setIsCapacityModalOpen(false);
      await fetchOrdersAndCapacity();
    } catch (err: any) {
      alert("Error saving capacity: " + err.message);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupResult(null);

    if (!lookupCode.trim()) return;

    try {
      const res = await fetch(`/api/baker/lookup?code=${encodeURIComponent(lookupCode.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || "Order not found");
      } else {
        setLookupResult(data.order);
      }
    } catch (e: any) {
      setLookupError(e.message || "Lookup error");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500 font-medium">Opening Baker Studio Portal...</p>
      </div>
    );
  }

  const currentCap = capacities.find((c) => c.bakeryDate === selectedDate) || {
    bakeryDate: selectedDate,
    maxCakes: 12,
    reservedCakes: 0,
    isClosed: false,
  };

  const totalCakesToday = orders
    .filter((o) => !["CANCELLED", "EXPIRED"].includes(o.status))
    .reduce((sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0), 0);

  return (
    <div className="space-y-8 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
            <ChefHat className="w-4 h-4 text-amber-700" />
            <span>Baker Production Hub</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Fulfillment &amp; Kitchen Schedule
          </h1>
        </div>

        <button
          onClick={() => setIsCapacityModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
        >
          <Settings className="w-4 h-4 text-amber-700" />
          <span>Manage Oven Capacity ({selectedDate})</span>
        </button>
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

      {/* Date Carousel Bar */}
      <div className="bg-white rounded-3xl border border-[#E8DFD5] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-700" />
            Select Baking Day:
          </span>
          <span className="text-xs text-stone-400">
            Selected: <strong className="text-stone-800">{selectedDate}</strong>
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {capacities.map((cap) => {
            const dateObj = new Date(cap.bakeryDate + "T00:00:00");
            const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
            const monthDay = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const isSelected = selectedDate === cap.bakeryDate;

            return (
              <button
                key={cap.bakeryDate}
                onClick={() => setSelectedDate(cap.bakeryDate)}
                className={`px-4 py-2.5 rounded-2xl border text-center shrink-0 transition-all ${
                  isSelected
                    ? "bg-amber-800 text-white border-amber-800 shadow-md"
                    : cap.isClosed
                    ? "bg-stone-100 text-stone-400 border-stone-200"
                    : "bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200"
                }`}
              >
                <span className="block text-xs font-bold">{dayName}</span>
                <span className="block text-[11px] opacity-80">{monthDay}</span>
                {cap.isClosed ? (
                  <span className="text-[9px] font-bold block mt-1 text-rose-400">Closed</span>
                ) : (
                  <span className="text-[9px] font-bold block mt-1 opacity-90">
                    {cap.reservedCakes}/{cap.maxCakes} cakes
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Metrics & QR Scanner Tool */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Day Capacity Overview Card */}
        <div className="md:col-span-6 bg-white rounded-3xl border border-[#E8DFD5] p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Oven Capacity on {selectedDate}
            </h3>
            {currentCap.isClosed && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                Date Marked Closed
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-stone-600">
              <span>Bespoke Cakes Reserved:</span>
              <span className="font-bold text-stone-900">
                {currentCap.reservedCakes} / {currentCap.maxCakes}
              </span>
            </div>
            <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  currentCap.reservedCakes >= currentCap.maxCakes
                    ? "bg-rose-500"
                    : currentCap.reservedCakes >= currentCap.maxCakes * 0.7
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{
                  width: `${Math.min(100, (currentCap.reservedCakes / currentCap.maxCakes) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-stone-400 pt-1">
              <span>Oven utilization</span>
              <span>
                {Math.max(0, currentCap.maxCakes - currentCap.reservedCakes)} cake slot(s) remaining
              </span>
            </div>
          </div>
        </div>

        {/* Quick Pickup Code Verification Tool */}
        <div className="md:col-span-6 bg-gradient-to-br from-amber-50 to-[#FAF3EC] rounded-3xl border border-amber-200 p-6 shadow-xs space-y-3">
          <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-700" />
            Express Pickup Pass Verification
          </h3>
          <p className="text-xs text-stone-600">
            Enter or scan customer&apos;s pickup verification code to quickly find and hand off the order.
          </p>

          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              type="text"
              id="lookup-pickup-code-input"
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              placeholder="e.g. PICKUP-XXXX"
              className="flex-1 px-3.5 py-2 rounded-xl border border-amber-300 text-xs font-mono uppercase bg-white focus:outline-none focus:ring-2 focus:ring-amber-800/20"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Verify Code
            </button>
          </form>

          {lookupError && (
            <p className="text-xs text-rose-700 font-semibold">{lookupError}</p>
          )}

          {lookupResult && (
            <div className="p-3.5 rounded-xl bg-white border border-amber-300 text-xs space-y-2">
              <div className="flex justify-between font-bold text-stone-900">
                <span>{lookupResult.orderNumber}</span>
                <span className="text-amber-800 capitalize">({lookupResult.status})</span>
              </div>
              <p className="text-stone-600">
                Customer: <strong>{lookupResult.customerName}</strong> ({lookupResult.customerPhone})
              </p>
              {lookupResult.status !== "COLLECTED" && (
                <button
                  onClick={() => handleUpdateStatus(lookupResult.id, "COLLECTED")}
                  className="w-full py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
                >
                  ✓ Confirm Collection &amp; Hand Off Cake
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Orders Scheduled for this Date */}
      <div className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          Scheduled Baking Orders ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center text-xs text-stone-500">
            No orders scheduled for pickup on {selectedDate}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orders.map((order) => {
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-[#E8DFD5] p-6 shadow-xs space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Top Order header */}
                    <div className="flex justify-between items-start pb-3 border-b border-stone-100">
                      <div>
                        <span className="font-serif font-bold text-lg text-stone-900 block">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-stone-500">
                          Customer: <strong className="text-stone-800">{order.customerName}</strong> • {order.customerPhone}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">
                        {order.pickupCode}
                      </span>
                    </div>

                    {/* Window Slot */}
                    <div className="flex items-center gap-1.5 text-xs text-amber-900 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Pickup Window: <strong>{order.pickupSlotLabel || "Scheduled Window"}</strong></span>
                    </div>

                    {/* Items Breakdown with Decorator Message Focus */}
                    <div className="space-y-3">
                      {order.items.map((it) => (
                        <div key={it.id} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-xs text-stone-900">
                              {it.quantity}x {it.productName}
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {it.customisation?.sizeName}
                            </span>
                          </div>

                          <div className="text-[11px] text-stone-600">
                            <strong>Flavour:</strong> {it.customisation?.flavourName}
                          </div>

                          {/* Decorator Message Box - Highlighted for Baker */}
                          {it.customisation?.customMessage && (
                            <div className="bg-amber-100/80 p-2.5 rounded-xl border border-amber-300 text-amber-950 space-y-1">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900 block flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-700" />
                                Hand-Piped Greeting:
                              </span>
                              <p className="font-serif text-sm font-bold text-stone-900 italic">
                                &ldquo;{it.customisation.customMessage}&rdquo;
                              </p>
                            </div>
                          )}

                          {/* Reference Photo if attached */}
                          {it.customisation?.referenceImageUrl && (
                            <div className="pt-1">
                              <span className="text-[10px] text-stone-500 block font-medium">Customer Reference Image:</span>
                              <img
                                src={it.customisation.referenceImageUrl}
                                alt="Decor Ref"
                                className="w-20 h-20 object-cover rounded-xl border border-stone-300 mt-1"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="text-[11px] text-stone-500 italic bg-amber-50/50 p-2 rounded-lg">
                        <strong>Customer Note:</strong> {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Status & Transition Workflow Buttons */}
                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-500">Current Status:</span>
                      <span className="font-bold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                        {order.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {order.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "BAKING")}
                          disabled={actionLoading === order.id}
                          className="flex-1 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Start Baking</span>
                        </button>
                      )}

                      {order.status === "BAKING" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "READY")}
                          disabled={actionLoading === order.id}
                          className="flex-1 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Mark Ready for Pickup</span>
                        </button>
                      )}

                      {order.status === "READY" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "COLLECTED")}
                          disabled={actionLoading === order.id}
                          className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark Collected</span>
                        </button>
                      )}

                      {order.status === "COLLECTED" && (
                        <span className="w-full text-center py-1.5 text-xs font-bold text-stone-500 bg-stone-100 rounded-xl">
                          ✓ Completed &amp; Collected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Capacity Edit Modal */}
      {isCapacityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl border border-stone-200">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Set Daily Capacity ({selectedDate})
            </h3>

            <form onSubmit={handleSaveCapacity} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">
                  Maximum Cakes Limit
                </label>
                <input
                  type="number"
                  min={currentCap.reservedCakes}
                  max={50}
                  value={modalMaxCakes}
                  onChange={(e) => setModalMaxCakes(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono"
                />
                <span className="text-[10px] text-stone-400">
                  Cannot be lower than current reservations ({currentCap.reservedCakes}).
                </span>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalIsClosed}
                    onChange={(e) => setModalIsClosed(e.target.checked)}
                    className="w-4 h-4 accent-amber-800 rounded"
                  />
                  <span className="text-xs font-bold text-stone-800">
                    Close Bakery for this Date (Holiday / Break)
                  </span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">
                  Baker Note / Reason
                </label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="e.g. Studio Maintenance or Private Masterclass"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCapacityModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-800 text-white text-xs font-semibold hover:bg-amber-900"
                >
                  Save Capacity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
