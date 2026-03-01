"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Product } from "@/types";

export default function OrderButton({ product }: { product: Product }) {
  const { user, signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleOrder = async () => {
    if (!user) {
      alert("Please log in to place an order.");
      signIn();
      return;
    }

    const confirmOrder = window.confirm(`Place order for ${product.name} at UGX ${product.price.toLocaleString()}? Payment is Cash on Delivery.`);
    
    if (!confirmOrder) return;

    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id,
          price: product.price,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Order Placed Successfully! Your Order Number is: ${data.orderNumber}. The vendor will contact you shortly.`);
      } else {
        alert("Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleOrder}
      disabled={product.stock <= 0 || loading}
      className="w-full bg-slate-900 text-white py-4 px-8 rounded-lg font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Processing..." : "Order Now (Cash on Delivery)"}
    </button>
  );
}