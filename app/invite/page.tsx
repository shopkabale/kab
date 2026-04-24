"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase/client"; 
import { 
  FaWhatsapp, FaCopy, FaCheckCircle, FaWallet, 
  FaShieldAlt, FaInfoCircle, FaBox, FaUserPlus, FaCoins, FaEdit, FaSave, FaLock
} from "react-icons/fa";

export default function InvitePage() {
  const { user, signIn, loading } = useAuth();
  
  // States
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [aliasInput, setAliasInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "256740373021";

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D97706]"></div>
      </div>
    );
  }

  // ==========================================
  // LOGGED-OUT VIEW (Mobile-Optimized Landing)
  // ==========================================
  if (!user) {
    return (
      <div className="w-full min-h-screen bg-slate-50 overflow-x-hidden">
        {/* Mobile max-w-[480px], expanding to max-w-2xl on md screens */}
        <div className="max-w-[480px] md:max-w-2xl mx-auto p-4 pt-8 md:pt-12 flex flex-col w-full">
          
          <div className="text-center mb-8 w-full">
            <span className="text-[#D97706] font-bold tracking-widest uppercase text-[11px] mb-2 block">
              Partner Program
            </span>
            <h1 className="text-3xl font-black text-slate-900 mb-3 leading-tight">
              Invite Friends.<br/>Earn Real Cash.
            </h1>
            <p className="text-slate-600 text-[15px] px-2 w-full">
              Get paid <strong className="text-slate-900">3,000 UGX</strong> directly to your Mobile Money for every new customer you bring.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6 w-full">
            <h2 className="font-bold text-lg text-slate-900 mb-5 border-b border-slate-100 pb-3">
              How it works
            </h2>
            
            <div className="space-y-6 w-full">
              <div className="flex gap-3 items-start w-full min-w-0">
                <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaUserPlus className="text-slate-600 text-[16px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-[15px]">1. Share your link</h3>
                  <p className="text-[13px] text-slate-600 mt-1 leading-snug">Share your partner link on WhatsApp or with friends.</p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start w-full min-w-0">
                <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaBox className="text-slate-600 text-[16px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-[15px]">2. Friend buys an item</h3>
                  <p className="text-[13px] text-slate-600 mt-1 leading-snug">They order any <strong className="text-slate-800">Official Item</strong> (First-time buyers only).</p>
                </div>
              </div>

              <div className="flex gap-3 items-start w-full min-w-0">
                <div className="bg-[#D97706]/10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCoins className="text-[#D97706] text-[16px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-[15px]">3. Get Paid</h3>
                  <p className="text-[13px] text-slate-600 mt-1 leading-snug">Earn 3,000 UGX when it's delivered. Withdraw to MTN/Airtel.</p>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={signIn}
            className="w-full bg-[#D97706] hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-md transition-all text-[16px] flex items-center justify-center"
          >
            Login to Partner Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOGGED-IN VIEW (Mobile-Optimized Dashboard)
  // ==========================================
  
  const referralCode = user.referralCode || "PENDING";
  const referralLink = `https://www.kabaleonline.com/invite/${referralCode}`;
  const balance = user.referralBalance || 0;
  const count = user.referralCount || 0;

  // Has the user permanently locked their custom alias?
  const hasLockedAlias = !!user.referralName;
  const currentDisplayName = user.referralName || user.displayName?.split(' ')[0] || "Kabale User";

  const handleSaveAlias = async () => {
    if (!aliasInput.trim() || aliasInput.length > 20) {
      return alert("Please enter a valid name (max 20 characters).");
    }
    
    const confirmSave = window.confirm(`Are you sure you want to set your name to "${aliasInput.trim()}"?\n\nThis can only be done ONCE and cannot be changed later.`);
    if (!confirmSave) return;

    setIsSavingName(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/users/referral-name", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ referralName: aliasInput })
      });
      
      if (res.ok) {
        // Optimistically update the local user object
        user.referralName = aliasInput.trim(); 
        setEditingName(false);
      } else {
        alert("Failed to save name.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Pre-formatted WhatsApp Messages
  const rawWithdrawMsg = `*Partner Withdrawal Request* 💰\n\n*Email:* ${user.email}\n*Amount:* ${balance.toLocaleString()} UGX\n\n*Action:* Please send my earnings to my Mobile Money.`;
  const rawDiscountMsg = `*Partner Discount Request* 🛍️\n\n*Email:* ${user.email}\n*Balance to Apply:* ${balance.toLocaleString()} UGX\n\n*Action:* I just placed a COD order and want to apply my partner earnings as a discount.`;
  const rawShareMsg = `Hey! 👋\n\nI buy my student supplies and electronics on *Kabale Online*.\n\nUse my invite link to shop safely on campus with *Cash on Delivery*:\n👉 ${referralLink}`;

  return (
    <div className="w-full min-h-screen bg-slate-50 overflow-x-hidden pb-10">
      <div className="max-w-[480px] md:max-w-2xl mx-auto p-4 pt-6 w-full flex flex-col">
        
        <div className="mb-6 border-b border-slate-200 pb-4 w-full">
          <span className="text-[#D97706] font-bold tracking-widest uppercase text-[10px] mb-1 block">
            Partner Dashboard
          </span>
          <h1 className="text-2xl font-black text-slate-900">Refer & Earn</h1>
        </div>

        {/* ============================== */}
        {/* ONE-TIME ALIAS CONFIGURATOR    */}
        {/* ============================== */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-4 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full min-w-0">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900 text-[14px]">Your Display Name</h2>
              <p className="text-[12px] text-slate-500 mt-0.5 leading-tight w-full">
                This appears on your shared links.
              </p>
            </div>
            
            <div className="w-full md:w-auto flex-shrink-0">
              {hasLockedAlias ? (
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100 w-full justify-center md:justify-start">
                  <FaLock className="text-slate-400 text-[12px]" />
                  <span className="font-bold text-slate-700 text-[14px] truncate">{currentDisplayName}</span>
                </div>
              ) : editingName ? (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2 w-full">
                    <input 
                      type="text" 
                      value={aliasInput}
                      onChange={(e) => setAliasInput(e.target.value)}
                      placeholder={currentDisplayName}
                      maxLength={20}
                      className="border border-slate-300 rounded-lg px-3 py-2.5 text-[14px] font-bold text-slate-800 outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] w-full min-w-0"
                    />
                    <button 
                      onClick={handleSaveAlias}
                      disabled={isSavingName || !aliasInput.trim()}
                      className="bg-[#D97706] text-white p-3 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {isSavingName ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaSave />}
                    </button>
                  </div>
                  <p className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                    <FaInfoCircle /> Can only be changed ONCE.
                  </p>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setAliasInput(currentDisplayName);
                    setEditingName(true);
                  }} 
                  className="flex items-center justify-center gap-2 w-full md:w-auto bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <span className="font-bold text-slate-800 text-[14px] truncate max-w-[120px]">{currentDisplayName}</span>
                  <FaEdit className="text-slate-500" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============================== */}
        {/* STATS BOARD                    */}
        {/* ============================== */}
        <div className="grid grid-cols-2 gap-3 mb-6 w-full">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm w-full flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1 w-full min-w-0">
              <FaWallet className="text-[14px] flex-shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-wider truncate w-full">Balance</p>
            </div>
            <p className="text-xl md:text-2xl font-black text-[#D97706] truncate w-full">
              {balance.toLocaleString()} <span className="text-[12px] text-amber-700">UGX</span>
            </p>
          </div>
          
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm w-full flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1 w-full min-w-0">
              <FaUserPlus className="text-[14px] flex-shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-wider truncate w-full">Invites</p>
            </div>
            <p className="text-xl md:text-2xl font-black text-slate-900 truncate w-full">{count}</p>
          </div>
        </div>

        {/* ============================== */}
        {/* LINK & SHARE                   */}
        {/* ============================== */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-6 w-full">
          <h2 className="font-bold text-slate-900 mb-3 text-[14px]">Your Tracking Link</h2>
          
          <div className="flex flex-col gap-3 w-full min-w-0">
            {/* break-all securely stops the URL from overflowing the screen width */}
            <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-hidden min-w-0">
              <p className="text-[13px] font-mono text-slate-700 break-all select-all leading-tight">
                {referralLink}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              <button 
                onClick={handleCopy}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl font-bold text-[13px] transition-colors flex items-center justify-center gap-1.5"
              >
                {copied ? <FaCheckCircle className="text-green-500 text-[16px]" /> : <FaCopy className="text-[16px]" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(rawShareMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 text-[13px]"
              >
                <FaWhatsapp className="text-[18px]" /> Share
              </a>
            </div>
          </div>
        </div>

        {/* ============================== */}
        {/* REDEMPTION SECTION             */}
        {/* ============================== */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-6 w-full">
          <h2 className="font-bold text-slate-900 mb-3 text-[14px] border-b border-slate-100 pb-2">Claim Earnings</h2>

          {balance >= 3000 ? (
            <div className="flex flex-col gap-2 w-full">
              <a 
                href={`https://wa.me/${botPhoneNumber}?text=${encodeURIComponent(rawWithdrawMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center text-[13px]"
              >
                Withdraw Mobile Money
              </a>
              <a 
                href={`https://wa.me/${botPhoneNumber}?text=${encodeURIComponent(rawDiscountMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold py-3.5 px-3 rounded-xl transition-all flex items-center justify-center text-[13px]"
              >
                Use as Order Discount
              </a>
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 w-full min-w-0">
              <FaInfoCircle className="text-slate-400 text-[16px] flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-slate-600 leading-tight">
                Minimum withdrawal is <strong className="text-slate-900">3,000 UGX</strong>. Keep sharing your link!
              </p>
            </div>
          )}
        </div>

        {/* ============================== */}
        {/* RULES                          */}
        {/* ============================== */}
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 w-full">
          <p className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[10px]">Program Guidelines</p>
          <ul className="text-[11px] text-slate-600 space-y-1.5 pl-3 list-disc">
            <li><strong className="text-slate-800">Official Items Only:</strong> Rewards apply only to official Kabale Online stock.</li>
            <li><strong className="text-slate-800">First Order Only:</strong> The friend must be a brand new buyer.</li>
            <li><strong className="text-slate-800">Completed Orders:</strong> Cash is credited the moment the delivery is marked successful.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
