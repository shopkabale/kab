"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, limit } from "firebase/firestore"; 
import { db } from "@/lib/firebase/config";

export default function WishlistTab({ userId }: { userId: string }) {
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🚀 REAL-TIME WISHLIST LISTENER
    const wishlistRef = collection(db, "users", userId, "wishlist");
    const unsubscribe = onSnapshot(
      query(wishlistRef, orderBy("savedAt", "desc"), limit(20)), 
      (snapshot) => {
        setSavedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to wishlist:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const handleRemoveSaved = async (productId: string) => {
    try { 
      await deleteDoc(doc(db, "users", userId, "wishlist", productId)); 
    } catch (error) { 
      console.error("Failed to remove saved item", error); 
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-slate-400 text-sm">Loading wishlist...</div>;
  }

  if (savedItems.length === 0) {
    return <p className="col-span-2 text-center text-sm text-slate-500 py-10">Your wishlist is empty.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {savedItems.map(item => (
        <div key={item.id} className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <Link href={`/product/${item.publicId || item.id}`}>
            <div className="aspect-square bg-slate-100 rounded-lg mb-2 relative overflow-hidden border border-slate-100">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="50vw" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase">No Img</span>
              )}
            </div>
            <h3 className="text-xs font-bold line-clamp-1 text-slate-900">{item.name}</h3>
          </Link>
          <button 
            onClick={() => handleRemoveSaved(item.id)} 
            className="text-[10px] text-red-500 hover:text-red-700 font-bold mt-2 w-full text-left py-1 transition-colors"
          >
            ✕ Remove
          </button>
        </div>
      ))}
    </div>
  );
}
