"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Store } from "@/types";

export default function VendorSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
  });

  useEffect(() => {
    // Security redirect
    if (!authLoading && user?.role !== "vendor") {
      router.push("/profile");
      return;
    }

    const fetchStoreDetails = async () => {
      if (!user) return;
      
      try {
        const storeQuery = query(collection(db, "stores"), where("vendorId", "==", user.id));
        const storeSnapshot = await getDocs(storeQuery);

        if (!storeSnapshot.empty) {
          const storeData = { id: storeSnapshot.docs[0].id, ...storeSnapshot.docs[0].data() } as Store;
          setStore(storeData);
          setFormData({
            name: storeData.name || "",
            description: storeData.description || "",
            phone: storeData.phone || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch store details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStoreDetails();
    }
  }, [user, authLoading, router]);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const storeRef = doc(db, "stores", store.id);
      
      // Update the fields in Firestore
      await updateDoc(storeRef, {
        name: formData.name,
        description: formData.description,
        phone: formData.phone,
        // Optional: Update the slug if they change their name, but usually better to leave the original slug for SEO
        // slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      });

      // Update local state to reflect changes instantly
      setStore({ ...store, ...formData });
      setMessage({ type: "success", text: "Store settings updated successfully!" });
      
    } catch (error) {
      console.error("Failed to update store:", error);
      setMessage({ type: "error", text: "Failed to update settings. Please try again." });
    } finally {
      setIsSaving(false);
      
      // Clear the success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Store Settings ⚙️</h1>
        <p className="text-slate-500 mt-2 font-medium">Update your public profile and contact information.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Visual Profile Summary */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
        
        {/* Banner Overlay */}
        <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-slate-800 to-slate-900"></div>

        <div className="relative mt-8 sm:mt-4 h-24 w-24 rounded-full bg-white p-1 border border-slate-200 shadow-md flex-shrink-0 z-10">
          {store.logo ? (
            <Image src={store.logo} alt="Store Logo" fill className="rounded-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-3xl font-black text-slate-400">
              {store.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="text-center sm:text-left z-10 sm:mt-10">
          <h2 className="text-xl font-black text-slate-900">{store.name}</h2>
          <p className="text-sm font-bold text-amber-600 mb-1">kabaleonline.com/store/{store.slug}</p>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-green-100 text-green-800 uppercase tracking-widest mt-2">
            Status: {store.isApproved ? "Active" : "Pending"}
          </div>
        </div>
        
        {/* Placeholder for future logo/banner edit button */}
        <div className="sm:ml-auto z-10 mt-4 sm:mt-10">
           <button disabled className="bg-slate-100 text-slate-400 px-4 py-2 rounded-lg text-xs font-bold uppercase cursor-not-allowed border border-slate-200">
             Change Images (Coming Soon)
           </button>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleUpdateSettings} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
            Store Name <span className="text-red-500">*</span>
          </label>
          <input 
            required 
            type="text" 
            placeholder="e.g. John Electronics" 
            className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-medium text-slate-900"
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">
            Note: Changing your name will not change your URL link (/{store.slug})
          </p>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
            Business WhatsApp Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold">+256</span>
            <input 
              required 
              type="tel" 
              placeholder="745184660" 
              className="w-full rounded-xl border border-slate-300 pl-14 pr-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-medium text-slate-900"
              value={formData.phone.replace('+256', '')} 
              onChange={e => {
                // Keep the +256 prefix when saving to state
                const val = e.target.value;
                setFormData({...formData, phone: val.startsWith('0') ? val : `0${val}`})
              }} 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
            Store Description <span className="text-red-500">*</span>
          </label>
          <textarea 
            required 
            rows={4} 
            placeholder="Tell buyers what makes your shop special..." 
            className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none font-medium text-slate-900"
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3.5 rounded-xl font-black text-sm hover:bg-slate-800 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-md uppercase tracking-wide"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
