"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Product } from "@/types";

export default function ProductActions({ product }: { product: Product }) {
  const { user, signIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Format Ugandan phone numbers for the WhatsApp API (07... to 2567...)
  const formatWhatsAppNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      return `256${cleanPhone.slice(1)}`;
    }
    return cleanPhone;
  };

  const handleWhatsApp = () => {
    if (!product.sellerPhone) {
      alert("This seller did not provide a WhatsApp number.");
      return;
    }
    const phone = formatWhatsAppNumber(product.sellerPhone);
    const message = encodeURIComponent(
      `Hello ${product.sellerName}, I am interested in buying your item on Kabale Online:\n\n*${product.name}*\nPrice: UGX ${product.price.toLocaleString()}\nID: ${product.publicId}\n\nIs it still available?`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const handleBuyNow = async () => {
    if (!user) {
      alert("Please sign in to place an official order.");
      signIn();
      return;
    }

    const confirmOrder = window.confirm(
      `Place an official Cash on Delivery order for ${product.name}?`
    );
    
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
        alert(`Order ${data.orderNumber} placed! The seller will be notified.`);
        router.push("/profile"); // Redirect to their orders page
      } else {
        alert("Failed to place order.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 mt-8">
      <button 
        onClick={handleBuyNow}
        disabled={product.stock <= 0 || loading}
        className="w-full bg-slate-900 text-white py-4 px-8 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
      >
        {loading ? "Processing..." : "Buy Now (Cash on Delivery)"}
      </button>

      <button 
        onClick={handleWhatsApp}
        disabled={product.stock <= 0 || !product.sellerPhone}
        className="w-full bg-[#25D366] text-white py-4 px-8 rounded-xl font-bold text-lg hover:bg-[#1ebe5d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
      >
        Buy via WhatsApp
      </button>

      {/* Admin God Mode Delete Button (Only visible if you are logged in as admin) */}
      {user?.role === "admin" && (
        <button 
          onClick={() => alert("Admin Delete API not connected yet, but you are recognized as an Admin!")}
          className="w-full mt-4 bg-red-100 text-red-600 py-3 rounded-lg font-bold text-sm hover:bg-red-200 transition-colors"
        >
          [Admin Action] Delete Spam Product
        </button>
      )}
    </div>
  );
}