"use client";

import { useState } from "react";

export default function MakeOfferButton({ product }: { product: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");

  const safeName = product.name || "this item";
  const currentPrice = Number(product.price) || 0;
  
  // THE MATH HACK: Changed to 0.92 for an 8% discount, rounded to the nearest 1000
  const suggestedOffer = Math.max(1000, Math.round((currentPrice * 0.92) / 1000) * 1000);
  
  // 🔥 UGANDAN PHONE NUMBER STABILIZATION (+256) 🔥
  let cleanPhone = product.sellerPhone ? String(product.sellerPhone).replace(/[^0-9]/g, "") : "";
  // If it starts with 0 and is 10 digits long (e.g., 0772123456) -> turn to 256772123456
  if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
    cleanPhone = "256" + cleanPhone.substring(1);
  } 
  // If it's just 9 digits starting with 7 (e.g., 772123456) -> turn to 256772123456
  else if (cleanPhone.length === 9 && cleanPhone.startsWith("7")) {
    cleanPhone = "256" + cleanPhone;
  }

  const handleSendOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerAmount || !cleanPhone) {
      alert("Seller contact info is missing or offer is empty.");
      return;
    }

    const numericOffer = Number(offerAmount);
    
    // Format the WhatsApp message
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.kabaleonline.com";
    const itemUrl = `${baseUrl}/product/${product.publicId || product.id}`;
    
    const message = `Hello! I'm looking at your *${safeName}* listed for UGX ${currentPrice.toLocaleString()} on Kabale Online.\n\nI have cash ready today, but my budget is *UGX ${numericOffer.toLocaleString()}*. Deal?\n\nLink: ${itemUrl}`;
    
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(waUrl, "_blank");
    
    // Close the modal
    setIsOpen(false);
    setOfferAmount("");
  };

  return (
    <>
      {/* THE HAGGLE PROMPT BOX */}
      <div className="mb-6 bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
        <p className="text-sm font-medium text-amber-900 mb-3 leading-snug">
          Feel this price is high for this product? Make an offer with your price.
        </p>
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full bg-white text-[#D97706] border border-[#D97706] py-2.5 rounded-lg font-bold text-sm hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
        >
          <span className="text-lg">🤝</span> Click to Make an Offer
        </button>
      </div>

      {/* THE MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900">Make an Offer</h3>
                <p className="text-sm text-slate-500 mt-1">Negotiate directly with the seller.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm border border-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendOffer} className="p-6">
              <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Asking Price</span>
                <span className="text-lg font-black text-slate-900">UGX {currentPrice.toLocaleString()}</span>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-900 mb-2">Your Offer (UGX)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">UGX</span>
                  <input 
                    type="number" 
                    required
                    min="1000"
                    placeholder={`e.g. ${suggestedOffer}`}
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    className="w-full pl-14 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-[#D97706] focus:ring-4 focus:ring-amber-50 outline-none text-lg font-bold text-slate-900 transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  💡 Hint: A fair offer is usually around <span className="text-slate-700 font-bold">UGX {suggestedOffer.toLocaleString()}</span>
                </p>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#25D366] text-white py-4 rounded-xl font-black text-lg hover:bg-[#20bd5a] transition-colors shadow-md flex justify-center items-center gap-2"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                Send Offer via WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
