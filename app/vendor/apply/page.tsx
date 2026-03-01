"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function VendorApplyPage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    storeName: "",
    phone: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      const res = await fetch("/api/vendor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          ...formData
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        alert(data.error || "Failed to submit application");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="py-20 text-center text-slate-500">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-4">
        <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🔒</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Log in to Apply</h1>
        <p className="text-slate-600 mb-8">
          You need a Kabale Online account before you can become a verified seller.
        </p>
        <button
          onClick={signIn}
          className="w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
        >
          Log in with Google
        </button>
      </div>
    );
  }

  if (user.role === "vendor" || user.role === "admin") {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-4">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">✅</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">You are already a seller!</h1>
        <p className="text-slate-600 mb-8">
          Your account is already approved to sell on Kabale Online.
        </p>
        <Link 
          href="/vendor/add-product"
          className="inline-block w-full rounded-lg bg-slate-900 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          Add a New Product
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-4">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🎉</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Application Received!</h1>
        <p className="text-slate-600 mb-8">
          Thank you for applying to sell on Kabale Online. Our team will review your application and contact you on WhatsApp shortly.
        </p>
        <Link 
          href="/profile"
          className="inline-block w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
        >
          Go to My Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Become a Local Seller</h1>
        <p className="text-slate-600">
          Reach hundreds of Kabale University students and locals. Fill out the form below to get your store verified.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Store or Business Name</label>
          <input 
            required 
            type="text" 
            placeholder="e.g. Cosma Electronics"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
            value={formData.storeName} 
            onChange={e => setFormData({...formData, storeName: e.target.value})} 
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">WhatsApp / Phone Number</label>
          <input 
            required 
            type="tel" 
            placeholder="e.g. 0745184660"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
            value={formData.phone} 
            onChange={e => setFormData({...formData, phone: e.target.value})} 
          />
          <p className="mt-2 text-xs text-slate-500">We will use this to contact you for verification.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">What will you sell?</label>
          <textarea 
            required 
            rows={3}
            placeholder="e.g. I sell slightly used laptops and phone accessories in Kamukira..."
            className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none" 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
          />
        </div>

        <button 
          disabled={loading} 
          type="submit" 
          className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? (
             <>
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               Submitting...
             </>
          ) : (
            "Submit Application"
          )}
        </button>
      </form>
    </div>
  );
}