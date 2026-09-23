"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartCustomisation {
  sizeOptionId?: string;
  sizeName?: string;
  sizePriceModifier: number;
  flavourOptionId?: string;
  flavourName?: string;
  flavourPriceModifier: number;
  customMessage?: string;
  messageFee: number;
  referenceImageUrl?: string;
}

export interface CartItem {
  id: string; // unique item uuid in cart
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  basePrice: number;
  quantity: number;
  customisation: CartCustomisation;
  unitPrice: number; // basePrice + size + flavour
  lineTotal: number; // (unitPrice + messageFee) * quantity
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "lineTotal">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalCakesCount: number;
  subtotal: number;
  totalMessageFees: number;
  finalTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cakecart_items");
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load cart from storage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("cakecart_items", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = (itemData: Omit<CartItem, "id" | "lineTotal">) => {
    const id = `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const lineTotal = (itemData.unitPrice + itemData.customisation.messageFee) * itemData.quantity;

    const newItem: CartItem = {
      ...itemData,
      id,
      lineTotal,
    };

    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const lineTotal = (item.unitPrice + item.customisation.messageFee) * quantity;
          return { ...item, quantity, lineTotal };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("cakecart_items");
    }
  };

  const totalCakesCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalMessageFees = items.reduce(
    (sum, item) => sum + item.customisation.messageFee * item.quantity,
    0
  );
  const finalTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const subtotal = finalTotal - totalMessageFees;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCakesCount,
        subtotal,
        totalMessageFees,
        finalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
