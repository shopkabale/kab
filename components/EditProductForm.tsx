"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { Product } from "@/types";

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  
  // Manage existing images from database vs newly uploaded files
  const [existingImages, setExistingImages] = useState<string[]>(product.images || []);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: product.name || "",
    category: product.category || "electronics",
    price: product.price.toString() || "",
    condition: product.condition || "used",
    description: product.description || "",
    sellerPhone: product.sellerPhone || "",
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (existingImages.length + newImageFiles.length + newFiles.length > 5) {
        alert("You can only have a maximum of 5 images.");
        return;
      }
      setNewImageFiles(prev => [...prev, ...newFiles]);
      setNewImagePreviews(prev => [...prev, ...newFiles.map(file => URL.createObjectURL(file))]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in to edit this ad.");
    if (existingImages.length === 0 && newImageFiles.length === 0) return alert("Please have at least one image.");

    setLoading(true);

    try {
      let newlyUploadedUrls: string[] = [];

      // Upload new images to Cloudinary if any were added
      if (newImageFiles.length > 0) {
        const signRes = await fetch("/api/cloudinary/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "kabale_online" })
        });
        const signData = await signRes.json();
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

        const uploadPromises = newImageFiles.map(async (file) => {
          const formDataCloudinary = new FormData();
          formDataCloudinary.append("file", file);
          formDataCloudinary.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "");
          formDataCloudinary.append("timestamp", signData.timestamp.toString());
          formDataCloudinary.append("signature", signData.signature);
          formDataCloudinary.append("folder", "kabale_online");

          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formDataCloudinary });
          return res.json();
        });

        const uploadResults = await Promise.all(uploadPromises);
        newlyUploadedUrls = uploadResults.map(data => data.secure_url).filter(url => url);
      }

      // Combine remaining old images with newly uploaded ones
      const finalImageArray = [...existingImages, ...newlyUploadedUrls];

      // Update Firestore
      const dbRes = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: user.id,
          images: finalImageArray,
        }),
      });

      const dbData = await dbRes.json();

      if (dbData.success) {
        alert("Ad updated successfully!");
        router.push(`/item/${dbData.publicId}`);
      } else {
        alert(dbData.error || "Failed to update ad.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong during update.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="py-20 text-center">Loading...</div>;
  if (!user || user.id !== product.sellerId) {
    return (
      <div className="py-20 text-center px-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Unauthorized</h2>
        <p className="text-slate-600">You do not have permission to edit this ad.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Edit Your Ad</h1>
        <p className="text-slate-600 mt-2">Update details for: {product.name}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Same basic info inputs as the /sell page */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Basic Details</h2>
          
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Product Title *</label>
            <input required type="text" className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary" 
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Category *</label>
              <select className="w-full rounded-lg border border-slate-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-primary"
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="electronics">Electronics</option>
                <option value="agriculture">Agriculture</option>
                <option value="student_item">Student Market</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Price (UGX) *</label>
              <input required type="number" className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Condition *</label>
              <select className="w-full rounded-lg border border-slate-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-primary"
                value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                <option value="used">Used / Second Hand</option>
                <option value="new">Brand New</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Your WhatsApp Number *</label>
              <input required type="tel" className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                value={formData.sellerPhone} onChange={e => setFormData({...formData, sellerPhone: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Description *</label>
            <textarea required rows={4} className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none"
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
        </div>

        {/* Edit Images Section */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Photos</h2>
            <span className="text-sm text-slate-500">{existingImages.length + newImageFiles.length} / 5</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {/* Show Existing Images */}
            {existingImages.map((img, index) => (
              <div key={`old-${index}`} className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden group">
                <Image src={img} alt="preview" fill className="object-cover" />
                <button type="button" onClick={() => removeExistingImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              </div>
            ))}
            
            {/* Show New Image Previews */}
            {newImagePreviews.map((preview, index) => (
              <div key={`new-${index}`} className="relative aspect-square rounded-xl border-2 border-emerald-400 overflow-hidden group">
                <Image src={preview} alt="preview" fill className="object-cover" />
                <button type="button" onClick={() => removeNewImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                <div className="absolute bottom-0 w-full bg-emerald-500 text-white text-[10px] font-bold text-center">NEW</div>
              </div>
            ))}
            
            {(existingImages.length + newImageFiles.length) < 5 && (
              <div onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-primary transition-colors">
                <span className="text-2xl text-slate-400 mb-1">+</span>
                <span className="text-xs text-slate-500 font-medium">Add Photo</span>
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleImageSelect} />
        </div>

        <button disabled={loading} type="submit" className="w-full bg-sky-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-sky-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-lg">
          {loading ? "Saving Changes..." : "Update Ad"}
        </button>
      </form>
    </div>
  );
}