"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

function InboxContent() {
  const { user, loading: authLoading } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Listen to the NEW 'chats' collection we built tonight
  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const q = query(collection(db, "chats"), orderBy("lastActivity", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatDocs = snapshot.docs.map(doc => ({
        id: doc.id, // This is the clean phone number!
        ...doc.data()
      }));
      setChats(chatDocs);
      setLoading(false);
    }, (err) => {
      console.error("Inbox Fetch Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Security Check
  if (authLoading) return <div className="py-20 text-center font-bold text-slate-500 animate-pulse">Opening Secure Inbox...</div>;
  if (!user || user.role !== "admin") return <div className="py-20 text-center text-red-500 font-bold">Access Denied</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Section */}
      <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white flex flex-col md:flex-row md:items-center justify-between shadow-xl">
        <div>
          <span className="bg-[#D97706] text-white text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-widest mb-3 inline-block">
            Meta API Integrated
          </span>
          <h1 className="text-3xl font-extrabold mb-1">WhatsApp Command Center</h1>
          <p className="text-slate-400">Monitor and respond to all community inquiries.</p>
        </div>
        <div className="mt-6 md:mt-0 flex gap-4">
          <div className="bg-slate-800 px-6 py-3 rounded-2xl border border-slate-700 text-center">
            <span className="block text-2xl font-black text-[#D97706]">{chats.length}</span>
            <span className="text-[10px] uppercase font-bold text-slate-500">Active Chats</span>
          </div>
        </div>
      </div>

      {/* Messages Table/List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="w-10 h-10 border-4 border-[#D97706] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="p-20 text-center">
            <span className="text-5xl block mb-4">📩</span>
            <h3 className="text-xl font-bold text-slate-900">No messages yet</h3>
            <p className="text-slate-500">WhatsApp replies will appear here in real-time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-5 text-xs uppercase font-black text-slate-500 tracking-wider">Customer Phone</th>
                  <th className="p-5 text-xs uppercase font-black text-slate-500 tracking-wider">Latest Message</th>
                  <th className="p-5 text-xs uppercase font-black text-slate-500 tracking-wider">Time</th>
                  <th className="p-5 text-xs uppercase font-black text-slate-500 tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {chats.map((chat) => {
                  const phoneStr = String(chat.phoneNumber || chat.id);
                  const shortAvatar = phoneStr.substring(phoneStr.length - 2);

                  return (
                    <tr key={chat.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 text-[#D97706] rounded-full flex items-center justify-center font-bold">
                            {shortAvatar}
                          </div>
                          <span className="font-bold text-slate-900">+{phoneStr}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <p className="text-slate-600 line-clamp-1 max-w-xs italic">
                          "{chat.lastMessage || "Media attached"}"
                        </p>
                      </td>
                      <td className="p-5">
                        <span className="text-xs font-medium text-slate-400">
                          {chat.lastActivity?.toDate ? chat.lastActivity.toDate().toLocaleString() : "Just now"}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        {/* Notice this uses chat.id (the phone number) to open the specific chat page */}
                        <Link 
                          href={`/reply/${chat.id}`}
                          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#D97706] transition-all shadow-sm"
                        >
                          Open Chat
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminInboxPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Loading Inbox...</div>}>
      <InboxContent />
    </Suspense>
  );
}
