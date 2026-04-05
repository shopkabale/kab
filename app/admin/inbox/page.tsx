"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/components/AuthProvider";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

function InboxContent() {
  const { user, loading: authLoading } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New states for the selected chat and its messages
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // 1. Fetch the list of chats (Your existing logic)
  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const q = query(collection(db, "chats"), orderBy("lastActivity", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatDocs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChats(chatDocs);
      setLoading(false);
    }, (err) => {
      console.error("Inbox Fetch Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Fetch messages dynamically when a chat is selected
  useEffect(() => {
    if (!selectedChatId) return;
    
    setMessagesLoading(true);
    // Point to the specific subcollection: chats/{phone_number}/messages
    const messagesRef = collection(db, "chats", selectedChatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setMessagesLoading(false);
    }, (err) => {
      console.error("Messages Fetch Error:", err);
      setMessagesLoading(false);
    });

    return () => unsubscribe();
  }, [selectedChatId]);

  // Security Check
  if (authLoading) return <div className="py-20 text-center font-bold text-slate-500 animate-pulse">Opening Secure Inbox...</div>;
  if (!user || user.role !== "admin") return <div className="py-20 text-center text-red-500 font-bold">Access Denied</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 h-screen flex flex-col">
      {/* Header Section */}
      <div className="bg-slate-900 rounded-3xl p-8 mb-6 text-white flex flex-col md:flex-row md:items-center justify-between shadow-xl flex-shrink-0">
        <div>
          <span className="bg-[#D97706] text-white text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-widest mb-3 inline-block">
            Meta API Integrated
          </span>
          <h1 className="text-3xl font-extrabold mb-1">WhatsApp Command Center</h1>
          <p className="text-slate-400">Monitor and read all community inquiries in real-time.</p>
        </div>
        <div className="mt-6 md:mt-0 flex gap-4">
          <div className="bg-slate-800 px-6 py-3 rounded-2xl border border-slate-700 text-center">
            <span className="block text-2xl font-black text-[#D97706]">{chats.length}</span>
            <span className="text-[10px] uppercase font-bold text-slate-500">Active Chats</span>
          </div>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-[500px]">
        
        {/* LEFT PANEL: Chat List */}
        <div className="w-1/3 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
            Recent Conversations
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
               <div className="p-10 text-center text-slate-500 animate-pulse">Loading chats...</div>
            ) : chats.length === 0 ? (
               <div className="p-10 text-center text-slate-500">No chats available.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {chats.map((chat) => {
                  const isSelected = selectedChatId === chat.id;
                  const phoneStr = String(chat.phoneNumber || chat.id);
                  const shortAvatar = phoneStr.substring(phoneStr.length - 2);

                  return (
                    <li 
                      key={chat.id} 
                      onClick={() => setSelectedChatId(chat.id)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? 'bg-amber-50 border-l-4 border-[#D97706]' : 'border-l-4 border-transparent'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${isSelected ? 'bg-[#D97706] text-white' : 'bg-amber-100 text-[#D97706]'}`}>
                          {shortAvatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-slate-900 truncate">+{phoneStr}</h3>
                            <span className="text-[10px] text-slate-400">
                              {chat.lastActivity?.toDate ? chat.lastActivity.toDate().toLocaleDateString() : ""}
                            </span>
                          </div>
                          <p className={`text-xs line-clamp-1 ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                            {chat.lastMessage || "Media attached"}
                          </p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Message History View */}
        <div className="w-2/3 bg-slate-50 rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {!selectedChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <span className="text-6xl mb-4">💬</span>
              <p className="text-lg font-medium">Select a chat to read messages</p>
            </div>
          ) : (
            <>
              {/* Active Chat Header */}
              <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3">
                <span className="font-bold text-lg text-slate-800">Reading Chat: +{selectedChatId}</span>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {messagesLoading ? (
                  <div className="flex-1 flex items-center justify-center text-slate-400 animate-pulse">
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-slate-400">
                    No messages found in this subcollection.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOutgoing = msg.direction === "outgoing";
                    const timeString = msg.timestamp?.toDate 
                      ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                      : "";

                    return (
                      <div key={msg.id} className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}>
                        <div 
                          className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                            isOutgoing 
                              ? "bg-[#D97706] text-white rounded-br-none" 
                              : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                          {timeString && (
                            <span className={`text-[10px] block mt-2 font-medium text-right ${isOutgoing ? "text-amber-200" : "text-slate-400"}`}>
                              {timeString}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

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
