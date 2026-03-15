"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Store } from "@/types";

type Tab = "basic" | "location" | "hours";

export default function VendorSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("basic");

  // We split the form data to match the tabs
  const [basicData, setBasicData] = useState({
    name: "",
    description: "",
    phone: "",
    whatsapp: "",
    email: "",
  });

  const [locationData, setLocationData] = useState({
    street: "",
    landmark: "",
    pickupAvailable: true,
    deliveryAvailable: true,
  });

  const [hoursData, setHoursData] = useState<Store['operatingHours'] | any>(null);

  useEffect(() => {
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
          
          setBasicData({
            name: storeData.name || "",
            description: storeData.description || "",
            phone: storeData.phone || "",
            whatsapp: storeData.whatsapp || storeData.phone || "",
            email: storeData.email || "",
          });

          setLocationData({
            street: storeData.location?.street || "",
            landmark: storeData.location?.landmark || "",
            pickupAvailable: storeData.deliveryOptions?.pickupAvailable ?? true,
            deliveryAvailable: storeData.deliveryOptions?.deliveryAvailable ?? true,
          });

          setHoursData(storeData.operatingHours);
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
      
      await updateDoc(storeRef, {
        name: basicData.name,
        description: basicData.description,
        phone: basicData.phone,
        whatsapp: basicData.whatsapp,
        email: basicData.email,
        
        "location.street": locationData.street,
        "location.landmark": locationData.landmark,
        
        "deliveryOptions.pickupAvailable": locationData.pickupAvailable,
        "deliveryOptions.deliveryAvailable": locationData.deliveryAvailable,
        
        operatingHours: hoursData,
      });

      setStore({ 
        ...store, 
        ...basicData, 
        location: { ...store.location, street: locationData.street, landmark: locationData.landmark } as any,
        deliveryOptions: { pickupAvailable: locationData.pickupAvailable, deliveryAvailable: locationData.deliveryAvailable },
        operatingHours: hoursData
      });
      
      setMessage({ type: "success", text: "Store settings updated successfully!" });
      
    } catch (error) {
      console.error("Failed to update store:", error);
      setMessage({ type: "error", text: "Failed to update settings. Please try again." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleHourChange = (day: string, field: "open" | "close" | "isClosed", value: any) => {
    setHoursData((prev: any) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!store) return null;

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      <div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Store Settings ⚙️</h1>
        <p className="text-slate-500 mt-2 font-medium">Update your public profile, location, and hours.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Visual Profile Summary */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
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
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 scrollbar-hide gap-6">
        <button onClick={() => setActiveTab("basic")} className={`pb-4 text-sm font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${activeTab === "basic" ? "border-amber-500 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
          Basic Info
        </button>
        <button onClick={() => setActiveTab("location")} className={`pb-4 text-sm font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${activeTab === "location" ? "border-amber-500 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
          Location & Delivery
        </button>
        <button onClick={() => setActiveTab("hours")} className={`pb-4 text-sm font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${activeTab === "hours" ? "border-amber-500 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
          Operating Hours
        </button>
      </div>

      <form onSubmit={handleUpdateSettings} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        
        {/* TAB 1: BASIC INFO */}
        {activeTab === "basic" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Store Name *</label>
              <input required type="text" className="w-full rounded-xl border border-slate-300 px-4 py-3.5 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900"
                value={basicData.name} onChange={e => setBasicData({...basicData, name: e.target.value})} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Calls Number *</label>
                <input required type="tel" className="w-full rounded-xl border border-slate-300 px-4 py-3.5 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900"
                  value={basicData.phone} onChange={e => setBasicData({...basicData, phone: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">WhatsApp Number *</label>
                <input required type="tel" className="w-full rounded-xl border border-slate-300 px-4 py-3.5 focus:ring-2 focus:ring-[#25D366] outline-none font-bold text-slate-900"
                  value={basicData.whatsapp} onChange={e => setBasicData({...basicData, whatsapp: e.target.value})} 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Store Description *</label>
              <textarea required rows={4} className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none resize-none font-medium text-slate-900"
                value={basicData.description} onChange={e => setBasicData({...basicData, description: e.target.value})} 
              />
            </div>
          </div>
        )}

        {/* TAB 2: LOCATION & DELIVERY */}
        {activeTab === "location" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Street / Area in Kabale *</label>
                <input required type="text" placeholder="e.g. Kigongi Road" className="w-full rounded-xl border border-slate-300 px-4 py-3.5 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900"
                  value={locationData.street} onChange={e => setLocationData({...locationData, street: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Nearby Landmark</label>
                <input type="text" placeholder="e.g. Opp. Kabale University" className="w-full rounded-xl border border-slate-300 px-4 py-3.5 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900"
                  value={locationData.landmark} onChange={e => setLocationData({...locationData, landmark: e.target.value})} 
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-4">Delivery Options</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <input type="checkbox" checked={locationData.pickupAvailable} onChange={e => setLocationData({...locationData, pickupAvailable: e.target.checked})} className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500" />
                  <span className="text-sm font-bold text-slate-700">Allow customers to pick up from the store</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <input type="checkbox" checked={locationData.deliveryAvailable} onChange={e => setLocationData({...locationData, deliveryAvailable: e.target.checked})} className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500" />
                  <span className="text-sm font-bold text-slate-700">Offer delivery within Kabale</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OPERATING HOURS */}
        {activeTab === "hours" && hoursData && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
             <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-4">Weekly Schedule</label>
             
             {daysOfWeek.map((day) => (
               <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                 <div className="flex items-center gap-3 sm:w-1/3">
                    <input type="checkbox" checked={!hoursData[day].isClosed} onChange={e => handleHourChange(day, "isClosed", !e.target.checked)} className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500" />
                    <span className="text-sm font-black text-slate-900 uppercase tracking-wide">{day}</span>
                 </div>
                 
                 {!hoursData[day].isClosed ? (
                   <div className="flex items-center gap-3 flex-grow sm:w-2/3">
                      <input type="time" value={hoursData[day].open} onChange={e => handleHourChange(day, "open", e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none font-bold text-sm text-slate-700" />
                      <span className="text-slate-400 font-bold text-sm">TO</span>
                      <input type="time" value={hoursData[day].close} onChange={e => handleHourChange(day, "close", e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none font-bold text-sm text-slate-700" />
                   </div>
                 ) : (
                   <div className="flex-grow sm:w-2/3 text-sm font-bold text-red-500 uppercase tracking-widest pl-1 sm:text-right sm:pr-4">
                     Closed
                   </div>
                 )}
               </div>
             ))}
          </div>
        )}

        <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full sm:w-auto bg-slate-900 text-white px-10 py-4 rounded-xl font-black text-sm hover:bg-slate-800 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-xl uppercase tracking-widest"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
