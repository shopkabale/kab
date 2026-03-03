"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Your client Firebase config

interface ItemRequest {
  id: string;
  itemNeeded: string;
  budget: string;
  category: string;
  buyerName: string;
  buyerPhone: string;
  createdAt: any;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    itemNeeded: "",
    budget: "",
    category: "Electronics",
    buyerName: "",
    buyerPhone: "",
  });

  // Fetch Requests (Filtered by last 7 days!)
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // 1. Calculate the date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 2. Only fetch requests created AFTER 7 days ago
        const q = query(
          collection(db, "item_requests"), 
          where("createdAt", ">=", sevenDaysAgo),
          orderBy("createdAt", "desc")
        );
        
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItemRequest));
        setRequests(data);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // Handle Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Save to Firebase
      const docRef = await addDoc(collection(db, "item_requests"), {
        ...formData,
        createdAt: serverTimestamp(),
      });

      // Instantly add to UI
      setRequests([{ 
        id: docRef.id, 
        ...formData, 
        createdAt: { toDate: () => new Date() } // Mock timestamp for immediate UI update
      } as unknown as ItemRequest, ...requests]);

      setIsModalOpen(false);
      setFormData({ itemNeeded: "", budget: "", category: "Electronics", buyerName: "", buyerPhone: "" });
      alert("Request posted successfully! It will stay live on the board for 7 days.");
    } catch (error) {
      alert("Failed to post request. Please ensure your Firebase Rules allow creates.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 min-h-screen">
      
      {/* Header Section */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 mb-10 text-center relative overflow-hidden shadow-lg">
        <div className="relative z-10">
          <span className="bg-[#D97706] text-white px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest mb-4 inline-block">
            Buyer Board
          </span>
          <h1 className="text-3xl sm:text-5xl font-black mb-4">Can't find what you need?</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
            Post what you are looking for and your maximum budget. Sellers in Kabale will contact you directly with offers!
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#D97706] hover:bg-amber-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105"
          >
            📢 Post a Request
          </button>
        </div>
      </div>

      {/* Feed Section */}
      <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-900">Recent Requests</h2>
        <span className="text-slate-500 font-medium text-sm">{requests.length} active requests</span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Loading buyer requests...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <span className="text-4xl block mb-3">👀</span>
          <p className="text-slate-600 font-medium">No active requests right now. Be the first to ask for an item!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => {
            const dateStr = req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : "Just now";
            const whatsappLink = `https://wa.me/${req.buyerPhone.replace(/[^0-9]/g, '')}?text=Hi%20${req.buyerName},%20I%20saw%20your%20request%20for%20"${req.itemNeeded}"%20on%20Okay%20Notice.%20I%20have%20it!`;

            return (
              <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
                <div className="absolute -top-3 -right-3 bg-red-100 text-red-600 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm border border-red-200">
                  🔥
                </div>
                <span className="text-xs font-bold text-[#D97706] bg-amber-50 px-3 py-1 rounded-full uppercase mb-4 inline-block">
                  {req.category}
                </span>
                <h3 className="font-bold text-xl text-slate-900 mb-2 leading-tight">{req.itemNeeded}</h3>
                
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Max Budget</p>
                  <p className="font-black text-emerald-600 text-lg">UGX {Number(req.budget).toLocaleString()}</p>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                      {req.buyerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{req.buyerName}</p>
                      <p className="text-xs text-slate-500">{dateStr}</p>
                    </div>
                  </div>
                </div>

                <a 
                  href={whatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-[#25D366] text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-colors"
                >
                  Message Seller (WhatsApp)
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-2xl font-bold"
            >
              ×
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Request an Item</h2>
            <p className="text-slate-500 text-sm mb-6">Tell the community what you're looking for.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">What do you need?</label>
                <input type="text" required value={formData.itemNeeded} onChange={e => setFormData({...formData, itemNeeded: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-[#D97706]" placeholder="e.g. iPhone 11 Pro Max" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-[#D97706]">
                    <option>Electronics</option>
                    <option>Fashion</option>
                    <option>Student Market</option>
                    <option>Services</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Budget (UGX)</label>
                  <input type="number" required value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-[#D97706]" placeholder="800000" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Your Name</label>
                  <input type="text" required value={formData.buyerName} onChange={e => setFormData({...formData, buyerName: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-[#D97706]" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp No.</label>
                  <input type="tel" required value={formData.buyerPhone} onChange={e => setFormData({...formData, buyerPhone: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-[#D97706]" placeholder="077..." />
                </div>
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold mt-4 hover:bg-slate-800 disabled:opacity-50">
                {submitting ? "Posting..." : "Post Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}