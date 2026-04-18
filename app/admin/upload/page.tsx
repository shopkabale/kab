"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import imageCompression from "browser-image-compression"; // Added client-side compression

function AdminUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPublicId = searchParams.get("edit");

  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(!!editPublicId);
  const [successMessage, setSuccessMessage] = useState(""); 
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false); // Added compression state

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productIdToUpdate, setProductIdToUpdate] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    category: "electronics",
    price: "",
    quantity: "1",
    condition: "new",
    description: "",
    metaDescription: "", 
    sellerPhone: "", 
  });

  // ============================================================================
  // PRE-FILL DATA IF EDITING
  // ============================================================================
  useEffect(() => {
    if (editPublicId && user?.role === "admin") {
      const fetchProduct = async () => {
        try {
          const res = await fetch(`/api/products/${editPublicId}`);
          if (res.ok) {
            const data = await res.json();
            setProductIdToUpdate(data.id);
            setExistingImages(data.images || []);
            setFormData({
              title: data.name || data.title || "",
              category: data.category || "electronics",
              price: data.price ? data.price.toString() : "",
              quantity: data.stock !== undefined ? data.stock.toString() : "1",
              condition: data.condition || "new",
              description: data.description || "",
              metaDescription: data.metaDescription || "",
              sellerPhone: data.sellerPhone || "",
            });
          }
        } catch (error) {
          console.error("Failed to fetch product for editing:", error);
        } finally {
          setInitialFetchLoading(false);
        }
      };
      fetchProduct();
    }
  }, [editPublicId, user]);

  // ============================================================================
  // AI GENERATION LOGIC
  // ============================================================================
  const handleGenerateAI = async () => {
    if (!formData.title) {
      alert("Please enter a Product Title first so the AI knows what to write about!");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const response = await fetch("https://bio-generator.ali3nplumb3r.workers.dev/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: formData.title,
          features: `Category: ${formData.category}, Condition: ${formData.condition}`
        })
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          description: data.description || prev.description,
          metaDescription: data.metaDescription || prev.metaDescription
        }));
      } else {
        alert(`AI Generation Failed: ${data.error}`);
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert("Failed to connect to the AI Generator.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // ============================================================================
  // SECURITY CHECK
  // ============================================================================
  if (authLoading || initialFetchLoading) {
    return <div className="py-20 text-center font-bold text-slate-500 animate-pulse">Loading Admin Portal...</div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mb-6">⛔</div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Access Denied</h1>
        <Link href="/" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors mt-4">Return to Homepage</Link>
      </div>
    );
  }

  // ============================================================================
  // IMAGE HANDLING & CLIENT-SIDE COMPRESSION
  // ============================================================================
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (existingImages.length + imageFiles.length + newFiles.length > 5) {
        alert("Maximum 5 images allowed total.");
        return;
      }

      setIsCompressing(true);

      try {
        const options = {
          maxSizeMB: 0.8, // 800KB Max
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };

        const compressedFilesPromises = newFiles.map(file => imageCompression(file, options));
        const compressedFiles = await Promise.all(compressedFilesPromises);

        setImageFiles(prev => [...prev, ...compressedFiles]);
        setImagePreviews(prev => [...prev, ...compressedFiles.map(file => URL.createObjectURL(file))]);
      } catch (error) {
        console.error("Compression error:", error);
        alert("There was an issue processing your images. Please try again.");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ============================================================================
  // UPLOAD / UPDATE LOGIC
  // ============================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (existingImages.length === 0 && imageFiles.length === 0) {
      alert("Please have at least one image.");
      return;
    }

    if (isCompressing) {
      alert("Please wait for your images to finish optimizing.");
      return;
    }

    setLoading(true);
    setSuccessMessage("");

    try {
      let newlyUploadedUrls: string[] = [];

      if (imageFiles.length > 0) {
        const signRes = await fetch("/api/cloudinary/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "kabale_online" })
        });

        const signData = await signRes.json();
        const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

        const uploadPromises = imageFiles.map(async (file) => {
          const formDataCloudinary = new FormData();
          formDataCloudinary.append("file", file);
          formDataCloudinary.append("api_key", apiKey!);
          formDataCloudinary.append("timestamp", signData.timestamp.toString());
          formDataCloudinary.append("signature", signData.signature);
          formDataCloudinary.append("folder", "kabale_online");

          const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formDataCloudinary,
          });
          return res.json();
        });

        const uploadResults = await Promise.all(uploadPromises);

        // Cloudinary URL Optimization: Auto format, quality, and width capping
        newlyUploadedUrls = uploadResults.map(data => {
          const originalUrl = data.secure_url;
          if (!originalUrl) return null;
          return originalUrl.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
        }).filter(url => url) as string[];
      }

      const finalImagesList = [...existingImages, ...newlyUploadedUrls];
      const method = editPublicId ? "PUT" : "POST";
      const apiUrl = editPublicId ? `/api/products/${productIdToUpdate}` : "/api/products";

      const dbRes = await fetch(apiUrl, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          price: formData.price,
          stock: Number(formData.quantity),
          condition: formData.condition,
          description: formData.description,
          metaDescription: formData.metaDescription, 
          sellerPhone: formData.sellerPhone,
          images: finalImagesList,
          sellerId: user.id, 
          sellerName: "Kabale Online Official", 
          isAdminUpload: true, 
        }),
      });

      const rawText = await dbRes.text();
      let dbData;

      try {
        dbData = rawText ? JSON.parse(rawText) : {};
      } catch (parseError) {
        console.error("Failed to parse server response. Raw text:", rawText);
        throw new Error(`Server returned an unexpected format (Status ${dbRes.status}).`);
      }

      if (dbRes.ok) {
        setSuccessMessage(editPublicId ? "Official item updated successfully!" : "New official product published!");
        window.scrollTo({ top: 0, behavior: "smooth" });

        if (!editPublicId) {
          setFormData(prev => ({
            title: "",
            category: "electronics",
            price: "",
            quantity: "1",
            condition: "new",
            description: "",
            metaDescription: "", 
            sellerPhone: prev.sellerPhone, 
          }));
          setImageFiles([]);
          setImagePreviews([]);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }

        setTimeout(() => setSuccessMessage(""), 5000);

      } else {
        throw new Error(dbData.error || dbData.message || "Database rejected the product.");
      }

    } catch (error: any) {
      console.error("Action failed:", error);
      alert(`Action failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">

      <div className="bg-slate-900 rounded-3xl p-8 mb-6 text-white flex items-center justify-between shadow-lg">
        <div>
          <span className="bg-[#D97706] text-white text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-widest mb-3 inline-block">
            {editPublicId ? "Update Mode" : "Secure Admin Portal"}
          </span>
          <h1 className="text-3xl font-extrabold mb-1">
            {editPublicId ? "Edit Official Item" : "Upload Official Inventory"}
          </h1>
          {editPublicId && <p className="text-slate-400">Editing Product ID: {editPublicId}</p>}
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl mb-8 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <span className="font-bold text-lg">{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage("")} className="text-green-600 hover:text-green-900 font-black text-xl px-2 transition-colors">
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* DETAILS SECTION */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Product Details</h2>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Product Title *</label>
            <input required type="text" className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none transition-shadow" 
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div>
  <label className="block text-sm font-semibold text-slate-900 mb-2">Category *</label>
  <select className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white focus:ring-2 focus:ring-[#D97706] outline-none transition-shadow"
    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
    <option value="electronics">Electronics</option>
    <option value="agriculture">Agriculture</option>
    <option value="student_item">Student Market</option>
    <option value="ladies">Ladies' Picks</option>
    {/* Added Watches option below */}
    <option value="watches">Watches</option>
  </select>
</div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Price (UGX) *</label>
              <input required type="number" className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none transition-shadow"
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Quantity in Stock *</label>
              <input required type="number" min="0" className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none transition-shadow"
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
              <input required type="tel" className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none transition-shadow"
                value={formData.sellerPhone} onChange={e => setFormData({...formData, sellerPhone: e.target.value})} />
            </div>
          </div>

          {/* AI GENERATION UI */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-semibold text-slate-900">Description *</label>
              <button 
                type="button" 
                onClick={handleGenerateAI}
                disabled={isGeneratingAi}
                className="text-xs bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isGeneratingAi ? "Generating..." : "✨ Auto-Write with AI"}
              </button>
            </div>
            <textarea required rows={5} className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none resize-none transition-shadow"
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Full product description..." />
          </div>

          {/* SEO META DESCRIPTION FIELD */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">SEO Meta Description (for Google Search)</label>
            <textarea rows={2} maxLength={160} className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-shadow text-sm"
              value={formData.metaDescription} onChange={e => setFormData({...formData, metaDescription: e.target.value})} placeholder="Short snippet for Google (under 160 characters)..." />
            <p className="text-right text-xs text-slate-500 mt-1">{formData.metaDescription.length} / 160</p>
          </div>
        </div>

        {/* DYNAMIC IMAGE UPLOAD SECTION */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Manage Images</h2>
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{existingImages.length + imageFiles.length} / 5</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {existingImages.map((url, index) => (
              <div key={`old-${index}`} className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden group shadow-sm">
                <Image src={url} alt="existing" fill className="object-cover" />
                <button type="button" onClick={() => removeExistingImage(index)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              </div>
            ))}

            {imagePreviews.map((preview, index) => (
              <div key={`new-${index}`} className="relative aspect-square rounded-xl border-4 border-[#D97706] overflow-hidden group shadow-sm">
                <Image src={preview} alt="new preview" fill className="object-cover" />
                <div className="absolute bottom-0 left-0 w-full bg-[#D97706] text-white text-[10px] text-center py-1 font-bold">NEW</div>
                <button type="button" onClick={() => removeNewImage(index)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              </div>
            ))}

            {(existingImages.length + imageFiles.length) < 5 && (
              <div 
                onClick={() => !isCompressing && fileInputRef.current?.click()} 
                className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
                  isCompressing 
                    ? "border-slate-300 bg-slate-50 cursor-not-allowed" 
                    : "border-slate-300 cursor-pointer hover:bg-amber-50 hover:border-[#D97706]"
                }`}
              >
                {isCompressing ? (
                  <div className="w-6 h-6 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin mb-1"></div>
                ) : (
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2"><span className="text-xl text-slate-500">+</span></div>
                )}
                <span className="text-xs text-slate-600 font-bold">
                  {isCompressing ? "Optimizing..." : "Add Photo"}
                </span>
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleImageSelect} disabled={isCompressing} />
        </div>

        {/* DYNAMIC SUBMIT BUTTON */}
        <button disabled={loading || isCompressing} type="submit" className="w-full bg-[#D97706] text-white py-5 rounded-xl font-black text-xl hover:bg-amber-600 transition-all hover:-translate-y-1 hover:shadow-xl disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-3">
          {loading ? (
             <>
               <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
               {editPublicId ? "Saving Updates..." : "Uploading Official Product..."}
             </>
          ) : (
            editPublicId ? "Save Product Changes" : "Publish to Official Store"
          )}
        </button>
      </form>
    </div>
  );
}

// Wrap the Content in a Suspense boundary to prevent Next.js client-side exceptions
export default function AdminUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#D97706] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-bold animate-pulse">Loading secure portal...</p>
      </div>
    }>
      <AdminUploadContent />
    </Suspense>
  );
}
