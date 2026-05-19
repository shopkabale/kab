"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Zap, Clock, Trash2, Tag, AlertTriangle } from "lucide-react";

export default function AdminDealsPage() {
  const [activeDeals, setActiveDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for creating a new deal
  const [searchId, setSearchId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [salePrice, setSalePrice] = useState("");
  const [campaignType, setCampaignType] = useState("flash-sales");
  const [endDate, setEndDate] = useState("");

  // Fetch all currently active deals
  const fetchDeals = async () => {
    setLoading(true);
    const q = query(collection(db, "products"), where("isSale", "==", true));
    const snap = await getDocs(q);
    setActiveDeals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
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
      alert("Please fill in all fields.");
      return;
    }
    
    if (Number(salePrice) >= Number(selectedProduct.price)) {
      alert("Sale price must be strictly lower than the current price!");
      return;
    }

    try {
      const docRef = doc(db, "products", selectedProduct.id);
      await updateDoc(docRef, {
        originalPrice: Number(selectedProduct.price), // Save the old price
        price: Number(salePrice),                     // Overwrite with new price
        isSale: true,
        campaignType: campaignType,
        saleEndDate: new Date(endDate).toISOString(), // Save as ISO string for the timer
      });
      
      alert("Deal activated successfully!");
      setSelectedProduct(null);
      setSearchId("");
      setSalePrice("");
      setEndDate("");
      fetchDeals(); 
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
        price: Number(product.originalPrice), // Restore original price
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

  // ==========================================
  // 🚨 THE EMERGENCY KILL SWITCH 
  // ==========================================
  const handleEmergencyStop = async () => {
    if (activeDeals.length === 0) {
      alert("There are no active deals to stop.");
      return;
    }

    const confirmed = window.confirm(
      "🚨 EMERGENCY STOP 🚨\n\nAre you absolutely sure you want to instantly end ALL active deals?\n\nThis will immediately restore the original prices for every item currently on sale across the entire platform."
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      // Use writeBatch to update all documents simultaneously
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

      await batch.commit(); // Fires all updates at once
      
      alert("All deals have been successfully terminated. Original prices are restored.");
      fetchDeals(); 
    } catch (error) {
      console.error("Emergency stop failed:", error);
      alert("Critical Error: Failed to stop all deals. Check console.");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-black flex items-center gap-2 text-slate-800">
          <Zap className="text-[#FF6A00]" /> Campaign & Deals Manager
        </h1>
        
        {/* EMERGENCY STOP BUTTON */}
        <button 
          onClick={handleEmergencyStop}
          disabled={activeDeals.length === 0 || loading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-black uppercase text-xs tracking-widest px-6 py-3 rounded-md flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <AlertTriangle className="w-4 h-4" />
          Emergency Stop All Deals
        </button>
      </div>

      {/* ========================================== */}
      {/* 1. CREATE A DEAL SECTION                   */}
      {/* ========================================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-10">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4" /> Create New Deal
        </h2>
        
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Enter Product Public ID..." 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 border border-slate-300 rounded-md px-4 py-3 outline-none focus:border-[#FF6A00] transition-colors font-medium"
          />
          <button onClick={handleSearch} className="bg-slate-900 text-white px-8 py-3 rounded-md font-bold hover:bg-slate-800 transition-colors">
            Find Product
          </button>
        </div>

        {selectedProduct && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Product</span>
              <p className="font-bold text-lg text-slate-800 leading-tight">{selectedProduct.name || selectedProduct.title}</p>
              <p className="text-sm font-medium text-slate-500 mb-2">
                Current Price: <span className="font-black text-slate-900">UGX {Number(selectedProduct.price).toLocaleString()}</span>
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">New Sale Price (UGX)</label>
                <input 
                  type="number" 
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-4 py-2.5 outline-none focus:border-[#FF6A00] font-bold"
                  placeholder="e.g. 90000"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Campaign Type</label>
                <select 
                  value={campaignType}
                  onChange={(e) => setCampaignType(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-4 py-2.5 outline-none focus:border-[#FF6A00] font-bold bg-white"
                >
                  <option value="flash-sales">Flash Sales</option>
                  <option value="weekend-deals">Weekend Deals</option>
                  <option value="clearance">Clearance Sale</option>
                  <option value="student-deals">Student Deals</option>
                  <option value="mega-sale">Mega Sale</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">End Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-4 py-2.5 outline-none focus:border-[#FF6A00] font-bold text-slate-700"
                />
              </div>

              <button 
                onClick={handleStartDeal}
                className="bg-[#FF6A00] text-white font-black uppercase tracking-widest py-3.5 rounded-md mt-2 hover:bg-[#e65f00] transition-colors shadow-sm active:scale-[0.98]"
              >
                Activate Deal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 2. ACTIVE DEALS TABLE                      */}
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
