"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import imageCompression from "browser-image-compression"; // <-- BROUGHT THIS BACK!

export default function SellPage() {
  const router = useRouter();
  const { user, signIn, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false); // For the main submit button
  const [isCompressing, setIsCompressing] = useState(false); // Specifically for the image upload box
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [successData, setSuccessData] = useState<{ publicId: string; title: string } | null>(null);

  // Toggle for the description field
  const [showOptional, setShowOptional] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "electronics",
    price: "",
    quantity: "1", 
    condition: "used",
    description: "",
    sellerPhone: "", // Left blank for manual entry to avoid TS errors
  });

  useEffect(() => {
    if (user && showLoginModal) {
      setShowLoginModal(false);
      submitProductData(user); 
    }
  }, [user, showLoginModal]);

  // ==========================================
  // CLIENT-SIDE COMPRESSION LOGIC
  // ==========================================
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (imageFiles.length + newFiles.length > 5) {
        alert("You can only upload a maximum of 5 images.");
        return;
      }

      setIsCompressing(true); // Trigger the loading spinner on the image box

      try {
        const options = {
          maxSizeMB: 0.8, // 800KB Max
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };

        // Compress all selected images
        const compressedFilesPromises = newFiles.map(file => imageCompression(file, options));
        const compressedFiles = await Promise.all(compressedFilesPromises);

        setImageFiles(prev => [...prev, ...compressedFiles]);

        // Generate previews
        const newPreviews = compressedFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);

      } catch (error) {
        console.error("Compression error:", error);
        alert("There was an issue processing your images. Please try again.");
      } finally {
        setIsCompressing(false); // Turn off the spinner
      }
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();

    if (imageFiles.length === 0) {
      alert("Please upload at least one photo of your item.");
      return;
    }

    if (isCompressing) {
      alert("Please wait for your images to finish optimizing.");
      return;
    }

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    submitProductData(user);
  };

  const submitProductData = async (currentUser: any) => {
    setLoading(true);

    try {
      let imageUrls: string[] = [];

      if (imageFiles.length > 0) {
        const signRes = await fetch("/api/cloudinary/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "kabale_online" })
        });

        if (!signRes.ok) throw new Error("Failed to get upload signature from server.");

        const signData = await signRes.json();
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

        if (!apiKey) throw new Error("Missing NEXT_PUBLIC_CLOUDINARY_API_KEY in Vercel settings.");

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

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error?.message || "Cloudinary rejected the upload.");
          }

          return res.json();
        });

        const uploadResults = await Promise.all(uploadPromises);

        // Let Cloudinary convert to WebP/AVIF when serving to buyers
        imageUrls = uploadResults.map(data => {
          const originalUrl = data.secure_url;
          if (!originalUrl) return null;
          return originalUrl.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
        }).filter(url => url) as string[];
      }

      const dbRes = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          price: formData.price,
          stock: Number(formData.quantity) || 1, 
          condition: formData.condition || "used",
          description: formData.description || "No description provided.",
          sellerPhone: formData.sellerPhone,
          images: imageUrls,
          sellerId: currentUser.id,
          sellerName: currentUser.displayName || "Kabale Seller",
        }),
      });

      const dbData = await dbRes.json();

      if (dbData.success) {
        setSuccessData({ publicId: dbData.publicId, title: formData.title });
        setLoading(false);
      } else {
        throw new Error(dbData.error || "Database rejected the product.");
      }

    } catch (error: any) {
      console.error("Upload process failed:", error);
      alert(`Upload failed: ${error.message || "Unknown error occurred"}`);
      setLoading(false);
    }
  };

  // --- SHARING FUNCTIONS ---
  const copyToClipboard = () => {
    if (!successData) return;
    const url = `${window.location.origin}/product/${successData.publicId}`;
    navigator.clipboard.writeText(url);
    alert("Link copied! Paste it anywhere to share.");
  };

  const shareToWhatsApp = () => {
    if (!successData) return;
    const url = `${window.location.origin}/product/${successData.publicId}`;
    const text = `Hey! I'm selling my *${successData.title}* on Kabale Online. Check it out here: \n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // ==========================================
  // SUCCESS SCREEN RENDER
  // ==========================================
  if (successData) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl shadow-sm border-4 border-white">
          🎉
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Item Posted Successfully!</h1>
        <p className="text-slate-600 mb-8 text-lg">
          Your <span className="font-bold text-slate-900">{successData.title}</span> is now live on Kabale Online. 
        </p>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 mb-8">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">What's Next? Get Buyers Fast!</h2>

          <button 
            onClick={shareToWhatsApp}
            className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#20bd5a] transition-colors flex justify-center items-center gap-2 shadow-md"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            Share to WhatsApp Status
          </button>

          <button 
            onClick={copyToClipboard}
            className="w-full bg-slate-100 text-slate-700 py-3.5 rounded-xl font-bold text-base hover:bg-slate-200 transition-colors flex justify-center items-center gap-2"
          >
            📋 Copy Item Link
          </button>
        </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href={`/product/${successData.publicId}`}
            className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-[#D97706] hover:text-[#D97706] transition-colors flex-1 text-center"
          >
            View Live Item
          </Link>

          {/* 🔥 The Cache-Busting Dashboard Link */}
          <Link 
            href="/profile?refresh=true"
            className="px-8 py-3 bg-[#D97706] text-white font-bold rounded-xl hover:bg-amber-600 transition-colors flex-1 text-center shadow-md"
          >
            Manage in Dashboard
          </Link>
        </div>

        {/* Made this a subtle text button to keep focus on the main actions */}
        <button 
          onClick={() => {
            setSuccessData(null);
            setFormData({ ...formData, title: "", category: "electronics", price: "", quantity: "1", condition: "used", description: "", sellerPhone: "" });
            setImageFiles([]);
            setImagePreviews([]);
            setShowOptional(false);
          }}
          className="mt-6 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors inline-block"
        >
          + Post Another Item
        </button>


      </div>
    );
  }

  // ==========================================
  // NORMAL FORM RENDER
  // ==========================================
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Sell in 30 Seconds</h1>
        <p className="text-slate-500 mt-2">Snap a pic, set a price, and post. It's that easy.</p>
      </div>

      <form onSubmit={handleSubmitClick} className="space-y-4">

        {/* STEP 1: PHOTO UPLOAD */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <label className="block text-sm font-bold text-slate-900 mb-3">1. Upload Photos *</label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden group">
                <Image src={preview} alt="preview" fill className="object-cover" />
                <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md">
                  ✕
                </button>
              </div>
            ))}

            {imageFiles.length < 5 && (
              <div 
                onClick={() => !isCompressing && fileInputRef.current?.click()}
                className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
                  isCompressing 
                    ? "border-slate-300 bg-slate-50 cursor-not-allowed" 
                    : "border-[#D97706]/50 bg-amber-50 hover:bg-amber-100 cursor-pointer"
                }`}
              >
                {isCompressing ? (
                  <div className="w-6 h-6 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin mb-1"></div>
                ) : (
                  <span className="text-2xl text-[#D97706] mb-1">📷</span>
                )}
                <span className="text-xs text-[#D97706] font-bold">
                  {isCompressing ? "Optimizing..." : "Add Photo"}
                </span>
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleImageSelect} disabled={isCompressing} />
        </div>

        {/* STEP 2: MAIN DETAILS */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">2. What are you selling? *</label>
            <input required type="text" placeholder="e.g. HP Laptop, Nike Shoes" className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none bg-slate-50" 
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Price (UGX) *</label>
              <input required type="number" placeholder="e.g. 50000" className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none bg-slate-50"
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Category *</label>
              <select className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none bg-slate-50"
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="electronics">Electronics</option>
                <option value="agriculture">Agriculture</option>
                <option value="student_item">Student Market</option>
                <option value="ladies">Ladies' Picks</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Condition *</label>
              <select className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none bg-slate-50"
                value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                <option value="used">Used / Second Hand</option>
                <option value="new">Brand New</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Quantity *</label>
              <input required type="number" min="1" placeholder="1" className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none bg-slate-50"
                value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Your WhatsApp Number *</label>
            <input required type="tel" placeholder="e.g. 07..." className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none bg-slate-50"
              value={formData.sellerPhone} onChange={e => setFormData({...formData, sellerPhone: e.target.value})} />
            <p className="text-xs text-slate-500 mt-1">Buyers need this to message you directly.</p>
          </div>
        </div>

        {/* STEP 3: OPTIONAL DESCRIPTION TOGGLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button 
            type="button" 
            onClick={() => setShowOptional(!showOptional)}
            className="w-full p-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors font-bold text-slate-700"
          >
            <span>{showOptional ? "▲ Hide Description" : "▼ Add Description (Optional)"}</span>
          </button>

          {showOptional && (
            <div className="p-4 sm:p-6 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-900 mb-2">Product Description</label>
              <textarea rows={3} placeholder="Any extra details, flaws, or features?" className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none resize-none"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <button disabled={loading || isCompressing} type="submit" className="w-full bg-[#D97706] text-white py-4 rounded-xl font-black text-xl hover:bg-amber-600 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-lg mt-4">
          {loading ? (
             <>
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               Publishing...
             </>
          ) : (
            "Post Product Now"
          )}
        </button>
      </form>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🔐</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Almost there!</h2>
            <p className="text-slate-600 mb-8">
              Sign in with Google to publish your product to the marketplace. Your form data is saved.
            </p>
            <div className="space-y-3">
              <button onClick={() => { setLoading(true); signIn(); }} 
                className="w-full rounded-lg bg-[#D97706] px-4 py-3 text-base font-bold text-white hover:bg-amber-600 transition-colors"
              >
                Sign in with Google
              </button>
              <button onClick={() => setShowLoginModal(false)} className="w-full rounded-lg bg-white border border-slate-200 px-4 py-3 text-base font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
