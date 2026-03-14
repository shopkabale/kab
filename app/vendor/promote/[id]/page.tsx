"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Product } from "@/types";

interface PromotePageProps {
  params: { id: string };
}

export default function PromoteListingPage({ params }: PromotePageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const [selectedPromo, setSelectedPromo] = useState<"featured_listing" | "urgent_listing" | null>(null);

  useEffect(() => {
    // Security redirect
    if (!authLoading && user?.role !== "vendor") {
      router.push("/profile");
      return;
    }

    const fetchProduct = async () => {
      try {
        const productRef = doc(db, "products", params.id);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const productData = { id: productSnap.id, ...productSnap.data() } as Product;
          
          // Ensure the current vendor actually owns this product
          if (productData.sellerId !== user?.id) {
            router.push("/vendor/products");
            return;
          }

          setProduct(productData);
        } else {
          router.push("/vendor/products");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProduct();
    }
  }, [user, authLoading, params.id, router]);

  const handlePayment = async () => {
    if (!selectedPromo) {
      setError("Please select a promotion type.");
      return;
    }

    if (!user || !product) return;

    setIsProcessing(true);
    setError("");

    const amount = selectedPromo === "featured_listing" ? 5000 : 2000;

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: user.displayName,
          paymentType: selectedPromo,
          referenceId: product.id, // Tie the payment to this specific product ID
          amount: amount,
        }),
      });

      const data = await response.json();

      if (data.link) {
        // Redirect to Flutterwave checkout
        window.location.href = data.link;
      } else {
        throw new Error(data.error || "Failed to initialize payment.");
      }
    } catch (err: any) {
      console.error("Payment initialization failed:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800 text-sm font-bold flex items-center gap-1 mb-4">
          <span>⬅️</span> Back to Products
        </button>
        <h1 className="text-3xl font-extrabold text-slate-900">Boost Your Listing</h1>
        <p className="text-slate-600 mt-2">Get more views and sell faster by promoting your item on Kabale Online.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* Target Product Preview */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 sm:gap-6">
        <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
          {product.images && product.images.length > 0 ? (
            <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
          ) : (
            <span className="text-xs text-slate-400 absolute inset-0 flex items-center justify-center">No Image</span>
          )}
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 line-clamp-1">{product.name}</h2>
          <p className="text-sm text-slate-500 mt-1">ID: {product.publicId || product.id}</p>
          <div className="text-lg sm:text-xl font-extrabold text-amber-600 mt-2">
            UGX {Number(product.price).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Promotion Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* Featured Listing Card */}
        <div 
          onClick={() => setSelectedPromo("featured_listing")}
          className={`cursor-pointer rounded-2xl p-6 border-2 transition-all duration-200 relative overflow-hidden ${
            selectedPromo === "featured_listing" 
              ? "border-amber-500 bg-amber-50 shadow-md" 
              : "border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50"
          }`}
        >
          {selectedPromo === "featured_listing" && (
            <div className="absolute top-4 right-4 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold">✓</div>
          )}
          
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">⭐</span>
            <h3 className="text-xl font-bold text-slate-900">Featured Listing</h3>
          </div>
          <p className="text-slate-600 text-sm mb-6">
            Your item will be pinned to the top of its category and search results, guaranteeing maximum visibility to buyers.
          </p>
          <div className="border-t border-slate-200 pt-4 mt-auto">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</p>
                <p className="font-bold text-slate-900">7 Days</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price</p>
                <p className="text-xl font-extrabold text-slate-900">UGX 5,000</p>
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Listing Card */}
        <div 
          onClick={() => setSelectedPromo("urgent_listing")}
          className={`cursor-pointer rounded-2xl p-6 border-2 transition-all duration-200 relative overflow-hidden ${
            selectedPromo === "urgent_listing" 
              ? "border-red-500 bg-red-50 shadow-md" 
              : "border-slate-200 bg-white hover:border-red-300 hover:bg-slate-50"
          }`}
        >
          {selectedPromo === "urgent_listing" && (
            <div className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold">✓</div>
          )}
          
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🚨</span>
            <h3 className="text-xl font-bold text-slate-900">Urgent Tag</h3>
          </div>
          <p className="text-slate-600 text-sm mb-6">
            Adds a highly visible red "URGENT" badge to your item, creating buyer urgency for items you need to sell quickly.
          </p>
          <div className="border-t border-slate-200 pt-4 mt-auto">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</p>
                <p className="font-bold text-slate-900">3 Days</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price</p>
                <p className="text-xl font-extrabold text-slate-900">UGX 2,000</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Checkout Section */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="text-white text-center sm:text-left w-full sm:w-auto">
          <p className="text-slate-400 font-medium mb-1">Total to Pay</p>
          <p className="text-3xl font-extrabold">
            UGX {selectedPromo === "featured_listing" ? "5,000" : selectedPromo === "urgent_listing" ? "2,000" : "0"}
          </p>
        </div>
        
        <button 
          onClick={handlePayment}
          disabled={!selectedPromo || isProcessing}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white py-4 px-8 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-md"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            "Pay with Mobile Money"
          )}
        </button>
      </div>

    </div>
  );
}
