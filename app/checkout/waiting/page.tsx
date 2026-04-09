"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { FaSpinner, FaMobileAlt, FaTimesCircle } from "react-icons/fa";

function WaitingScreenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [statusText, setStatusText] = useState("Connecting to Mobile Money...");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setHasError(true);
      setStatusText("Invalid Order ID.");
      return;
    }

    // 🚀 SET UP REAL-TIME FIRESTORE LISTENER
    const orderRef = doc(db, "orders", orderId);
    
    const unsubscribe = onSnapshot(orderRef, (docSnap) => {
      if (!docSnap.exists()) {
        setHasError(true);
        setStatusText("Order not found.");
        return;
      }

      const orderData = docSnap.data();

      // 🟢 SUCCESS ROUTE
      if (orderData.paymentStatus === "paid") {
        setStatusText("Payment Received! Redirecting...");
        // Add a tiny delay so they actually see the success text before it jumps
        setTimeout(() => {
          router.push(`/success/${orderId}`);
        }, 1000);
      } 
      // 🔴 FAILED ROUTE (User cancelled USSD, insufficient funds, etc.)
      else if (orderData.paymentStatus === "payment_failed" || orderData.status === "cancelled") {
        setHasError(true);
        setStatusText("Payment failed or was cancelled.");
      }
      // 🟡 PENDING ROUTE
      else if (orderData.paymentStatus === "pending") {
        setStatusText("Please enter your PIN on your phone...");
      }
    }, (error) => {
      console.error("Firestore listening error:", error);
      setHasError(true);
      setStatusText("Lost connection to server.");
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [orderId, router]);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <FaTimesCircle className="text-red-500 text-6xl mb-4" />
        <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Failed</h1>
        <p className="text-slate-500 mb-8 max-w-sm">
          {statusText} This usually happens if you cancel the prompt or have insufficient funds.
        </p>
        <div className="flex gap-4">
          <Link 
            href="/cart" 
            className="bg-white border-2 border-slate-200 text-slate-700 py-3 px-6 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            Back to Cart
          </Link>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#D97706] text-white py-3 px-6 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative mb-8 mt-4">
        {/* Pulsing background rings */}
        <div className="absolute inset-0 bg-[#D97706] rounded-full animate-ping opacity-20 scale-150"></div>
        <div className="absolute inset-0 bg-[#D97706] rounded-full animate-pulse opacity-30 scale-125"></div>
        
        {/* Core Icon */}
        <div className="relative bg-[#D97706] text-white w-24 h-24 rounded-full flex items-center justify-center shadow-xl">
          <FaMobileAlt className="text-4xl animate-bounce" />
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">
        Approve Payment
      </h1>
      
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 max-w-sm w-full">
        <div className="flex items-center justify-center gap-3 text-[#D97706] font-bold">
          <FaSpinner className="animate-spin text-xl" />
          <span>{statusText}</span>
        </div>
      </div>

      <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
        We've sent a prompt to your phone. Enter your Mobile Money PIN to complete the secure checkout.
      </p>

      <p className="text-xs font-bold text-slate-400 mt-8 uppercase tracking-widest">
        Do not close this page
      </p>
    </div>
  );
}

// Wrap in Suspense boundary for Next.js 13+ App Router compatibility
export default function WaitingPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-white p-4">
      <Suspense fallback={
        <div className="flex flex-col items-center text-[#D97706] font-bold">
          <FaSpinner className="animate-spin text-4xl mb-4" />
          Loading secure checkout...
        </div>
      }>
        <WaitingScreenContent />
      </Suspense>
    </div>
  );
}
