"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Zap, Clock, Trash2, Tag, AlertTriangle, Lock, Unlock, Plus } from "lucide-react";

export default function AdminDealsPage() {
  const [activeDeals, setActiveDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. CAMPAIGN STATE (The Master Timer)
  const [campaignType, setCampaignType] = useState("flash-sales");
  const [endDate, setEndDate] = useState("");
  const [campaignLocked, setCampaignLocked] = useState(false);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // 2. PRODUCT STATE
  const [searchId, setSearchId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [salePrice, setSalePrice] = useState("");

  // ==========================================
  // 🔥 AUTO-SAVE DRAFT PROGRESS (Local Storage)
  // ==========================================
  // Load saved progress when page first opens
  useEffect(() => {
    const savedType = localStorage.getItem("kabale_campaign_type");
    const savedDate = localStorage.getItem("kabale_campaign_date");
    const savedLocked = localStorage.getItem("kabale_campaign_locked");

    if (savedType) setCampaignType(savedType);
    if (savedDate) setEndDate(savedDate);
    if (savedLocked === "true") setCampaignLocked(true);
    
    setIsStateLoaded(true);
  }, []);

  // Save progress automatically whenever it changes
  useEffect(() => {
    if (isStateLoaded) {
      localStorage.setItem("kabale_campaign_type", campaignType);
      localStorage.setItem("kabale_campaign_date", endDate);
      localStorage.setItem("kabale_campaign_locked", campaignLocked.toString());
    }
  }, [campaignType, endDate, campaignLocked, isStateLoaded]);

  // Fetch all currently active deals
  const fetchDeals = async () => {
    setLoading(true);
    const q = query(collection(db, "products"), where("isSale", "==", true));
    const snap = await getDocs(q);
    const deals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setActiveDeals(deals);
    setLoading(false);
    return deals;
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // Handle Finding a Product to put on sale
  const handleSearch = async () => {
    try {
      const q = query(collection(db, "products"), where("publicId", "==", searchId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setSelectedProduct({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        alert("Product not found. Please check the ID.");
      }
    } catch (error) {
      console.error(error);
      alert("Error searching for product.");
    }
  };

  // Handle Starting a Deal
  const handleStartDeal = async () => {
    if (!selectedProduct || !salePrice || !endDate) {
      alert("Please ensure the campaign is locked in and a sale price is set.");
      return;
    }
    
    if (Number(salePrice) >= Number(selectedProduct.price)) {
      alert("Sale price must be strictly lower than the current price!");
      return;
    }

    try {
      const docRef = doc(db, "products", selectedProduct.id);
      await updateDoc(docRef, {
        originalPrice: Number(selectedProduct.price), 
        price: Number(salePrice),                     
        isSale: true,
        campaignType: campaignType,
        saleEndDate: new Date(endDate).toISOString(), 
      });
      
      alert(`Success! Added to ${campaignType.replace('-', ' ')}.`);
      setSelectedProduct(null);
      setSearchId("");
      setSalePrice("");
      fetchDeals(); // Refresh table
    } catch (error) {
      console.error(error);
      alert("Error starting deal.");
    }
  };

  // Handle Ending a Single Deal manually
  const handleEndDeal = async (product: any) => {
    if (!window.confirm("Are you sure you want to end this specific deal early?")) return;

    try {
      const docRef = doc(db, "products", product.id);
      await updateDoc(docRef, {
        price: Number(product.originalPrice), 
        originalPrice: null,
        isSale: false,
        campaignType: null,
        saleEndDate: null,
      });
      
      fetchDeals(); 
    } catch (error) {
      console.error(error);
      alert("Error ending deal.");
    }
  };

  // EMERGENCY KILL SWITCH 
  const handleEmergencyStop = async () => {
    if (activeDeals.length === 0) return;
    const confirmed = window.confirm(
      "🚨 EMERGENCY STOP 🚨\n\nAre you absolutely sure you want to instantly end ALL active deals?\n\nThis will immediately restore the original prices for every item currently on sale."
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);
      activeDeals.forEach((deal) => {
        const docRef = doc(db, "products", deal.id);
        batch.update(docRef, {
          price: Number(deal.originalPrice), 
          originalPrice: null,
          isSale: false,
          campaignType: null,
          saleEndDate: null,
        });
      });
      await batch.commit(); 
      alert("All deals have been successfully terminated.");
      setCampaignLocked(false); // Automatically unlock so you can start fresh
      fetchDeals(); 
    } catch (error) {
      console.error("Emergency stop failed:", error);
      alert("Critical Error: Failed to stop all deals.");
      setLoading(false);
    }
  };

  // Don't render until state is loaded to prevent hydration errors
  if (!isStateLoaded) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-black flex items-center gap-2 text-slate-800">
          <Zap className="text-[#FF6A00]" /> Campaign Manager
        </h1>
        
        {/* EMERGENCY STOP BUTTON */}
        <button 
          onClick={handleEmergencyStop}
          disabled={activeDeals.length === 0 || loading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-black uppercase text-xs tracking-widest px-6 py-3 rounded-md flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <AlertTriangle className="w-4 h-4" />
          Stop All Deals
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        
        {/* ========================================== */}
        {/* STEP 1: CAMPAIGN CONFIGURATION (LEFT)        */}
        {/* ========================================== */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
            1. Campaign Setup
          </h2>
          
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Select Campaign</label>
              <select 
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value)}
                disabled={campaignLocked}
                className="w-full border border-slate-300 rounded-md px-4 py-2.5 outline-none focus:border-[#FF6A00] font-bold bg-white disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
              >
                <option value="flash-sales">Flash Sales</option>
                <option value="weekend-deals">Weekend Deals</option>
                <option value="clearance">Clearance Sale</option>
                <option value="student-deals">Student Deals</option>
                <option value="mega-sale">Mega Sale</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Master End Date</label>
              <input 
                type="datetime-local" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={campaignLocked}
                className="w-full border border-slate-300 rounded-md px-4 py-2.5 outline-none focus:border-[#FF6A00] font-bold text-slate-700 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
              />
            </div>

            {!campaignLocked ? (
              <button 
                onClick={() => {
                  if (!endDate) return alert("Please set an end date first.");
                  setCampaignLocked(true);
                }}
                className="bg-slate-900 text-white font-black uppercase tracking-widest py-3 rounded-md mt-2 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" /> Lock Campaign
              </button>
            ) : (
              <button 
                onClick={() => setCampaignLocked(false)}
                className="bg-slate-100 text-slate-600 border border-slate-200 font-black uppercase tracking-widest py-3 rounded-md mt-2 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" /> Edit Campaign
              </button>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* STEP 2: ADD PRODUCTS TO CAMPAIGN (RIGHT)   */}
        {/* ========================================== */}
        <div className={`lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-opacity duration-300 ${!campaignLocked ? 'opacity-50 pointer-events-none grayscale-[50%]' : 'opacity-100'}`}>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
            2. Add Products to <span className="text-[#FF6A00]">{campaignType.replace('-', ' ')}</span>
          </h2>
          
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Enter Product Public ID..." 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1 border border-slate-300 rounded-md px-4 py-3 outline-none focus:border-[#FF6A00] font-medium"
            />
            <button onClick={handleSearch} className="bg-slate-900 text-white px-8 py-3 rounded-md font-bold hover:bg-slate-800 transition-colors">
              Search
            </button>
          </div>

          {selectedProduct && (
            <div className="bg-orange-50 border border-[#FF6A00]/20 rounded-lg p-5 flex flex-col sm:flex-row gap-6 items-center animate-in fade-in">
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6A00]">Selected Product</span>
                <p className="font-bold text-lg text-slate-800 leading-tight mb-1">{selectedProduct.name || selectedProduct.title}</p>
                <p className="text-sm font-medium text-slate-500">
                  Current Price: <span className="line-through">UGX {Number(selectedProduct.price).toLocaleString()}</span>
                </p>
              </div>
              
              <div className="flex items-end gap-3 w-full sm:w-auto">
                <div className="flex-1 sm:w-48">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Discount Price</label>
                  <input 
                    type="number" 
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-4 py-2.5 outline-none focus:border-[#FF6A00] font-black text-slate-900"
                    placeholder="e.g. 90000"
                  />
                </div>
                
                <button 
                  onClick={handleStartDeal}
                  className="bg-[#FF6A00] text-white font-black uppercase tracking-widest px-6 py-2.5 h-[42px] rounded-md hover:bg-[#e65f00] transition-colors shadow-sm flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* 3. ACTIVE DEALS TABLE                      */}
      {/* ========================================== */}
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" /> Currently Active Deals ({activeDeals.length})
      </h2>
      
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Loading active campaigns...</div>
        ) : activeDeals.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">No active deals running right now.</div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] tracking-widest text-slate-500 font-black">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Campaign</th>
                <th className="px-6 py-4">Original Price</th>
                <th className="px-6 py-4 text-[#FF6A00]">Sale Price</th>
                <th className="px-6 py-4">Ends On</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeDeals.map((deal) => {
                const discount = Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100);
                return (
                  <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 max-w-[200px] sm:max-w-[300px] truncate">
                      {deal.name || deal.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-orange-100 text-[#FF6A00] px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">
                        {deal.campaignType?.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 line-through font-medium">
                      UGX {Number(deal.originalPrice).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 flex items-center gap-2">
                      UGX {Number(deal.price).toLocaleString()}
                      <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-black">-{discount}%</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                      {new Date(deal.saleEndDate).toLocaleString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleEndDeal(deal)}
                        className="text-red-500 hover:text-white bg-red-50 hover:bg-red-500 p-2 rounded-md transition-colors"
                        title="End deal and restore original price"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
