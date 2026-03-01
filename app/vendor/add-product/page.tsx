"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "electronics",
    price: "",
    stock: "1",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrls: string[] = [];

      // 1. Upload image to Cloudinary if selected
      if (imageFile) {
        // Get secure signature from our API
        const signRes = await fetch("/api/cloudinary/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "kabale_online" })
        });
        const signData = await signRes.json();

        // Push directly to Cloudinary
        const formDataCloudinary = new FormData();
        formDataCloudinary.append("file", imageFile);
        formDataCloudinary.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""); // Note: Cloudinary upload needs the cloud name in URL, api_key in body
        formDataCloudinary.append("timestamp", signData.timestamp.toString());
        formDataCloudinary.append("signature", signData.signature);
        formDataCloudinary.append("folder", "kabale_online");

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formDataCloudinary,
        });

        const uploadData = await uploadRes.json();
        if (uploadData.secure_url) {
          imageUrls.push(uploadData.secure_url);
        }
      }

      // 2. Save product to our database
      const dbRes = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images: imageUrls,
        }),
      });

      const dbData = await dbRes.json();

      if (dbData.success) {
        alert(`Product created successfully! ID: ${dbData.publicId}`);
        router.push(`/product/${dbData.publicId}`);
      } else {
        alert("Error saving product to database");
      }

    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Add New Product</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Product Name</label>
          <input required type="text" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2" 
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Category</label>
            <select className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
              value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option value="electronics">Electronics</option>
              <option value="agriculture">Agriculture</option>
              <option value="student_item">Student Market</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Price (UGX)</label>
            <input required type="number" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
              value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Stock Quantity</label>
            <input required type="number" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
              value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Product Image</label>
            <input type="file" accept="image/*" className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-sky-500"
              onChange={e => setImageFile(e.target.files?.[0] || null)} />
          </div>
        </div>

        <button disabled={loading} type="submit" className="w-full bg-primary text-white py-3 rounded-md font-bold hover:bg-sky-500 transition-colors disabled:opacity-70">
          {loading ? "Uploading & Saving..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}