"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";

export default function SellPage() {
  const router = useRouter();
  const { user, signIn, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "electronics",
    price: "",
    condition: "used",
    description: "",
    sellerPhone: "",
  });

  // Watch for user login if they were interrupted
  useEffect(() => {
    if (user && showLoginModal) {
      setShowLoginModal(false);
      // Auto-submit now that they are logged in!
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

    // LOGIN INTERRUPTION FLOW
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

      // 1. Upload Images to Cloudinary
      if (imageFiles.length > 0) {
        const signRes = await fetch("/api/cloudinary/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "kabale_online" })
        });
        const signData = await signRes.json();
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

        // Upload in parallel for speed
        const uploadPromises = imageFiles.map(async (file) => {
          const formDataCloudinary = new FormData();
          formDataCloudinary.append("file", file);
          formDataCloudinary.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "");
          formDataCloudinary.append("timestamp", signData.timestamp.toString());
          formDataCloudinary.append("signature", signData.signature);
          formDataCloudinary.append("folder", "kabale_online");

          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formDataCloudinary,
          });
          return res.json();
        });

        const uploadResults = await Promise.all(uploadPromises);
        imageUrls = uploadResults.map(data => data.secure_url).filter(url => url);
      }

      // 2. Save Product to Firestore
      const dbRes = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images: imageUrls,
          sellerId: currentUser.id,
          sellerName: currentUser.displayName,
        }),
      });

      const dbData = await dbRes.json();

      if (dbData.success) {
        // Your PRD redirects to /item/[publicId], so we match that route exactly
        router.push(`/item/${dbData.publicId}`);
      } else {
        alert("Error saving product to database");
        setLoading(false);
      }

    } catch (error) {
      console.error(error);
      alert("Something went wrong during upload.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Post an Item for Sale</h1>
        <p className="text-slate-600 mt-2">Reach buyers across Kabale town. No hidden fees.</p>
      </div>
      
      <form onSubmit={handleSubmitClick} className="space-y-8">
        
        {/* A. Basic Information Section */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Basic Details</h2>
          
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Product Title *</label>
            <input required type="text" placeholder="e.g. HP EliteBook 840 G5" className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Category *</label>
              <select className="w-full rounded-lg border border-slate-300 px-4 py-3 bg-white focus:ring-2 focus:ring-primary outline-none"
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="electronics">Electronics</option>
                <option value="agriculture">Agriculture</option>
                <option value="student_item">Student Market</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Price (UGX) *</label>
              <input required type="number" placeholder="e.g. 850000" className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Condition *</label>
              <select className="w-full rounded-lg border border-slate-300 px-4 py-3 bg-white focus:ring-2 focus:ring-primary outline-none"
                value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                <option value="used">Used / Second Hand</option>
                <option value="new">Brand New</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Your WhatsApp Number *</label>
              <input required type="tel" placeholder="e.g. 0745184660" className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                value={formData.sellerPhone} onChange={e => setFormData({...formData, sellerPhone: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Description *</label>
            <textarea required rows={4} placeholder="Describe the item, features, and any flaws..." className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-primary outline-none resize-none"
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
        </div>

        {/* B. Image Upload Section */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Photos</h2>
            <span className="text-sm text-slate-500">{imageFiles.length} / 5</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden group">
                <Image src={preview} alt="preview" fill className="object-cover" />
                <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  ✕
                </button>
                {index === 0 && (
                  <div className="absolute bottom-0 left-0 w-full bg-slate-900/70 text-white text-[10px] text-center py-1 font-bold">
                    COVER
                  </div>
                )}
              </div>
            ))}
            
            {imageFiles.length < 5 && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-primary transition-colors"
              >
                <span className="text-2xl text-slate-400 mb-1">+</span>
                <span className="text-xs text-slate-500 font-medium">Add Photo</span>
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleImageSelect} />
        </div>

        {/* C. Submit Button */}
        <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-lg">
          {loading ? (
             <>
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               Publishing...
             </>
          ) : (
            "Post Item Now"
          )}
        </button>
      </form>

      {/* D. Login Interruption Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🔐</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Almost there!</h2>
            <p className="text-slate-600 mb-8">
              Sign in with Google to publish your product to the marketplace. Your form data is saved.
            </p>
            <div className="space-y-3">
              <button onClick={() => {
                  setLoading(true); // Show loading state in background form
                  signIn(); 
                }} 
                className="w-full rounded-lg bg-primary px-4 py-3 text-base font-bold text-white hover:bg-sky-500 transition-colors"
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