"use client";

import { useState } from "react";

interface UpgradeStoreButtonProps {
  userId: string;
  userEmail: string;
  userName: string;
  storeId: string; // The ID of the store they are upgrading
}

export default function UpgradeStoreButton({ userId, userEmail, userName, storeId }: UpgradeStoreButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userEmail,
          userName,
          paymentType: "store_subscription",
          referenceId: storeId,
          amount: 20000, // 20,000 UGX
        }),
      });

      const data = await response.json();

      if (data.link) {
        // Redirect the user to the Flutterwave payment modal
        window.location.href = data.link;
      } else {
        setError(data.error || "Failed to initialize payment.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleUpgrade}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
      >
        {isLoading ? "Redirecting to Payment..." : "Pay 20,000 UGX to Upgrade"}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
