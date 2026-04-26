"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase/config";
import { 
  FaWhatsapp, FaCopy, FaCheckCircle, FaWallet, 
  FaShieldAlt, FaInfoCircle, FaBox, FaUserPlus, FaCoins, FaEdit, FaSave, FaLock, FaExclamationTriangle, FaTimes, FaLink
} from "react-icons/fa";

export default function InvitePage() {
  const { user, signIn, loading } = useAuth();

  // Core States (Updated 'copied' to handle specific link IDs)
  const [copied, setCopied] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [aliasInput, setAliasInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false); 

  // Phone Number & Security States
  const [phoneInput, setPhoneInput] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasDismissedModal, setHasDismissedModal] = useState(false);

  // 🚀 Creator Studio (Product Catalog) States
  const [promotableProducts, setPromotableProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "256740373021";

  // Trigger the modal if they log in and have no phone number
  useEffect(() => {
    if (loading) return; 
    const sessionDismissed = sessionStorage.getItem("phone_modal_dismissed");
    if (user && !user.phone && !hasDismissedModal && !sessionDismissed) {
      setShowPhoneModal(true);
    }
  }, [user, loading, hasDismissedModal]);

  // 🚀 Fetch Official Products for the Creator Studio (25 per page)
  useEffect(() => {
    if (!user) return;
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await fetch(`/api/affiliate/products?page=${currentPage}`);
        if (res.ok) {
          const data = await res.json();
          setPromotableProducts(data.products || []);
          setHasMore(data.hasMore);
        }
      } catch (error) {
        console.error("Failed to load affiliate products", error);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [user, currentPage]);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      await signIn();
    } catch (error) {
      console.error(error);
      setIsLoggingIn(false); 
    }
  };

  const handleSkipModal = () => {
    setShowPhoneModal(false);
    setHasDismissedModal(true);
    sessionStorage.setItem("phone_modal_dismissed", "true");
  };

  // 🚀 Dynamic Commission Calculator
  const calculateCommission = (price: number) => {
    if (price < 5000) return 300;
    return Math.min(Math.floor(price * 0.10), 3000);
  };

  // 🚀 Multi-purpose Copy Link Function
  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  // ==========================================
  // ENHANCED LOADING STATE
  // ==========================================
  if (loading || isLoggingIn) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="relative flex items-center justify-center mb-5">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-[#D97706]"></div>
          <FaShieldAlt className="absolute text-[#D97706] text-xl animate-pulse" />
        </div>
        <h2 className="text-slate-900 font-black text-lg md:text-xl mb-1">Authenticating Partner...</h2>
        <p className="text-slate-500 text-sm animate-pulse text-center">Loading your creator dashboard</p>
      </div>
    );
  }

  // ==========================================
  // LOGGED-OUT VIEW (Marketing Pitch)
  // ==========================================
  if (!user) {
    return (
      <div className="w-full min-h-screen bg-slate-50 overflow-x-hidden">
        <div className="max-w-[480px] md:max-w-2xl mx-auto p-4 pt-8 md:pt-12 flex flex-col w-full">

          <div className="text-center mb-8 w-full">
            <span className="text-[#D97706] font-black tracking-widest uppercase text-[11px] mb-2 block">
              Creator & Affiliate Network
            </span>
            <h1 className="text-3xl font-black text-slate-900 mb-3 leading-tight">
              Promote Kabale.<br/>Earn Real Cash.
            </h1>
            <p className="text-slate-500 text-[15px] px-2 w-full font-medium">
              Earn up to <strong className="text-slate-900">3,000 UGX</strong> directly to your Mobile Money every time someone buys using your link.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6 w-full">
            <h2 className="font-black text-lg text-slate-900 mb-5 border-b border-slate-100 pb-3">
              How the network works
            </h2>

            <div className="space-y-6 w-full">
              <div className="flex gap-3 items-start w-full min-w-0">
                <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaLink className="text-slate-400 text-[16px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 text-[15px]">1. Get your custom links</h3>
                  <p className="text-[13px] text-slate-500 mt-1 leading-snug">Browse the Creator Studio and generate affiliate links for specific items.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start w-full min-w-0">
                <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaWhatsapp className="text-slate-400 text-[16px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 text-[15px]">2. Share with your audience</h3>
                  <p className="text-[13px] text-slate-500 mt-1 leading-snug">Post your links on WhatsApp statuses, class groups, or to friends directly.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start w-full min-w-0">
                <div className="bg-amber-50 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCoins className="text-[#D97706] text-[16px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 text-[15px]">3. Earn Instant Commissions</h3>
                  <p className="text-[13px] text-slate-500 mt-1 leading-snug">Make 10% on their cart value (up to 3k). Payouts unlock the moment the order is delivered.</p>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSignIn}
            disabled={isLoggingIn}
            className="w-full bg-[#D97706] hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-md transition-all text-[16px] flex items-center justify-center disabled:opacity-70"
          >
            {isLoggingIn ? "Authenticating..." : "Join the Partner Network"}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOGGED-IN VIEW (Creator Dashboard)
  // ==========================================

  const referralCode = user.referralCode || "PENDING";
  const referralLink = `https://www.kabaleonline.com/invite/${referralCode}`;
  const balance = user.referralBalance || 0;
  const count = user.referralCount || 0;

  const hasLockedAlias = !!user.referralName;
  const currentDisplayName = user.referralName || user.displayName?.split(' ')[0] || "Kabale User";

  // 7-DAY CONFIRMATION LOGIC
  const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
  const needsPhoneConfirmation = user?.phone && (
    !user.phoneUpdatedAt || (Date.now() - user.phoneUpdatedAt > SEVEN_DAYS_IN_MS)
  );

  const handleSavePhone = async () => {
    if (!user) return; 
    if (!phoneInput.trim() || phoneInput.length < 9) {
      return alert("Please enter a valid WhatsApp number (e.g. 07XXXXXXXX)");
    }

    setIsSavingPhone(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/users/phone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ phone: phoneInput })
      });

      if (res.ok) {
        user.phone = phoneInput.trim(); 
        user.phoneUpdatedAt = Date.now();
        setPhoneInput(""); 
        setShowPhoneModal(false);
        setHasDismissedModal(true);
        sessionStorage.setItem("phone_modal_dismissed", "true");
      } else {
        alert("Failed to save phone number.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleConfirmExistingPhone = async () => {
    if (!user || !user.phone) return; 
    setIsConfirming(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/users/phone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ phone: user.phone })
      });

      if (res.ok) {
        user.phoneUpdatedAt = Date.now(); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSaveAlias = async () => {
    if (!user) return; 
    if (!aliasInput.trim() || aliasInput.length > 20) {
      return alert("Please enter a valid name (max 20 characters).");
    }

    const confirmSave = window.confirm(`Are you sure you want to set your public alias to "${aliasInput.trim()}"?\n\nThis can only be done ONCE.`);
    if (!confirmSave) return;

    setIsSavingName(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/users/referral-name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ referralName: aliasInput })
      });

      if (res.ok) {
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

  const rawWithdrawMsg = `*Partner Payout Request* 💰\n\n*Partner ID:* ${referralCode}\n*Email:* ${user.email}\n*Amount:* ${balance.toLocaleString()} UGX\n\n*Action:* Please process my pending commission via Mobile Money.`;
  const rawDiscountMsg = `*Partner Discount Request* 🛍️\n\n*Partner ID:* ${referralCode}\n*Email:* ${user.email}\n*Balance to Apply:* ${balance.toLocaleString()} UGX\n\n*Action:* I just placed a COD order and want to use my affiliate wallet as a discount.`;
  const rawGeneralShareMsg = `Hey! 👋\n\nI get my campus supplies safely from *Kabale Online*.\n\nUse my link to order your stuff with Cash on Delivery:\n👉 ${referralLink}`;

  return (
    <div className="w-full min-h-screen bg-slate-50 overflow-x-hidden pb-10 relative">

      {/* ============================== */}
      {/* 🚀 FIRST-TIME ONBOARDING MODAL */}
      {/* ============================== */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={handleSkipModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>

            <div className="bg-amber-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <FaWhatsapp className="text-[#D97706] text-2xl" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-2">Welcome to the Network!</h2>
            <p className="text-slate-500 text-[14px] leading-relaxed mb-6">
              Before you start earning, please link your active WhatsApp number. We need this to send your <strong className="text-slate-900">payout notifications</strong> and process your <strong className="text-slate-900">Mobile Money transactions</strong>.
            </p>

            <div className="flex flex-col gap-3">
              <input 
                type="tel" 
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Enter WhatsApp Number (e.g. 07XXXXXXXX)"
                className="border border-slate-300 rounded-xl px-4 py-3.5 text-[15px] font-bold text-slate-800 outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] w-full"
              />
              <button 
                onClick={handleSavePhone}
                disabled={isSavingPhone || phoneInput.length < 9}
                className="w-full bg-[#D97706] text-white font-bold py-3.5 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 text-[15px]"
              >
                {isSavingPhone ? "Connecting..." : "Connect My Number"}
              </button>
              <button 
                onClick={handleSkipModal}
                className="w-full text-slate-400 font-bold py-2 text-[13px] hover:text-slate-600 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[480px] md:max-w-2xl mx-auto p-4 pt-6 w-full flex flex-col">

        <div className="mb-6 border-b border-slate-200 pb-4 w-full">
          <span className="text-[#D97706] font-black tracking-widest uppercase text-[10px] mb-1 block">
            Partner Network
          </span>
          <h1 className="text-2xl font-black text-slate-900">Creator Dashboard</h1>
        </div>

        {/* ============================== */}
        {/* INLINE WARNING                 */}
        {/* ============================== */}
        {!user.phone && !showPhoneModal && !hasDismissedModal && !sessionStorage.getItem("phone_modal_dismissed") && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm mb-6 w-full flex items-center justify-between">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-red-500 text-lg flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-black text-red-900 text-[14px]">Action Required</h2>
                <p className="text-[12px] text-red-700 mt-0.5 leading-tight font-medium">
                  You must link your number to receive Mobile Money payouts.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowPhoneModal(true)}
              className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold text-[12px] hover:bg-red-200 transition-colors"
            >
              Link Number
            </button>
          </div>
        )}

        {/* ============================== */}
        {/* 🚀 7-DAY CONFIRMATION BANNER   */}
        {/* ============================== */}
        {needsPhoneConfirmation && !showPhoneModal && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm mb-6 w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <FaInfoCircle className="text-blue-500 text-lg flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-black text-blue-900 text-[14px]">Security Check</h2>
                <p className="text-[12px] text-blue-700 mt-0.5 leading-tight font-medium">
                  Is <strong className="font-black text-blue-900 tracking-wide">{user.phone}</strong> still your active Mobile Money number?
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto flex-shrink-0">
              <button 
                onClick={handleConfirmExistingPhone}
                disabled={isConfirming}
                className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-[13px] hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isConfirming ? "..." : "Yes, it's correct"}
              </button>
              <button 
                onClick={() => setShowPhoneModal(true)}
                className="flex-1 md:flex-none bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-lg font-bold text-[13px] hover:bg-blue-100 transition-colors"
              >
                Edit Number
              </button>
            </div>
          </div>
        )}

        {/* ============================== */}
        {/* ALIAS CONFIGURATOR             */}
        {/* ============================== */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-4 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full min-w-0">
            <div className="flex-1 min-w-0">
              <h2 className="font-black text-slate-900 text-[14px]">Public Creator Alias</h2>
              <p className="text-[12px] text-slate-500 mt-0.5 leading-tight w-full font-medium">
                This name represents you on your shared links.
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
                    <FaInfoCircle /> Can only be set ONCE.
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
                  <FaEdit className="text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* STATS BOARD */}
        <div className="grid grid-cols-2 gap-3 mb-6 w-full">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm w-full flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1 w-full min-w-0">
              <FaWallet className="text-[14px] flex-shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-wider truncate w-full text-slate-500">Unpaid Wallet</p>
            </div>
            <p className="text-xl md:text-2xl font-black text-[#D97706] truncate w-full">
              {balance.toLocaleString()} <span className="text-[12px] text-amber-700">UGX</span>
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm w-full flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1 w-full min-w-0">
              <FaUserPlus className="text-[14px] flex-shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-wider truncate w-full text-slate-500">Conversions</p>
            </div>
            <p className="text-xl md:text-2xl font-black text-slate-900 truncate w-full">{count}</p>
          </div>
        </div>

        {/* ========================================== */}
        {/* 🚀 CREATOR STUDIO (PAGINATED PRODUCTS)     */}
        {/* ========================================== */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-6 w-full">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-black text-slate-900 text-[15px]">Creator Studio Links</h2>
              <p className="text-[12px] text-slate-500 font-medium mt-0.5">Generate affiliate links for specific items to boost your conversions.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {productsLoading ? (
               <div className="py-8 text-center text-slate-400 text-sm animate-pulse font-medium">Loading catalog...</div>
            ) : promotableProducts.length === 0 ? (
               <div className="py-8 text-center text-slate-400 text-sm font-medium">No official products found.</div>
            ) : (
              promotableProducts.map((product) => {
                const productLink = `https://www.kabaleonline.com/product/${product.publicId || product.id}?ref=${referralCode}`;
                const isCopied = copied === product.id;
                const estCommission = calculateCommission(product.price);

                return (
                  <div key={product.id} className="flex gap-3 border border-slate-100 p-2.5 rounded-xl hover:bg-slate-50 transition-colors items-center">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="text-[13px] font-black text-slate-900 truncate">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-400 line-through font-medium">UGX {product.price.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-green-700 bg-green-100 px-1.5 py-0.5 rounded tracking-wide uppercase">Earn {estCommission}</span>
                      </div>
                    </div>

                    {/* Copy Button */}
                    <button 
                      onClick={() => handleCopyLink(productLink, product.id)}
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCopied ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 hover:bg-[#D97706] hover:text-white border border-slate-200 hover:border-transparent'}`}
                      title="Copy affiliate link"
                    >
                      {isCopied ? <FaCheckCircle /> : <FaLink />}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || productsLoading}
              className="text-[12px] font-black text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:hover:text-slate-500"
            >
              &larr; Prev
            </button>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Page {currentPage}</span>
            <button 
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!hasMore || productsLoading}
              className="text-[12px] font-black text-[#D97706] hover:text-amber-700 transition-colors disabled:opacity-30 disabled:hover:text-[#D97706]"
            >
              Next &rarr;
            </button>
          </div>
        </div>

        {/* GENERAL LINK & QUICK SHARE */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-6 w-full">
          <h2 className="font-black text-slate-900 mb-3 text-[14px]">Your General Link</h2>

          <div className="flex flex-col gap-3 w-full min-w-0">
            <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-hidden min-w-0">
              <p className="text-[13px] font-mono text-slate-500 break-all select-all leading-tight">
                {mainReferralLink}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              <button 
                onClick={() => handleCopyLink(mainReferralLink, "main")}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl font-bold text-[13px] transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
              >
                {copied === "main" ? <FaCheckCircle className="text-green-500 text-[16px]" /> : <FaCopy className="text-slate-400 text-[16px]" />}
                {copied === "main" ? "Copied!" : "Copy"}
              </button>

              <a 
                href={`https://wa.me/?text=${encodeURIComponent(rawGeneralShareMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 text-[13px]"
              >
                <FaWhatsapp className="text-[18px]" /> Share
              </a>
            </div>
          </div>
        </div>

        {/* REDEMPTION SECTION */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-6 w-full">
          <h2 className="font-black text-slate-900 mb-3 text-[14px] border-b border-slate-100 pb-2">Claim Earnings</h2>

          {balance >= 3000 ? (
            <div className="flex flex-col gap-2 w-full">
              <a 
                href={`https://wa.me/${botPhoneNumber}?text=${encodeURIComponent(rawWithdrawMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center text-[13px]"
              >
                Withdraw to Mobile Money
              </a>
              <a 
                href={`https://wa.me/${botPhoneNumber}?text=${encodeURIComponent(rawDiscountMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold py-3.5 px-3 rounded-xl transition-all flex items-center justify-center text-[13px]"
              >
                Use as Checkout Discount
              </a>
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 w-full min-w-0">
              <FaInfoCircle className="text-slate-400 text-[16px] flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-slate-500 font-medium leading-tight">
                Minimum payout threshold is <strong className="text-slate-900">3,000 UGX</strong>. Keep sharing your link!
              </p>
            </div>
          )}
        </div>

        {/* RULES */}
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 w-full">
          <p className="font-black text-slate-800 mb-2 uppercase tracking-wider text-[10px]">Creator Guidelines</p>
          <ul className="text-[11px] text-slate-500 font-medium space-y-1.5 pl-3 list-disc">
            <li><strong className="text-slate-700">Official Items Only:</strong> Commissions apply only to verified official Kabale Online stock.</li>
            <li><strong className="text-slate-700">Infinite Cookie Window:</strong> Earn on both new AND returning customers every time they use your link.</li>
            <li><strong className="text-slate-700">Dynamic Scaling:</strong> Earn 10% of the cart value (Max 3,000 UGX). Micro-carts under 5k earn 300 UGX.</li>
            <li><strong className="text-slate-700">Instant Unlocks:</strong> Your wallet is credited the exact moment the delivery is marked successful.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
