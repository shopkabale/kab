"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function MagicReplyPage({ params }: { params: { messageId: string } }) {
  // Extract the messageId from the URL
  const { messageId } = params;

  const [messageData, setMessageData] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // 1. Fetch the exact message from Firebase when the page loads
  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const docRef = doc(db, "whatsapp_messages", messageId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setMessageData(docSnap.data());
        } else {
          setError("Message not found. It may have been deleted or the link is invalid.");
        }
      } catch (err) {
        console.error("Firebase fetch error:", err);
        setError("Failed to load the conversation securely.");
      }
    };

    if (messageId) {
      fetchMessage();
    }
  }, [messageId]);

  // 2. Handle sending the reply to your API
  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);

    try {
      const res = await fetch("/api/admin/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          toPhone: messageData.senderPhone, 
          text: replyText,
          originalMessageId: messageId // Links the reply to the original message in your DB
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        alert(`Failed to send WhatsApp message: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Check your connection and try again.");
    } finally {
      setIsSending(false);
    }
  };

  // 3. UI States (Error & Loading)
  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mb-6">⚠️</div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">{error}</h1>
        <p className="text-slate-500">Please check your email link and try again.</p>
      </div>
    );
  }

  if (!messageData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#D97706] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-slate-500 animate-pulse">Decrypting secure chat...</p>
      </div>
    );
  }

  // 4. The Main Reply UI
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-slate-900 p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <span className="bg-[#D97706] text-[10px] uppercase font-black px-3 py-1 rounded-full mb-3 inline-block tracking-widest">
              Kabale Online Secure Reply
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold">Customer Support</h1>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
        </div>

        {/* The Buyer's Message */}
        <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Message from {messageData.senderPhone}
          </p>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-slate-800 text-lg relative">
            <div className="absolute top-0 left-6 -mt-3 w-4 h-4 bg-white border-t border-l border-slate-200 transform rotate-45"></div>
            "{messageData.content}"
          </div>
          <p className="text-xs text-slate-400 mt-3 text-right">
            Received: {messageData.timestamp?.toDate ? messageData.timestamp.toDate().toLocaleString() : "Recently"}
          </p>
        </div>

        {/* The Reply Box */}
        <div className="p-6 sm:p-8">
          {success ? (
            <div className="bg-green-50 text-green-700 border border-green-200 p-8 rounded-2xl text-center shadow-inner">
              <span className="text-5xl block mb-4">✅</span>
              <p className="font-black text-2xl mb-1">Reply Sent!</p>
              <p className="text-sm font-medium">Your message was successfully delivered to their WhatsApp.</p>
              <button 
                onClick={() => window.close()} 
                className="mt-6 text-green-700 font-bold hover:underline"
              >
                Close this tab
              </button>
            </div>
          ) : (
            <>
              <label className="block text-sm font-bold text-slate-700 mb-2">Type your response:</label>
              <textarea
                rows={5}
                className="w-full rounded-2xl border border-slate-300 p-5 focus:ring-2 focus:ring-[#D97706] outline-none resize-none shadow-sm transition-shadow text-slate-800"
                placeholder="Hi, yes your order is on the way..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={isSending}
              />
              <p className="text-xs text-slate-500 mt-2 mb-6">
                This will be sent directly to <strong>{messageData.senderPhone}</strong> as an official WhatsApp message.
              </p>

              <button 
                onClick={handleSendReply}
                disabled={isSending || !replyText.trim()}
                className="w-full bg-[#D97706] text-white py-4 rounded-xl font-black text-lg hover:bg-amber-600 transition-all hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-3"
              >
                {isSending ? (
                  <>
                    <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending to WhatsApp...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                    Send Message to Buyer
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
