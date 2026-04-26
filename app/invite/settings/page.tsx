"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase/config";
import { FaArrowLeft, FaShieldAlt, FaPhone, FaLock, FaEdit, FaSave, FaInfoCircle, FaUserTag } from "react-icons/fa";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  
  const [phoneInput, setPhoneInput] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);

  const [aliasInput, setAliasInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [editingName, setEditingName] = useState(false);

  if (loading || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <FaShieldAlt className="text-[#D97706] text-3xl animate-pulse" />
      </div>
    );
  }

  const hasLockedAlias = !!user.referralName;
  const currentDisplayName = user.referralName || user.displayName?.split(' ')[0] || "Kabale User";

  const handleSavePhone = async () => {
    if (!phoneInput.trim() || phoneInput.length < 9) {
      return alert("Please enter a valid WhatsApp/Mobile Money number (e.g. 07XXXXXXXX)");
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
        setEditingPhone(false);
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

  const handleSaveAlias = async () => {
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

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-10">
      <div className="max-w-[480px] md:max-w-2xl mx-auto p-4 pt-6">
        
        <Link href="/invite" className="inline-flex items-center gap-2 text-slate-500 font-bold text-[12px] mb-6 hover:text-slate-900 transition-colors uppercase tracking-wider">
          <FaArrowLeft /> Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">Account Settings</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">Manage your payout details and creator profile.</p>
        </div>

        {/* PHONE NUMBER CONFIGURATOR */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm mb-4 w-full">
          <div className="flex flex-col gap-3 w-full min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FaPhone className="text-[#D97706]" />
              <h2 className="font-black text-slate-900 text-[14px]">Mobile Money Number</h2>
            </div>
            
            {user.phone && !editingPhone ? (
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-700 tracking-wide">{user.phone}</span>
                <button onClick={() => setEditingPhone(true)} className="text-[12px] font-bold text-[#D97706] hover:underline">Edit</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2 w-full">
                  <input 
                    type="tel" 
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder={user.phone || "07XXXXXXXX"}
                    className="border border-slate-300 rounded-lg px-4 py-3 text-[14px] font-bold text-slate-800 outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] w-full"
                  />
                  <button 
                    onClick={handleSavePhone}
                    disabled={isSavingPhone || phoneInput.length < 9}
                    className="bg-[#D97706] text-white p-3.5 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {isSavingPhone ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaSave />}
                  </button>
                </div>
                {!user.phone && <p className="text-[11px] font-bold text-red-500">Required to receive payouts.</p>}
                {editingPhone && user.phone && <button onClick={() => setEditingPhone(false)} className="text-[11px] text-slate-400 font-bold self-start mt-1">Cancel Edit</button>}
              </div>
            )}
          </div>
        </div>

        {/* ALIAS CONFIGURATOR */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm mb-8 w-full">
          <div className="flex flex-col gap-3 w-full min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FaUserTag className="text-[#D97706]" />
              <h2 className="font-black text-slate-900 text-[14px]">Public Creator Alias</h2>
            </div>
            <p className="text-[12px] text-slate-500 font-medium">This name represents you on your shared links.</p>

            {hasLockedAlias ? (
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-700">{currentDisplayName}</span>
                <FaLock className="text-slate-400 text-[12px]" />
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
                    className="border border-slate-300 rounded-lg px-4 py-3 text-[14px] font-bold text-slate-800 outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] w-full"
                  />
                  <button 
                    onClick={handleSaveAlias}
                    disabled={isSavingName || !aliasInput.trim()}
                    className="bg-[#D97706] text-white p-3.5 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {isSavingName ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaSave />}
                  </button>
                </div>
                <p className="text-[11px] font-bold text-red-500 flex items-center gap-1"><FaInfoCircle /> Can only be set ONCE.</p>
                <button onClick={() => setEditingName(false)} className="text-[11px] text-slate-400 font-bold self-start mt-1">Cancel Edit</button>
              </div>
            ) : (
              <button 
                onClick={() => { setAliasInput(currentDisplayName); setEditingName(true); }} 
                className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <span className="font-bold text-slate-800">{currentDisplayName}</span>
                <FaEdit className="text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* RULES */}
        <div className="bg-slate-100 p-5 rounded-xl border border-slate-200 w-full">
          <p className="font-black text-slate-800 mb-3 uppercase tracking-wider text-[11px]">Network Guidelines</p>
          <ul className="text-[12px] text-slate-600 font-medium space-y-2 pl-4 list-disc marker:text-[#D97706]">
            <li><strong className="text-slate-800 font-black">Official Items Only:</strong> Commissions apply only to verified official Kabale Online stock. Third-party seller items are excluded.</li>
            <li><strong className="text-slate-800 font-black">Infinite Cookie Window:</strong> Earn on both new AND returning customers. If they use your link, you get the cut.</li>
            <li><strong className="text-slate-800 font-black">Dynamic Scaling:</strong> Earn 10% of the cart value (Max 3,000 UGX). Micro-carts under 5k earn a flat 300 UGX.</li>
            <li><strong className="text-slate-800 font-black">Instant Unlocks:</strong> Your wallet is credited the exact moment the order delivery is marked successful by the admin.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
