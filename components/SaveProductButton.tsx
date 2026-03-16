"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Ensure this matches your config path

export default function SaveProductButton({ product }: { product: any }) {
  const { user, signIn } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no user or no product ID, do nothing
    if (!user || !product?.id) return;

    // Listen in real-time to see if this item is in the user's wishlist
    const wishlistDocRef = doc(db, "users", user.id, "wishlist", product.id);
    
    const unsubscribe = onSnapshot(wishlistDocRef, (docSnap) => {
      setIsSaved(docSnap.exists());
    });

    return () => unsubscribe();
  }, [user, product?.id]);

  const toggleSave = async () => {
    if (!user) {
      alert("Please log in to save items to your wishlist.");
      signIn();
      return;
    }

    setLoading(true);
    const wishlistDocRef = doc(db, "users", user.id, "wishlist", product.id);

    try {
      if (isSaved) {
        // Remove it from Firestore
        await deleteDoc(wishlistDocRef);
      } else {
        // Add it to Firestore with the necessary display info
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
      alert("Failed to update wishlist. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggleSave}
      disabled={loading}
      className="flex items-center justify-center w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm active:scale-90"
      title={isSaved ? "Remove from Saved" : "Save for Later"}
    >
      <span className={`text-xl transition-all ${isSaved ? "scale-110" : "grayscale opacity-40"}`}>
        {loading ? "⌛" : (isSaved ? "❤️" : "🤍")}
      </span>
    </button>
  );
}
