"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import {
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle,
  Upload,
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
  Info,
} from "lucide-react";

interface ProductOption {
  id: string;
  type: "size" | "flavour";
  name: string;
  priceModifier: number;
  isDefault: boolean;
  isAvailable: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  minLeadTimeHours: number;
  dietaryTags: string[];
  options: ProductOption[];
}

export default function CakeCustomisePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Customizer selections
  const [selectedSizeId, setSelectedSizeId] = useState<string>("");
  const [selectedFlavourId, setSelectedFlavourId] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [referenceImageUrl, setReferenceImageUrl] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${resolvedParams.slug}`);
        if (!res.ok) {
          setError("Product not found");
          return;
        }
        const data = await res.json();
        const p: Product = data.product;
        setProduct(p);

        // Pre-select default size and flavour
        const defaultSize = p.options.find((o) => o.type === "size" && o.isDefault) || p.options.find((o) => o.type === "size");
        const defaultFlavour = p.options.find((o) => o.type === "flavour" && o.isDefault) || p.options.find((o) => o.type === "flavour");

        if (defaultSize) setSelectedSizeId(defaultSize.id);
        if (defaultFlavour) setSelectedFlavourId(defaultFlavour.id);
      } catch (err: any) {
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [resolvedParams.slug]);

  // Selected options objects
  const selectedSize = product?.options.find((o) => o.id === selectedSizeId);
  const selectedFlavour = product?.options.find((o) => o.id === selectedFlavourId);

  // Price calculations
  const basePrice = product?.basePrice || 0;
  const sizeModifier = selectedSize?.priceModifier || 0;
  const flavourModifier = selectedFlavour?.priceModifier || 0;

  // Custom Message Fee: $3.00 (300 cents) if message has content
  const messageFee = customMessage.trim().length > 0 ? 300 : 0;
  const unitPrice = basePrice + sizeModifier + flavourModifier;
  const lineTotal = (unitPrice + messageFee) * quantity;

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setReferenceImageUrl(data.url);
    } catch (err: any) {
      alert("Error uploading reference image: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (customMessage.trim().length > 40) {
      alert("Custom message cannot exceed 40 characters.");
      return;
    }

    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.imageUrl,
      basePrice: product.basePrice,
      quantity,
      unitPrice,
      customisation: {
        sizeOptionId: selectedSize?.id,
        sizeName: selectedSize?.name,
        sizePriceModifier: sizeModifier,
        flavourOptionId: selectedFlavour?.id,
        flavourName: selectedFlavour?.name,
        flavourPriceModifier: flavourModifier,
        customMessage: customMessage.trim() || undefined,
        messageFee,
        referenceImageUrl: referenceImageUrl || undefined,
      },
    });

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 5000);
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500 font-medium">Preparing artisan customizer...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Creation Not Found</h2>
        <p className="text-xs text-stone-500">The cake you are looking for is currently unavailable.</p>
        <Link href="/menu" className="inline-block px-4 py-2 bg-amber-800 text-white rounded-xl text-xs font-semibold">
          Return to Menu
        </Link>
      </div>
    );
  }

  const sizes = product.options.filter((o) => o.type === "size");
  const flavours = product.options.filter((o) => o.type === "flavour");

  return (
    <div className="space-y-8 pb-16">
      {/* Back button */}
      <Link
        href="/menu"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-amber-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Bake Menu</span>
      </Link>

      {/* Main Customizer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Cake Imagery & Highlights */}
        <div className="lg:col-span-6 space-y-6">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-stone-100 shadow-md border border-[#E8DFD5]">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
              {product.dietaryTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-bold bg-white/95 backdrop-blur-xs text-stone-800 px-3 py-1 rounded-full shadow-xs capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-2xl p-4 text-white text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Minimum 48-Hour Advance Notice Required</span>
              </div>
              <p className="text-stone-300 text-[11px]">
                Each sponge is freshly whipped and baked on collection day.
              </p>
            </div>
          </div>

          {/* Reference Image Preview if uploaded */}
          {referenceImageUrl && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <span className="text-xs font-bold text-amber-900 block">
                Your Decor Reference Image Attached:
              </span>
              <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-amber-300 shadow-xs">
                <img src={referenceImageUrl} alt="Reference Preview" className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => setReferenceImageUrl("")}
                className="text-[11px] text-rose-700 underline font-medium"
              >
                Remove photo
              </button>
            </div>
          )}

          {/* Kitchen standards */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
            <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Artisan Quality Guarantees
            </h4>
            <ul className="text-xs text-stone-600 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>100% French cultured butter and Madagascar bourbon vanilla bean</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Packaged in premium sturdy insulated presentation box with silk ribbon</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Complimentary gold celebration candles and bamboo cake knife included</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Customisation Panel */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
              {product.name}
            </h1>
            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* 1. Size Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
              1. Choose Cake Size
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSizeId(s.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                    selectedSizeId === s.id
                      ? "border-amber-800 bg-amber-50/70 ring-2 ring-amber-800/10"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-stone-900 block">
                      {s.name}
                    </span>
                    {s.priceModifier > 0 && (
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                        +${(s.priceModifier / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {s.isDefault && (
                    <span className="text-[10px] text-stone-400 font-medium block mt-1">
                      Standard Size
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Flavour Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
              2. Select Sponge & Filling Flavour
            </label>
            <div className="space-y-2">
              {flavours.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFlavourId(f.id)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    selectedFlavourId === f.id
                      ? "border-amber-800 bg-amber-50/70 ring-2 ring-amber-800/10"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <span className="font-medium text-xs text-stone-900">
                    {f.name}
                  </span>
                  {f.priceModifier > 0 && (
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                      +${(f.priceModifier / 100).toFixed(2)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Custom Cake Message (40-character limit enforcement) */}
          <div className="space-y-2 bg-stone-50/80 p-5 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>3. Hand-Piped Message</span>
                <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                  +$3.00 Fee
                </span>
              </label>
              <span
                className={`text-xs font-mono font-bold ${
                  customMessage.length > 40
                    ? "text-rose-600 animate-pulse"
                    : customMessage.length >= 35
                    ? "text-amber-700"
                    : "text-stone-400"
                }`}
              >
                {customMessage.length} / 40 chars
              </span>
            </div>

            <p className="text-[11px] text-stone-500">
              Personalize your cake with a hand-piped greeting (e.g. &quot;Happy 30th Birthday Alex!&quot;). Strict 40 character limit.
            </p>

            <input
              type="text"
              id="custom-message-input"
              maxLength={40}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g. Happy Birthday Maya! With Love"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-700 transition-all"
            />

            {customMessage.length > 40 && (
              <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Message exceeds the 40 characters decorating limit!</span>
              </p>
            )}
          </div>

          {/* 4. Customer Reference Image Upload */}
          <div className="space-y-2 bg-stone-50/80 p-5 rounded-2xl border border-stone-200">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
              4. Decor Reference Image (Optional)
            </label>
            <p className="text-[11px] text-stone-500">
              Upload an inspiration photo or piping style reference for our chef decorator.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-xs font-semibold text-stone-700 cursor-pointer hover:bg-stone-50 transition-all shadow-xs">
              <Upload className="w-4 h-4 text-amber-800" />
              <span>{isUploading ? "Uploading..." : "Upload Photo (PNG, JPG)"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 pt-2">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Quantity:
            </label>
            <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-xs">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 font-bold text-sm"
              >
                -
              </button>
              <span className="px-4 py-1.5 text-xs font-bold text-stone-900 font-mono">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Live Price Calculation Banner */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-2">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
              Live Price Summary
            </span>
            <div className="text-xs text-stone-600 space-y-1">
              <div className="flex justify-between">
                <span>Base Cake:</span>
                <span>${(basePrice / 100).toFixed(2)}</span>
              </div>
              {sizeModifier > 0 && (
                <div className="flex justify-between">
                  <span>Size Upgrade ({selectedSize?.name}):</span>
                  <span>+${(sizeModifier / 100).toFixed(2)}</span>
                </div>
              )}
              {flavourModifier > 0 && (
                <div className="flex justify-between">
                  <span>Flavour Infusion ({selectedFlavour?.name}):</span>
                  <span>+${(flavourModifier / 100).toFixed(2)}</span>
                </div>
              )}
              {messageFee > 0 && (
                <div className="flex justify-between text-amber-900 font-medium">
                  <span>Custom Piping Fee:</span>
                  <span>+${(messageFee / 100).toFixed(2)}</span>
                </div>
              )}
              {quantity > 1 && (
                <div className="flex justify-between font-medium">
                  <span>Quantity:</span>
                  <span>x{quantity}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-amber-200 flex justify-between items-baseline">
              <span className="font-bold text-stone-900 text-sm">Calculated Item Total:</span>
              <span className="font-serif text-2xl font-bold text-amber-950">
                ${(lineTotal / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              id="add-to-cart-button"
              className="w-full py-4 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-base shadow-md shadow-amber-950/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Add to Cake Box • ${(lineTotal / 100).toFixed(2)}</span>
            </button>

            {/* Added Toast Notification */}
            {addedToast && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-sm animate-fade-in">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Added {product.name} to your cart!</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/cart"
                    className="text-xs font-bold bg-emerald-700 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-800"
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout"
                    className="text-xs font-bold bg-amber-800 text-white px-3 py-1.5 rounded-lg hover:bg-amber-900"
                  >
                    Checkout
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
