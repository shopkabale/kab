"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function AdminUploadPage() {
  const router = useRouter();
  
  // Get the current user and their role
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "electronics",
    price: "",
    quantity: "1",
    condition: "new", // Defaulting admin to 'new'
    description: "",
    sellerPhone: "", // Enter the official business WhatsApp number here
  });

  // ============================================================================
  // STRICT SECURITY CHECK
  // ============================================================================
  if (authLoading) {
    return <div className="py-20 text-center font-bold text-slate-500 animate-pulse">Verifying Admin Access...</div>;
  }

  // Block anyone who isn't logged in, OR anyone whose role isn't 'admin'
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mb-6">
          ⛔
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-600 mb-8 font-medium">You must be an authorized Administrator to view this page.</p>
        <Link href="/" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md">
          Return to Homepage
        </Link>
      </div>
    );
  }

  // ============================================================================
  // UPLOAD LOGIC
  // ============================================================================
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (imageFiles.length + newFiles.length > 5) {
        alert("Maximum 5 images allowed.");
        return;
      }
      setImageFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (imageFiles.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setLoading(true);

    try {
      let imageUrls: string[] = [];

      // 1. Upload Images to Cloudinary
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "kabale_online" })
      });

      if (!signRes.ok) throw new Error("Failed to get upload signature.");

      const signData = await signRes.json();
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

      if (!apiKey) throw new Error("Missing Cloudinary API Key.");

      const uploadPromises = imageFiles.map(async (file) => {
        const formDataCloudinary = new FormData();
        formDataCloudinary.append("file", file);
        formDataCloudinary.append("api_key", apiKey);
        formDataCloudinary.append("timestamp", signData.timestamp.toString());
        formDataCloudinary.append("signature", signData.signature);
        formDataCloudinary.append("folder", "kabale_online");

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formDataCloudinary,
        });

        if (!res.ok) throw new Error("Cloudinary rejected the upload.");
        return res.json();
      });

      const uploadResults = await Promise.all(uploadPromises);
      imageUrls = uploadResults.map(data => data.secure_url).filter(url => url);

      // 2. Save Product to Firestore (WITH ADMIN OVERRIDES)
      const dbRes = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          price: formData.price,
          stock: Number(formData.quantity),
          condition: formData.condition,
          description: formData.description,
          sellerPhone: formData.sellerPhone,
          images: imageUrls,
          
          // FORCING OFFICIAL ADMIN DATA
          sellerId: user.id, 
          sellerName: "Kabale Online Official", // Automatically triggers the badge
          isAdminUpload: true, // Useful for future database filtering
        }),
      });

      const dbData = await dbRes.json();

      if (dbData.success) {
        // Redirect the admin directly to the live product page to view it
        router.push(`/product/${dbData.publicId}`);
      } else {
        throw new Error(dbData.error || "Database rejected the product.");
      }

    } catch (error: any) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      
      {/* Admin Header Section */}
      <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white flex items-center justify-between shadow-lg">
        <div>
          <span className="bg-[#D97706] text-white text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-widest mb-3 inline-block">
            Secure Admin Portal
          </span>
          <h1 className="text-3xl font-extrabold mb-1">Upload Official Inventory</h1>
          <p className="text-slate-400">Items posted here automatically receive the "Official Store" badge.</p>
        </div>
        <div className="hidden md:flex w-16 h-16 bg-white/10 rounded-full items-center justify-center text-3xl">
          👑
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* DETAILS SECTION */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Product Details</h2>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Product Title *</label>
            <input required type="text" placeholder="e.g. iPhone 13 Pro Max (256GB)" className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none transition-shadow" 
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Category *</label>
              <select className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white focus:ring-2 focus:ring-[#D97706] outline-none transition-shadow"
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="electronics">Electronics</option>
                <option value="agriculture">Agriculture</option>
                <option value="student_item">Student Market</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Price (UGX) *</label>
              <input required type="number" placeholder="e.g. 1500000" className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none transition-shadow"
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Quantity in Stock *</label>
              <input required type="number" min="1" className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none transition-shadow"
                value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Condition *</label>
              <select className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white focus:ring-2 focus:ring-[#D97706] outline-none transition-shadow"
                value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                <option value="new">Brand New</option>
                <option value="used">Used / Second Hand</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Official WhatsApp Number *</label>
              <input required type="tel" placeholder="e.g. 077..." className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none transition-shadow"
                value={formData.sellerPhone} onChange={e => setFormData({...formData, sellerPhone: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Description *</label>
            <textarea required rows={5} placeholder="Full product specifications and details..." className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none resize-none transition-shadow"
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
        </div>

        {/* IMAGE UPLOAD SECTION */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">High Quality Images</h2>
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{imageFiles.length} / 5</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden group shadow-sm">
                <Image src={preview} alt="preview" fill className="object-cover" />
                <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600">
                  ✕
                </button>
                {index === 0 && (
                  <div className="absolute bottom-0 left-0 w-full bg-[#D97706] text-white text-[10px] text-center py-1.5 font-black tracking-widest uppercase">
                    Main Photo
                  </div>
                )}
              </div>
            ))}

            {imageFiles.length < 5 && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50 hover:border-[#D97706] transition-colors"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl text-slate-500">+</span>
                </div>
                <span className="text-xs text-slate-600 font-bold">Add Photo</span>
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleImageSelect} />
        </div>

        {/* SUBMIT BUTTON */}
        <button disabled={loading} type="submit" className="w-full bg-[#D97706] text-white py-5 rounded-xl font-black text-xl hover:bg-amber-600 transition-all hover:-translate-y-1 hover:shadow-xl disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-3">
          {loading ? (
             <>
               <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
               Uploading Official Product...
             </>
          ) : (
            "Publish to Official Store"
          )}
        </button>
      </form>
    </div>
  );
}