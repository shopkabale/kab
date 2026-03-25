"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function SaveProductButton({ product }: { product: any }) {
  const { user, signIn } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !product?.id) return;

    // Listen in real-time
    const wishlistDocRef = doc(db, "users", user.id, "wishlist", product.id);
    const unsubscribe = onSnapshot(wishlistDocRef, (docSnap) => {
      setIsSaved(docSnap.exists());
    });

    return () => unsubscribe();
  }, [user, product?.id]);

  const toggleSave = async () => {
    if (!user) {
      // Don't alert, just trigger the login process
      signIn();
      return;
    }

    setLoading(true);
    const wishlistDocRef = doc(db, "users", user.id, "wishlist", product.id);

    try {
      if (isSaved) {
        await deleteDoc(wishlistDocRef);
      } else {
        await setDoc(wishlistDocRef, {
          id: product.id,
          publicId: product.publicId || product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || null,
          category: product.category || "general",
          savedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error("Wishlist error:", error);
    } finally {
      setLoading(false);
    }
  };

  const buttonText = loading 
    ? "Processing..." 
    : (isSaved ? "Remove from wishlist" : "Save for later");

  return (
    <button 
      onClick={toggleSave}
      disabled={loading}
      className={`w-full py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 border disabled:opacity-70 ${
        isSaved 
          ? "bg-rose-50 text-rose-700 border-rose-200" 
          : "bg-white text-slate-700 border-slate-200"
      }`}
    >
      <span className={isSaved ? "" : "grayscale opacity-50"}>
        {isSaved ? "❤️" : "🤍"}
      </span>
      <span>{buttonText}</span>
    </button>
  );
}
