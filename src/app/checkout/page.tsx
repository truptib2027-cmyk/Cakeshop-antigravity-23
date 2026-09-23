"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  Clock,
  CreditCard,
  Lock,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  ChevronRight,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

interface DailyCapacity {
  id: string;
  bakeryDate: string;
  maxCakes: number;
  reservedCakes: number;
  remainingCakes: number;
  isClosed: boolean;
  notes?: string;
}

interface PickupSlot {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
  maxOrdersPerSlot: number;
  isActive: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalCakesCount, subtotal, totalMessageFees, finalTotal, clearCart } = useCart();
  const { user } = useAuth();

  // Capacity & Slots
  const [capacities, setCapacities] = useState<DailyCapacity[]>([]);
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  // Form selections
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>(user?.fullName || "");
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || "");
  const [customerPhone, setCustomerPhone] = useState<string>(user?.phone || "");
  const [notes, setNotes] = useState<string>("");

  // Payment Test Simulator State
  const [cardNumber, setCardNumber] = useState<string>("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState<string>("12/28");
  const [cardCvc, setCardCvc] = useState<string>("123");
  const [simulateOutcome, setSimulateOutcome] = useState<"success" | "decline">("success");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeReservation, setActiveReservation] = useState<{
    orderId: string;
    orderNumber: string;
    holdExpiresAt: string;
  } | null>(null);

  // Fetch 14-day schedule
  useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await fetch("/api/capacity?days=14");
        if (res.ok) {
          const data = await res.json();
          setCapacities(data.capacities || []);
          setSlots(data.slots || []);

          // Automatically select first valid date (>= 48 hours away and not closed)
          const validDate = (data.capacities as DailyCapacity[]).find((c, idx) => idx >= 2 && !c.isClosed && c.remainingCakes >= totalCakesCount);
          if (validDate) {
            setSelectedDate(validDate.bakeryDate);
          }
          if (data.slots?.length > 0) {
            setSelectedSlotId(data.slots[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to load schedule", e);
      } finally {
        setLoadingSchedule(false);
      }
    }
    fetchSchedule();
  }, [totalCakesCount]);

  // Update customer fields when user signs in
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.fullName);
      if (!customerEmail) setCustomerEmail(user.email);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Your Cart is Empty</h2>
        <p className="text-xs text-stone-500">Please choose a cake before proceeding to checkout.</p>
        <Link href="/menu" className="inline-block px-5 py-2.5 bg-amber-800 text-white rounded-xl text-xs font-semibold">
          Browse Menu
        </Link>
      </div>
    );
  }

  // Handle Order Reservation & Payment Confirmation
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedDate) {
      setErrorMessage("Please select an available pickup date.");
      return;
    }
    if (!selectedSlotId) {
      setErrorMessage("Please select a pickup time window.");
      return;
    }
    if (!customerName || !customerEmail || !customerPhone) {
      setErrorMessage("Please enter your name, email, and contact phone number.");
      return;
    }

    if (simulateOutcome === "decline") {
      setErrorMessage("Payment Simulation: Card was declined by issuer. Please try another card or switch to Success.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1 - 7: Transactional Reservation Request (Locks DB capacity, 10-minute hold)
      const reservePayload = {
        pickupDate: selectedDate,
        pickupSlotId: selectedSlotId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          sizeOptionId: i.customisation.sizeOptionId,
          flavourOptionId: i.customisation.flavourOptionId,
          customMessage: i.customisation.customMessage,
          referenceImageUrl: i.customisation.referenceImageUrl,
        })),
        customerName,
        customerEmail,
        customerPhone,
        notes,
      };

      const reserveRes = await fetch("/api/orders/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservePayload),
      });

      const reserveData = await reserveRes.json();
      if (!reserveRes.ok) {
        throw new Error(reserveData.error || "Reservation failed. Please check capacity.");
      }

      const order = reserveData.order;
      setActiveReservation({
        orderId: order.id,
        orderNumber: order.orderNumber,
        holdExpiresAt: reserveData.holdExpiresAt,
      });

      // Step 8 - 9: Verify Payment with Idempotency Key
      const idempotencyKey = `idemp_${order.id}_${Date.now()}`;
      const confirmRes = await fetch("/api/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          idempotencyKey,
          provider: "test_gateway",
          transactionId: `tx_mock_${Date.now()}`,
        }),
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) {
        throw new Error(confirmData.error || "Payment verification failed.");
      }

      // Success! Clear cart and redirect to Confirmation screen
      clearCart();
      router.push(`/order-confirmation/${order.orderNumber}`);
    } catch (err: any) {
      console.error("Checkout error:", err);
      setErrorMessage(err.message || "An unexpected error occurred during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Pickup Slot &amp; Checkout
        </h1>
        <p className="text-xs text-stone-500">
          Select your collection window, enter customer details, and confirm payment in test mode.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Date & Slot Picker + Customer Info + Payment */}
        <div className="lg:col-span-8 space-y-8">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Pickup Date Picker with Live Capacity Badges */}
          <div className="bg-white rounded-3xl border border-[#E8DFD5] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-700" />
                  1. Choose Pickup Date (Min 48h Advance Lead Time)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Small-batch oven capacity is strictly capped at 12 cakes per day.
                </p>
              </div>
            </div>

            {loadingSchedule ? (
              <div className="py-6 text-center text-xs text-stone-400">Loading oven schedule...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {capacities.map((cap, idx) => {
                  const dateObj = new Date(cap.bakeryDate + "T00:00:00");
                  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                  const monthDay = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  const isLeadTimeBlocked = idx < 2; // Less than 48 hours away
                  const isSoldOut = cap.remainingCakes < totalCakesCount;
                  const isDisabled = cap.isClosed || isLeadTimeBlocked || isSoldOut;
                  const isSelected = selectedDate === cap.bakeryDate;

                  return (
                    <button
                      key={cap.bakeryDate}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSelectedDate(cap.bakeryDate)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[90px] ${
                        isSelected
                          ? "border-amber-800 bg-amber-50 ring-2 ring-amber-800/20 shadow-xs"
                          : isDisabled
                          ? "border-stone-100 bg-stone-50/60 opacity-50 cursor-not-allowed"
                          : "border-stone-200 bg-white hover:border-amber-400 cursor-pointer"
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-bold text-stone-800">{dayName}</span>
                        <span className="block text-[11px] text-stone-500">{monthDay}</span>
                      </div>

                      <div className="mt-1">
                        {cap.isClosed ? (
                          <span className="text-[9px] font-bold text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded">
                            Closed
                          </span>
                        ) : isLeadTimeBlocked ? (
                          <span className="text-[9px] font-semibold text-stone-600 bg-stone-200 px-1.5 py-0.5 rounded">
                            &lt;48h
                          </span>
                        ) : isSoldOut ? (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                            Full
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                            {cap.remainingCakes} left
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Pickup Window (Slot) Selector */}
          <div className="bg-white rounded-3xl border border-[#E8DFD5] p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-700" />
              2. Select Collection Time Window
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {slots.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "border-amber-800 bg-amber-50 ring-2 ring-amber-800/20"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <span className="text-xs font-bold text-stone-900 block">
                      {slot.label}
                    </span>
                    <span className="text-[10px] text-stone-500 mt-1 block">
                      Express curbside / counter handoff
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Customer Details */}
          <div className="bg-white rounded-3xl border border-[#E8DFD5] p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              3. Contact &amp; Collection Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">Full Name *</label>
                <input
                  type="text"
                  required
                  id="checkout-name-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Emma Watson"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">Email Address *</label>
                <input
                  type="email"
                  required
                  id="checkout-email-input"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. emma@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">Mobile Phone (for pickup SMS) *</label>
                <input
                  type="tel"
                  required
                  id="checkout-phone-input"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 987-6543"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">Special Instructions / Allergies</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please pack in tall box with extra ribbon"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800/20"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Payment Simulation (Test Mode) */}
          <div className="bg-white rounded-3xl border border-[#E8DFD5] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-700" />
                4. Payment (Test Mode Simulation)
              </h3>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                SANDBOX / TEST MODE
              </span>
            </div>

            <p className="text-xs text-stone-500">
              No live charges. Payment idempotency keys are enforced on the server to prevent duplicate charges.
            </p>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600">Simulated Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-600">Expires</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-600">CVC</label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono bg-white"
                  />
                </div>
              </div>

              {/* Simulation outcome selector for QA / Testing */}
              <div className="pt-2 flex items-center gap-4 text-xs">
                <span className="font-semibold text-stone-700">Test Outcome:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="simulateOutcome"
                    checked={simulateOutcome === "success"}
                    onChange={() => setSimulateOutcome("success")}
                    className="accent-amber-800"
                  />
                  <span className="text-emerald-700 font-semibold">Success (200 OK)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="simulateOutcome"
                    checked={simulateOutcome === "decline"}
                    onChange={() => setSimulateOutcome("decline")}
                    className="accent-rose-800"
                  />
                  <span className="text-rose-700 font-semibold">Decline (Test Error)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-[#E8DFD5] p-6 shadow-sm space-y-5 sticky top-28">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Final Total
            </h3>

            {/* Item list brief */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {items.map((it) => (
                <div key={it.id} className="text-xs border-b border-stone-100 pb-2">
                  <div className="flex justify-between font-bold text-stone-900">
                    <span>
                      {it.quantity}x {it.productName}
                    </span>
                    <span>${(it.lineTotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {it.customisation.sizeName} • {it.customisation.flavourName}
                  </div>
                  {it.customisation.customMessage && (
                    <div className="text-[10px] text-amber-900 font-medium">
                      Piped: &ldquo;{it.customisation.customMessage}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pricing breakdown */}
            <div className="text-xs text-stone-600 space-y-2 pt-2">
              <div className="flex justify-between">
                <span>Cakes Subtotal:</span>
                <span>${(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Custom Message Fees:</span>
                <span>${(totalMessageFees / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Collection Packaging:</span>
                <span>Free</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
              <span className="font-bold text-stone-900 text-sm">Amount Due:</span>
              <span className="font-serif text-2xl font-bold text-amber-950">
                ${(finalTotal / 100).toFixed(2)}
              </span>
            </div>

            {/* Selected Date & Slot Summary */}
            {selectedDate && (
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                <span className="font-bold block text-amber-900">Collection Reservation:</span>
                <p>
                  📅 <strong>Date:</strong> {selectedDate}
                </p>
                <p>
                  🕒 <strong>Window:</strong>{" "}
                  {slots.find((s) => s.id === selectedSlotId)?.label || "Selected Slot"}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              id="confirm-pay-button"
              className="w-full py-4 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-center text-sm shadow-md shadow-amber-950/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isSubmitting ? "Holding Capacity & Confirming..." : `Pay $${(finalTotal / 100).toFixed(2)} & Reserve`}
              </span>
            </button>

            <p className="text-[10px] text-stone-400 text-center leading-tight">
              By confirming, a 10-minute hold is placed on our daily capacity. You may cancel up to 24 hours prior to pickup.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
