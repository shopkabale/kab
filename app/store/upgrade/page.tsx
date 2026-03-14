"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase/config"; // Standard client DB
import { doc, setDoc } from "firebase/firestore";

export default function StoreUpgradePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
  });

  // Handle Logo Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("You must be logged in to upgrade.");
      return;
    }

    if (!logoFile) {
      setError("Please upload a logo for your store.");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload Logo to Cloudinary
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "kabale_online_stores" })
      });

      if (!signRes.ok) throw new Error("Failed to get upload signature.");
      const signData = await signRes.json();
      
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

      const formDataCloudinary = new FormData();
      formDataCloudinary.append("file", logoFile);
      formDataCloudinary.append("api_key", apiKey!);
      formDataCloudinary.append("timestamp", signData.timestamp.toString());
      formDataCloudinary.append("signature", signData.signature);
      formDataCloudinary.append("folder", "kabale_online_stores");

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formDataCloudinary,
      });

      if (!uploadRes.ok) throw new Error("Cloudinary upload failed.");
      const uploadData = await uploadRes.json();
      const logoUrl = uploadData.secure_url;

      // 2. Create the Store Document in Firestore (Status: pending/Not Approved)
      const storeId = `store_${Date.now()}`;
      const storeSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      await setDoc(doc(db, "stores", storeId), {
        id: storeId,
        vendorId: user.id,
        name: formData.name,
        slug: storeSlug,
        description: formData.description,
        phone: formData.phone,
        logo: logoUrl,
        isApproved: false, // This flips to true AFTER Flutterwave payment
        createdAt: Date.now(),
      });

      // 3. Trigger Flutterwave Payment
      const paymentRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: user.displayName,
          paymentType: "store_subscription",
          referenceId: storeId, // Pass the new storeId to tie the payment to this store
          amount: 20000, 
        }),
      });

      const paymentData = await paymentRes.json();

      if (paymentData.link) {
        // Redirect to Flutterwave checkout!
        window.location.href = paymentData.link;
      } else {
        throw new Error(paymentData.error || "Failed to initialize payment.");
      }

    } catch (err: any) {
      console.error("Upgrade process failed:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (authLoading) return <div className="py-20 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Column: The Pitch */}
        <div className="space-y-8">
          <div>
            <span className="text-amber-600 font-bold tracking-wider uppercase text-sm mb-2 block">Premium Seller</span>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Take Your Business to the Next Level</h1>
            <p className="text-lg text-slate-600">
              Upgrade to a Premium Store on Kabale Online and get a dedicated storefront, advanced analytics, and higher trust from buyers.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xl">🏪</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Dedicated Store URL</h3>
                <p className="text-slate-600">Get your own link (e.g., kabaleonline.com/store/your-name) to share directly with customers on WhatsApp.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl">📈</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Advanced Analytics</h3>
                <p className="text-slate-600">Track your store views, top-selling items, and manage inventory like a pro from your private dashboard.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl">⭐</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Verified Seller Badge</h3>
                <p className="text-slate-600">Stand out from free sellers. Buyers trust premium stores, resulting in higher conversion rates.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-500 uppercase font-bold tracking-wide">Subscription Price</p>
            <div className="text-4xl font-extrabold text-slate-900 mt-2 mb-1">UGX 20,000 <span className="text-lg text-slate-500 font-normal">/ 30 days</span></div>
            <p className="text-slate-600 text-sm">Cancel anytime. Secure payments powered by Flutterwave.</p>
          </div>
        </div>

        {/* Right Column: The Form */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Your Store Profile</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleUpgradeSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-32 h-32 rounded-full border-4 border-dashed border-slate-200 hover:border-amber-500 bg-slate-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors group"
              >
                {logoPreview ? (
                  <Image src={logoPreview} alt="Logo Preview" fill className="object-cover" />
                ) : (
                  <>
                    <span className="text-3xl text-slate-400 mb-1 group-hover:text-amber-500">📷</span>
                    <span className="text-xs text-slate-500 font-medium group-hover:text-amber-600">Upload Logo</span>
                  </>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Store Name *</label>
              <input required type="text" placeholder="e.g. John Electronics" 
                className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Business Phone Number *</label>
              <input required type="tel" placeholder="e.g. 0745184660" 
                className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Store Description *</label>
              <textarea required rows={3} placeholder="What do you sell? Tell buyers about your business..." 
                className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} 
              />
            </div>

            <button 
              disabled={loading} 
              type="submit" 
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-md mt-4"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Setting up store...
                </>
              ) : (
                "Pay UGX 20,000 & Upgrade"
              )}
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">
              You will be redirected to Flutterwave to securely complete your payment.
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}
