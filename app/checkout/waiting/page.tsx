"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";

function WaitingScreenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [status, setStatus] = useState<string>("pending_deposit");
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minute countdown for LivePay expiry

  useEffect(() => {
    // If somehow they land here without an orderId, send them home
    if (!orderId) {
      router.push("/");
      return;
    }

    // 🎧 Attach real-time Firestore listener to this specific order
    const orderRef = doc(db, "orders", orderId);
    
    const unsubscribe = onSnapshot(orderRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const orderData = docSnapshot.data();
        const currentStatus = orderData.status;
        
        setStatus(currentStatus);

        // 🚀 SUCCESS: The webhook confirmed payment! Redirect instantly.
        if (currentStatus === "confirmed_processing") {
          router.push(`/success/${orderId}`);
        }
        
        // ❌ FAILED: User entered wrong PIN or insufficient funds
        if (currentStatus === "payment_failed") {
          alert("Payment failed or was cancelled. Please try again.");
          // Redirect them back to the homepage or their cart
          router.push("/"); 
        }
      }
    }, (error) => {
      console.error("Firestore Listener Error:", error);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
    
  }, [orderId, router]);

  // Handle the 15-minute expiry countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      alert("Payment session expired. Please try placing your order again.");
      router.push("/");
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, router]);

  // Format countdown for display
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl p-8 text-center relative overflow-hidden">
        
        {/* Top Loading Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <div className="h-full bg-[#D97706] animate-pulse w-full"></div>
        </div>

        {/* Pulsing Phone Icon */}
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-75"></div>
          <svg className="w-10 h-10 text-[#D97706] relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-3">Check Your Phone</h2>
        
        <p className="text-slate-600 font-medium mb-8 leading-relaxed">
          We have sent a payment prompt to your mobile money number. Please enter your PIN to securely pay the deposit.
        </p>

        {/* Dynamic Status Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-3">
            <svg className="w-5 h-5 text-slate-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Waiting for payment...
            </span>
          </div>
        </div>

        <p className="text-xs font-bold text-slate-400 mt-4">
          Session expires in: <span className="text-red-500">{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
        </p>

      </div>
      
      <p className="mt-8 text-sm font-medium text-slate-500">
        Do not refresh or close this page.
      </p>
    </div>
  );
}

// Next.js 14 requires useSearchParams to be wrapped in a Suspense boundary
export default function WaitingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse font-bold text-slate-400">Loading secure checkout...</div>
      </div>
    }>
      <WaitingScreenContent />
    </Suspense>
  );
}
