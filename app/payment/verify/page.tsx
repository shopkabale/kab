"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function VerifyPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your payment with Flutterwave...");

  useEffect(() => {
    const verifyPayment = async () => {
      // Grab the parameters Flutterwave put in the URL
      const flwStatus = searchParams.get("status");
      const tx_ref = searchParams.get("tx_ref");
      const transaction_id = searchParams.get("transaction_id");

      if (flwStatus === "cancelled") {
        setStatus("error");
        setMessage("You cancelled the payment process.");
        return;
      }

      if (flwStatus !== "successful" || !tx_ref || !transaction_id) {
        setStatus("error");
        setMessage("Invalid payment return data.");
        return;
      }

      try {
        // Send the data to the secure API route we built earlier
        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction_id, tx_ref }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("Payment successful! Your store is now active.");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. Please contact support.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("A network error occurred during verification.");
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {status === "loading" && (
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">{message}</h2>
            <p className="text-gray-500 mt-2">Please do not close this page.</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Store Activated!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link 
              href="/vendor/dashboard" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition-colors"
            >
              Go to Store Dashboard
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button 
              onClick={() => router.back()} 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyPaymentContent />
    </Suspense>
  );
}
