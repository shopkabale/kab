"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; 
import Link from "next/link";

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
  
  // NEW: Track the success state and the ID of the new request
  const [successData, setSuccessData] = useState<{ id: string, item: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    itemNeeded: "",
    budget: "",
    category: "Electronics",
    buyerName: "",
    buyerPhone: "",
  });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const docRef = await addDoc(collection(db, "item_requests"), {
        ...formData,
        createdAt: serverTimestamp(),
      });

      setRequests([{ 
        id: docRef.id, 
        ...formData, 
        createdAt: { toDate: () => new Date() } 
      } as unknown as ItemRequest, ...requests]);

      // Instead of closing the modal, trigger the Success Screen!
      setSuccessData({ id: docRef.id, item: formData.itemNeeded });
      setFormData({ itemNeeded: "", budget: "", category: "Electronics", buyerName: "", buyerPhone: "" });
    } catch (error) {
      alert("Failed to post request.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (id: string) => {
    const url = `https://www.okaynotice.com/requests/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareToWhatsApp = (req: ItemRequest) => {
    const url = `https://www.okaynotice.com/requests/${req.id}`;
    const text = `I am looking for a ${req.itemNeeded} on Okay Notice! Budget: UGX ${Number(req.budget).toLocaleString()}. Know anyone selling? Check it out here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
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
            onClick={() => { setIsModalOpen(true); setSuccessData(null); }}
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
          <p className="text-slate-600 font-medium">No active requests right now. Be the first to ask!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => {
            const dateStr = req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : "Just now";
            const whatsappLink = `https://wa.me/${req.buyerPhone.replace(/[^0-9]/g, '')}?text=Hi%20${req.buyerName},%20I%20saw%20your%20request%20for%20"${req.itemNeeded}"%20on%20Okay%20Notice.%20I%20have%20this%20item!`;

            return (
              <div key={req.id} className="flex flex-col bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
                <span className="text-xs font-bold text-[#D97706] bg-amber-50 px-3 py-1 rounded-full uppercase mb-4 inline-block self-start">
                  {req.category}
                </span>
                <h3 className="font-bold text-xl text-slate-900 mb-2 leading-tight">{req.itemNeeded}</h3>
                
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Max Budget</p>
                  <p className="font-black text-emerald-600 text-lg">UGX {Number(req.budget).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mb-6">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                    {req.buyerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{req.buyerName}</p>
                    <p className="text-xs text-slate-500">{dateStr}</p>
                  </div>
                </div>

                <div className="mt-auto flex gap-2">
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-[#25D366] text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-colors text-sm">
                    I Have This
                  </a>
                  <button onClick={() => shareToWhatsApp(req)} className="px-4 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm flex items-center justify-center">
                    Share
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Form OR Success Screen */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-3xl font-bold z-10">&times;</button>
            
            {successData ? (
              // VIRAL SUCCESS SCREEN
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Request Posted!</h2>
                <p className="text-slate-600 mb-8">Your request is now live on the board.</p>
                
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">What's Next?</h3>
                  <p className="text-sm text-slate-500 mb-4">Share this directly to your WhatsApp Status or friends to find sellers 10x faster!</p>
                  
                  <button 
                    onClick={() => copyToClipboard(successData.id)}
                    className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold mb-3 hover:border-[#D97706] hover:text-[#D97706] transition-colors flex items-center justify-center gap-2"
                  >
                    {copied ? "✅ Link Copied!" : "📋 Tap to Copy Link"}
                  </button>
                  
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(`I am looking for a ${successData.item} on Okay Notice! Know anyone selling? Check it out here: https://www.okaynotice.com/requests/${successData.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block bg-[#25D366] text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-colors shadow-md"
                  >
                    📱 Share to WhatsApp
                  </a>
                </div>
                
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold hover:text-slate-600 text-sm">
                  Close and return to board
                </button>
              </div>
            ) : (
              // SUBMISSION FORM
              <div className="p-6 md:p-8">
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
                  <button type="submit" disabled={submitting} className="w-full bg-[#D97706] text-white py-4 rounded-xl font-bold mt-4 hover:bg-amber-600 disabled:opacity-50">
                    {submitting ? "Posting..." : "Post Request"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}