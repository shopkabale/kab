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
    whatsapp: "",
    email: "",
    street: "",
    landmark: "",
    pickupAvailable: true,
    deliveryAvailable: true,
  });

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

      // 2. Create the Expanded Store Document in Firestore
      const storeId = `store_${Date.now()}`;
      const storeSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      // Define default operating hours to save the user time
      const standardDay = { open: "08:00", close: "18:00", isClosed: false };
      const closedDay = { open: "08:00", close: "18:00", isClosed: true };

      await setDoc(doc(db, "stores", storeId), {
        id: storeId,
        vendorId: user.id,
        name: formData.name,
        slug: storeSlug,
        description: formData.description,
        logo: logoUrl,
        isApproved: false, 
        createdAt: Date.now(),
        
        // New Schema Additions
        location: {
          district: "Kabale", // Hardcoded for Kabale Online
          town: "Kabale Town",
          street: formData.street,
          landmark: formData.landmark,
        },
        phone: formData.phone,
        whatsapp: formData.whatsapp || formData.phone, // Fallback to phone if empty
        email: formData.email,
        deliveryOptions: {
          pickupAvailable: formData.pickupAvailable,
          deliveryAvailable: formData.deliveryAvailable,
        },
        operatingHours: {
          monday: standardDay, tuesday: standardDay, wednesday: standardDay,
          thursday: standardDay, friday: standardDay, saturday: standardDay,
          sunday: closedDay, // Default Sunday closed
        },
        
        // Initialize Trust Metrics
        rating: 0,
        ratingCount: 0,
        followersCount: 0,
        totalSales: 0,
        averageResponseTimeMin: 30, // Default 30 min assumption
        lastActiveAt: Date.now(),
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
          referenceId: storeId, 
          amount: 20000, 
        }),
      });

      const paymentData = await paymentRes.json();

      if (paymentData.link) {
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

  if (authLoading) return <div className="py-20 text-center text-slate-500 font-bold">Loading secure checkout...</div>;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Column: The Pitch */}
        <div className="space-y-8 sticky top-8">
          <div>
            <span className="text-amber-600 font-black tracking-wider uppercase text-sm mb-2 block">Premium Seller</span>
            <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Open Your Professional Store</h1>
            <p className="text-lg text-slate-600 font-medium">
              Join the most trusted sellers in Kabale. Build your local brand, get a custom shop link, and unlock advanced analytics.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
            <p className="text-xs text-slate-500 uppercase font-black tracking-wide mb-1">Subscription Price</p>
            <div className="text-4xl font-black text-amber-600 mt-1 mb-2">UGX 20,000 <span className="text-lg text-slate-500 font-medium">/ 30 days</span></div>
            <p className="text-slate-600 text-sm font-medium">Cancel anytime. Secure mobile money payments powered by Flutterwave.</p>
          </div>
        </div>

        {/* Right Column: The Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl">
          <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Store Profile Setup</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleUpgradeSubmit} className="space-y-6">
            
            {/* Logo Upload */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-28 h-28 rounded-full border-4 border-dashed border-slate-200 hover:border-amber-500 bg-slate-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group shadow-sm"
              >
                {logoPreview ? (
                  <Image src={logoPreview} alt="Logo Preview" fill className="object-cover" />
                ) : (
                  <>
                    <span className="text-3xl text-slate-400 mb-1 group-hover:text-amber-500 transition-colors">📷</span>
                    <span className="text-[10px] text-slate-500 font-black uppercase group-hover:text-amber-600">Upload Logo</span>
                  </>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
            </div>

            {/* Section 1: Basic Identity */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">1. Identity</h3>
              
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-2">Store Name *</label>
                <input required type="text" placeholder="e.g. John Electronics Kabale" 
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-2">Store Description *</label>
                <textarea required rows={2} placeholder="What do you sell? E.g. Top quality laptops and phones..." 
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none resize-none font-medium"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
            </div>

            {/* Section 2: Contact Info */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">2. Contact</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-2">Calls Number *</label>
                  <input required type="tel" placeholder="07..." 
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-2">WhatsApp Number *</label>
                  <input required type="tel" placeholder="07..." 
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#25D366] outline-none font-medium"
                    value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Location & Delivery */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">3. Location in Kabale</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-2">Street / Area *</label>
                  <input required type="text" placeholder="e.g. Kigongi Road" 
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                    value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-2">Nearby Landmark</label>
                  <input type="text" placeholder="e.g. Opp. Kabale University" 
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                    value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} 
                  />
                </div>
              </div>

              <div className="flex gap-6 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.pickupAvailable} onChange={e => setFormData({...formData, pickupAvailable: e.target.checked})} className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500" />
                  <span className="text-sm font-bold text-slate-700">Allow Pickup</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.deliveryAvailable} onChange={e => setFormData({...formData, deliveryAvailable: e.target.checked})} className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500" />
                  <span className="text-sm font-bold text-slate-700">Offer Delivery</span>
                </label>
              </div>
            </div>

            <button 
              disabled={loading} 
              type="submit" 
              className="w-full bg-amber-500 text-white py-4 rounded-xl font-black text-lg hover:bg-amber-600 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-lg mt-6 uppercase tracking-wide"
            >
              {loading ? "Preparing Payment..." : "Pay UGX 20,000 to Create Store"}
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">
              You will be redirected to a secure payment gateway to complete your transaction.
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}
