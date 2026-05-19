"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Image from "next/image";
import { Zap, Clock, Trash2, Search, Tag } from "lucide-react";

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
    // In production, you might want to query by name or just use the document ID
    try {
      // Simplified: Assume searchId is the exact document ID for now
      const q = query(collection(db, "products"), where("publicId", "==", searchId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setSelectedProduct({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        alert("Product not found");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle Starting a Deal
  const handleStartDeal = async () => {
    if (!selectedProduct || !salePrice || !endDate) return;
    
    if (Number(salePrice) >= Number(selectedProduct.price)) {
      alert("Sale price must be lower than the current price!");
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
      fetchDeals(); // Refresh table
    } catch (error) {
      alert("Error starting deal.");
    }
  };

  // Handle Ending a Deal manually
  const handleEndDeal = async (product: any) => {
    if (!window.confirm("Are you sure you want to end this deal early?")) return;

    try {
      const docRef = doc(db, "products", product.id);
      await updateDoc(docRef, {
        price: Number(product.originalPrice), // Restore original price
        originalPrice: null,
        isSale: false,
        campaignType: null,
        saleEndDate: null,
      });
      
      fetchDeals(); // Refresh table
    } catch (error) {
      alert("Error ending deal.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-black mb-8 flex items-center gap-2">
        <Zap className="text-[#FF6A00]" /> Campaign & Deals Manager
      </h1>

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
            placeholder="Enter Product ID or Public ID..." 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 border border-slate-300 rounded-md px-4 py-2"
          />
          <button onClick={handleSearch} className="bg-slate-900 text-white px-6 py-2 rounded-md font-bold hover:bg-slate-800">
            Find Product
          </button>
        </div>

        {selectedProduct && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-bold text-lg mb-1">{selectedProduct.name || selectedProduct.title}</p>
              <p className="text-slate-500 mb-4">Current Price: UGX {Number(selectedProduct.price).toLocaleString()}</p>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">New Sale Price (UGX)</label>
                  <input 
                    type="number" 
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-4 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Campaign Type</label>
                  <select 
                    value={campaignType}
                    onChange={(e) => setCampaignType(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-4 py-2"
                  >
                    <option value="flash-sales">Flash Sales</option>
                    <option value="weekend-deals">Weekend Deals</option>
                    <option value="clearance">Clearance Sale</option>
                    <option value="student-deals">Student Deals</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">End Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-4 py-2"
                  />
                </div>

                <button 
                  onClick={handleStartDeal}
                  className="bg-[#FF6A00] text-white font-black uppercase py-3 rounded-md mt-2 hover:bg-[#e65f00] transition-colors"
                >
                  Activate Deal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 2. ACTIVE DEALS TABLE                      */}
      {/* ========================================== */}
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" /> Currently Active Deals
      </h2>
      
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Loading active campaigns...</div>
        ) : activeDeals.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-bold">No active deals running right now.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Campaign</th>
                <th className="px-6 py-4">Original Price</th>
                <th className="px-6 py-4 text-[#FF6A00]">Sale Price</th>
                <th className="px-6 py-4">Ends On</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeDeals.map((deal) => {
                const discount = Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100);
                return (
                  <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 max-w-[200px] truncate">
                      {deal.name || deal.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-orange-100 text-[#FF6A00] px-2 py-1 rounded text-[10px] font-black uppercase">
                        {deal.campaignType?.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 line-through">
                      UGX {Number(deal.originalPrice).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 flex items-center gap-2">
                      UGX {Number(deal.price).toLocaleString()}
                      <span className="text-red-500 text-[10px]">(-{discount}%)</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {new Date(deal.saleEndDate).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleEndDeal(deal)}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors"
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
