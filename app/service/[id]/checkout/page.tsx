"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { FaArrowLeft, FaShieldAlt, FaLock } from "react-icons/fa";

export default function ServiceCheckoutPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [service, setService] = useState<any>(null);

  // Form States
  const [buyerName, setBuyerName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // 1. Auto-fill name if logged in
  useEffect(() => {
    if (user?.displayName) setBuyerName(user.displayName);
  }, [user]);

  // 2. Fetch the exact service details securely from Firebase
  useEffect(() => {
    const fetchService = async () => {
      try {
        const docRef = doc(db, "products", params.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setService({ id: snap.id, ...snap.data() });
        }
      } catch (error) {
        console.error("Error fetching service:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [params.id]);

  // ==========================================
  // SERVICE DEPOSIT CHECKOUT LOGIC
  // ==========================================
  const executeServiceCheckout = async () => {
    if (!buyerName.trim()) return alert("Please provide your name.");

    const cleanPhone = contactPhone.replace(/\D/g, ""); 
    if (cleanPhone.length < 10) {
      return alert("Please enter a valid MTN/Airtel number.");
    }

    setProcessing(true);

    const getCookie = (name: string) => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    const referralCode = getCookie("kabale_ref");

    // 🔥 FINANCIAL MATH: Enforce 1,000 UGX Minimum for LivePay
    const basePrice = Number(service.price) || 0;
    const calculatedDeposit = Math.round(basePrice * 0.10); 
    const commitmentDeposit = calculatedDeposit < 1000 ? 1000 : calculatedDeposit; 

    // WE FORMAT THE DEPOSIT AS A SINGLE CART ITEM FOR YOUR BACKEND
    const masterOrderPayload = {
      buyerName: buyerName.trim(),
      contactPhone: cleanPhone,
      userId: user ? user.id : "GUEST",
      referralCodeUsed: referralCode || null, 
      cartItems: [
        {
          productId: service.id,
          // 🔥 The Success Page will look for "Booking Deposit:" in this name to trigger the unlock
          name: `Booking Deposit: ${service.title}`, 
          price: commitmentDeposit, 
          quantity: 1,
          sellerId: service.sellerId || "SYSTEM", 
          sellerPhone: service.sellerPhone || "", 
          image: service.images?.[0] || ""
          // ❌ REMOVED isServiceBooking flag to bypass LivePay strict validation crash
        }
      ]
    };

    try {  
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(masterOrderPayload),
      });

      // We read the raw text first in case the API crashes and returns HTML
      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (err) {
        console.error("Payment Gateway returned non-JSON:", rawText);
        alert("Payment gateway error. Please try again later.");
        setProcessing(false);
        return;
      }

      if (res.ok) {
        // Redirect to your existing LivePay waiting screen
        router.push(`/checkout/waiting?orderId=${data.orderId}`);
      } else {
        alert(data.error || "Payment initiation failed. Please try again.");
        setProcessing(false);
      }
    } catch (error) {  
      console.error(error);  
      alert("Something went wrong with the connection.");  
      setProcessing(false);
    } 
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D97706] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Service Not Found</h1>
        <Link href="/category/repairs-services" className="text-[#D97706] font-bold">Go Back</Link>
      </div>
    );
  }

  // 🔥 FINANCIAL MATH: Ensure UI matches the 1,000 UGX rule
  const basePrice = Number(service.price) || 0;
  const calculatedDeposit = Math.round(basePrice * 0.10);
  const commitmentDeposit = calculatedDeposit < 1000 ? 1000 : calculatedDeposit;
  const remainingBalance = Math.max(0, basePrice - commitmentDeposit);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 bg-white min-h-screen relative">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Secure Booking</h1>
        <button onClick={() => router.back()} className="text-sm font-bold text-slate-500 hover:text-[#D97706] flex items-center gap-2">
          <FaArrowLeft /> Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* LEFT: Form */}
        <div className="order-2 md:order-1">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FaLock className="text-[#D97706]" /> Payment Details
            </h2>

            <div className="space-y-5">
              <div>  
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Your Name</label>  
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. John Doe" 
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#D97706] bg-white" 
                  value={buyerName} 
                  onChange={e => setBuyerName(e.target.value)} 
                />  
              </div>  

              <div>  
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Mobile Money Number
                </label>  
                <input 
                  required 
                  type="tel" 
                  placeholder="e.g. 077... or 075..." 
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#D97706] bg-white" 
                  value={contactPhone} 
                  onChange={e => setContactPhone(e.target.value)} 
                />
                <p className="text-xs text-slate-500 mt-2">Make sure your phone is nearby to enter your PIN.</p>
              </div>

              <button 
                onClick={executeServiceCheckout} 
                disabled={processing || !contactPhone.trim() || !buyerName.trim()} 
                className="w-full bg-[#D97706] text-white py-4 rounded-xl font-black text-lg hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
              >  
                {processing ? "Connecting to MTN/Airtel..." : `Pay UGX ${commitmentDeposit.toLocaleString()} Now`}  
              </button> 
            </div>
          </div>
        </div>

        {/* RIGHT: Summary */}
        <div className="order-1 md:order-2">
          <div className="bg-white border-2 border-[#D97706] rounded-2xl p-6 shadow-xl sticky top-24">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">You are booking:</h3>

            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                <img src={service.images?.[0] || "/placeholder.png"} alt="Service" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 line-clamp-2 leading-tight">{service.title}</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">Provider: {service.sellerName || "Verified Expert"}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-slate-600 font-medium">
                <span>Est. Base Price</span>
                <span>UGX {basePrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center py-3 px-4 bg-amber-50 rounded-xl border border-amber-200 text-[#D97706]">
                <span className="font-bold text-sm">Deposit (Due Now)</span>
                <span className="font-black text-lg">UGX {commitmentDeposit.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm text-slate-500 font-medium pt-3 border-t border-slate-100">
                <span>Balance (Pay after service)</span>
                <span className="font-bold text-slate-800">UGX {remainingBalance.toLocaleString()}</span>
              </div>
            </div>

            {/* 🔒 SECURE PAYMENT BADGE */}
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider font-bold text-green-700 bg-green-50 py-3 rounded-xl border border-green-200">
              <FaShieldAlt className="text-green-600 text-sm" />
              Secure Payment via Kabale Online
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
