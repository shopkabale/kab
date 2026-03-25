// components/AiChatWidget.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import algoliasearch from "algoliasearch/lite";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Make sure this path matches your firebase config

// Initialize Algolia
const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
);
const index = searchClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "products");

type SearchResult = { objectID: string; name: string; category: string; price: number; image: string; };

type Message = { 
  id: string; // Unique ID to track feedback
  role: "user" | "agent"; 
  content: string; 
  products?: SearchResult[];
  feedback?: "up" | "down" | null; // For success tracking
};

export default function AiChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initialize Session & Load History from LocalStorage
  useEffect(() => {
    let currentSession = localStorage.getItem("kabale_ai_session");
    if (!currentSession) {
      currentSession = `session_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem("kabale_ai_session", currentSession);
    }
    setSessionId(currentSession);

    const savedChat = localStorage.getItem(`chat_${currentSession}`);
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    }
  }, []);

  // 2. Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // 3. Sync Chat to LocalStorage and Firebase
  const syncChat = async (newMessages: Message[], currentSessionId: string) => {
    localStorage.setItem(`chat_${currentSessionId}`, JSON.stringify(newMessages));
    
    try {
      await setDoc(doc(db, "ai_conversations", currentSessionId), {
        sessionId: currentSessionId,
        messages: newMessages,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error("Firebase sync error:", error);
    }
  };

  // 4. Handle Thumbs Up / Thumbs Down Feedback
  const handleFeedback = (messageId: string, type: "up" | "down") => {
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, feedback: type } : msg
    );
    setMessages(updatedMessages);
    syncChat(updatedMessages, sessionId);
  };

  // 5. Submit Message to Groq & Handle Algolia Tags
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMsgId = Date.now().toString();
    const newMessages: Message[] = [...messages, { id: userMsgId, role: "user", content: userText }];
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    syncChat(newMessages, sessionId);

    try {
      // Send simplified message history to the API (no product/feedback data)
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error("API Error");
      
      let rawText = await res.text();
      let foundProducts: SearchResult[] = [];

      // 🕵️‍♂️ INTERCEPT THE ALGOLIA SEARCH TAG
      const searchRegex = /\|\|SEARCH:(.*?)\|\|/i;
      const match = rawText.match(searchRegex);

      if (match) {
        const query = match[1].trim();
        rawText = rawText.replace(searchRegex, "").trim(); // Remove tag from user view
        
        // Fetch products directly from Algolia
        const { hits } = await index.search<SearchResult>(query, { hitsPerPage: 3 });
        foundProducts = hits;
      }

      const agentMessage: Message = { 
        id: (Date.now() + 1).toString(),
        role: "agent", 
        content: rawText, 
        products: foundProducts.length > 0 ? foundProducts : undefined,
        feedback: null
      };

      const finalMessages = [...newMessages, agentMessage];
      setMessages(finalMessages);
      syncChat(finalMessages, sessionId);

    } catch (error) {
      setMessages((prev) => [...prev, { 
        id: Date.now().toString(), 
        role: "agent", 
        content: "Oops, my circuits got tangled! 🤖 Give it another try?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-[#D97706] text-white p-4 rounded-full shadow-2xl hover:bg-amber-600 hover:scale-105 transition-all z-50 flex items-center gap-2"
        >
          <span className="text-2xl">✨</span>
          <span className="font-bold hidden md:block pr-2">Ask AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-[92vw] max-w-[400px] h-[600px] max-h-[85vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
              <h3 className="font-bold text-sm md:text-base">Kabale AI Guide</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center mt-12 text-slate-500">
                <span className="text-5xl block mb-4">👋</span>
                <p className="text-sm font-medium">Hey! Looking for something specific, or just need help selling?</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col">
                <div className={`p-3.5 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                  msg.role === "user" 
                    ? "bg-black text-white ml-auto rounded-br-sm" 
                    : "bg-white border border-slate-200 text-slate-800 mr-auto rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>

                {/* 🛍️ ALGOLIA PRODUCT RENDERER */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 ml-2 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {msg.products.map((product) => (
                      <Link 
                        key={product.objectID} 
                        href={`/product/${product.objectID}`}
                        className="min-w-[140px] max-w-[140px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-[#D97706] transition-colors flex-shrink-0"
                      >
                        <div className="h-24 w-full relative bg-slate-100">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-400">No Image</div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-bold text-slate-800 truncate">{product.name}</p>
                          <p className="text-sm font-black text-[#D97706] mt-1">UGX {product.price.toLocaleString()}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* 👍 👎 FEEDBACK TRACKING (Only for AI responses) */}
                {msg.role === "agent" && (
                  <div className="flex items-center gap-2 mt-1.5 ml-2">
                    <button 
                      onClick={() => handleFeedback(msg.id, "up")}
                      className={`text-xs p-1 rounded transition-colors ${msg.feedback === 'up' ? 'bg-green-100 text-green-700' : 'text-slate-400 hover:text-green-600 hover:bg-slate-100'}`}
                    >
                      👍
                    </button>
                    <button 
                      onClick={() => handleFeedback(msg.id, "down")}
                      className={`text-xs p-1 rounded transition-colors ${msg.feedback === 'down' ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'}`}
                    >
                      👎
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="bg-white border border-slate-200 text-slate-400 w-fit px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for laptops, shoes, help..."
              className="flex-1 px-4 py-3 bg-slate-100 border-transparent focus:bg-white focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] rounded-full outline-none transition-all text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-[#D97706] text-white w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-amber-600 transition-colors shadow-sm flex-shrink-0"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
