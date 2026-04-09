"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; // Adjust this path to your firebase config
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";

export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "products", productId, "reviews"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [productId]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !newReview) return alert("Please fill in all fields.");
    setLoading(true);

    try {
      await addDoc(collection(db, "products", productId, "reviews"), {
        name,
        text: newReview,
        rating,
        userId: user?.id || "guest",
        createdAt: serverTimestamp()
      });
      setNewReview("");
      setName("");
      setRating(5);
    } catch (error) {
      console.error("Error posting review:", error);
      alert("Failed to post review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Review Form */}
      <form onSubmit={submitReview} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-3 text-sm">Write a Review</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input 
            type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-[#D97706]" required
          />
          <select 
            value={rating} onChange={(e) => setRating(Number(e.target.value))}
            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-[#D97706]"
          >
            <option value="5">⭐⭐⭐⭐⭐ (5/5) Excellent</option>
            <option value="4">⭐⭐⭐⭐ (4/5) Good</option>
            <option value="3">⭐⭐⭐ (3/5) Average</option>
            <option value="2">⭐⭐ (2/5) Poor</option>
            <option value="1">⭐ (1/5) Terrible</option>
          </select>
        </div>
        <textarea 
          placeholder="What did you think about this item?" value={newReview} onChange={(e) => setNewReview(e.target.value)}
          className="w-full p-3 rounded-lg border border-slate-300 text-sm outline-none focus:border-[#D97706] mb-3 h-20" required
        ></textarea>
        <button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors">
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>

      {/* Review List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm text-slate-800">{review.name}</span>
                <span className="text-amber-500 text-xs">{"⭐".repeat(review.rating)}</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{review.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
