"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function SellPage() {
  const router = useRouter();
  const { user, signIn, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [successData, setSuccessData] = useState<{ publicId: string; title: string } | null>(null);
  
  // Toggle for the advanced/optional fields
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    quantity: "1", 
    
    // Optional Fields
    category: "general",
    condition: "used",
    description: "",
    sellerPhone: "",
  });

  useEffect(() => {
    if (user && showLoginModal) {
      setShowLoginModal(false);
      submitProductData(user); 
    }
  }, [user, showLoginModal]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (imageFiles.length + newFiles.length > 5) {
        alert("You can only upload a maximum of 5 images.");
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

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();

    if (imageFiles.length === 0) {
      alert("Please upload at least one image of your product.");
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
        imageUrls = uploadResults.map(data => data.secure_url).filter(url => url);
      }

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
          sellerId: currentUser.id,
          sellerName: currentUser.displayName,
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
            className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-[#D97706] hover:text-[#D97706] transition-colors"
          >
            View Live Item
          </Link>
          <button 
            onClick={() => {
              setSuccessData(null);
              setFormData({ ...formData, title: "", price: "", description: "" });
              setImageFiles([]);
              setImagePreviews([]);
              setShowOptionalFields(false);
            }}
            className="px-8 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
          >
            Post Another Item
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // QUICK UPLOAD FORM RENDER
  // ==========================================
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Quick Post 🚀</h1>
        <p className="text-slate-600 mt-1 font-medium">Sell in Kabale instantly. Start with a photo.</p>
      </div>

      <form onSubmit={handleSubmitClick} className="space-y-6">

        {/* STEP 1: IMAGE FIRST UPLOAD */}
        <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-amber-300 shadow-sm hover:border-amber-500 transition-colors group relative">
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">1. Upload Photo <span className="text-red-500">*</span></h2>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">{imageFiles.length}/5</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* The primary upload button now looks like a big empty slot */}
            {imageFiles.length < 5 && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-2xl bg-amber-50 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-100 transition-colors border border-amber-200"
              >
                <span className="text-3xl text-amber-500 mb-1">📷</span>
                <span className="text-[10px] text-amber-600 font-black uppercase tracking-wider">Tap to Add</span>
              </div>
            )}

            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-2xl border border-slate-200 overflow-hidden group/image shadow-sm">
                <Image src={preview} alt="preview" fill className="object-cover" />
                <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-90 hover:scale-110 transition-transform shadow-md">
                  ✕
                </button>
                {index === 0 && (
                  <div className="absolute bottom-0 left-0 w-full bg-slate-900/80 text-white text-[10px] text-center py-1 font-black tracking-widest">
                    COVER
                  </div>
                )}
              </div>
            ))}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleImageSelect} />
        </div>

        {/* STEP 2: BARE ESSENTIALS */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">2. Name & Price</h2>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">What are you selling? <span className="text-red-500">*</span></label>
            <input required type="text" placeholder="e.g. HP EliteBook 840 G5" className="w-full rounded-xl border border-slate-300 px-4 py-3.5 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900 placeholder:font-medium" 
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Price (UGX) <span className="text-red-500">*</span></label>
              <input required type="number" placeholder="850000" className="w-full rounded-xl border border-slate-300 px-4 py-3.5 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900 placeholder:font-medium"
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Quantity <span className="text-red-500">*</span></label>
              <input required type="number" min="1" placeholder="1" className="w-full rounded-xl border border-slate-300 px-4 py-3.5 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900 placeholder:font-medium"
                value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
          </div>
        </div>

        {/* STEP 3: OPTIONAL TOGGLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
          <button 
            type="button" 
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="w-full flex justify-between items-center p-6 sm:px-8 hover:bg-slate-50 transition-colors"
          >
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">3. Optional Details</h2>
            <span className={`text-slate-400 font-black transform transition-transform ${showOptionalFields ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showOptionalFields && (
            <div className="p-6 sm:px-8 pt-0 border-t border-slate-100 space-y-5">
              
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 mt-4">Description</label>
                <textarea rows={3} placeholder="Add more details, condition, flaws..." className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none resize-none font-medium text-slate-900"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Category</label>
                  <select className="w-full rounded-xl border border-slate-300 px-4 py-3.5 bg-white focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900"
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="electronics">Electronics</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="student_item">Student Market</option>
                    <option value="general">General Items</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Condition</label>
                  <select className="w-full rounded-xl border border-slate-300 px-4 py-3.5 bg-white focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900"
                    value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                    <option value="used">Used / Second Hand</option>
                    <option value="new">Brand New</option>
                  </select>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-xl uppercase tracking-widest mt-4">
          {loading ? (
             <>
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               Publishing...
             </>
          ) : (
            "🚀 Publish Item Now"
          )}
        </button>
      </form>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🔐</div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Almost there!</h2>
            <p className="text-slate-600 mb-8 font-medium">
              Sign in to publish your item. Don't worry, your photo and details are saved.
            </p>
            <div className="space-y-3">
              <button onClick={() => { setLoading(true); signIn(); }} 
                className="w-full rounded-xl bg-slate-900 px-4 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all shadow-md"
              >
                Sign in with Google
              </button>
              <button onClick={() => setShowLoginModal(false)} className="w-full rounded-xl bg-white border-2 border-slate-200 px-4 py-3.5 text-sm font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
