// components/AiChatWidget.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import algoliasearch from "algoliasearch/lite";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Ensure this matches your path

// Initialize Algolia
const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
);
const index = searchClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "products");

type SearchResult = { objectID: string; name: string; category: string; price: number; image: string; };

type Message = { 
  id: string; 
  role: "user" | "agent"; 
  content: string; 
  products?: SearchResult[];
  feedback?: "up" | "down" | null; 
};

export default function AiChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Dragging State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0, isDragging: false });

  // 1. Initialize Session & Load History
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

  // 2. Auto-scroll
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

  // Clear Chat Utility
  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(`chat_${sessionId}`);
  };

  // 4. Robust Drag Logic for Mobile and Desktop
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.isDragging = true;
    setIsDragging(true);
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.lastX = position.x;
    dragRef.current.lastY = position.y;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.lastX + dx,
      y: dragRef.current.lastY + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.isDragging = false;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // 5. Handle Thumbs Up / Thumbs Down
  const handleFeedback = (messageId: string, type: "up" | "down") => {
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, feedback: type } : msg
    );
    setMessages(updatedMessages);
    syncChat(updatedMessages, sessionId);
  };

  // 6. Submit Message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const newMessages: Message[] = [...messages, { id: Date.now().toString(), role: "user", content: userText }];
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    syncChat(newMessages, sessionId);

    try {
      // Ensure Groq sees "assistant" instead of "agent"
      const apiMessages = newMessages.map(m => ({ 
        role: m.role === "agent" ? "assistant" : m.role, 
        content: m.content 
      }));

      const res = await fetch("/api/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error("API Error");
      
      let rawText = await res.text();
      let foundProducts: SearchResult[] = [];

      // Intercept ||SEARCH:keyword|| tags
      const searchRegex = /\|\|SEARCH:(.*?)\|\|/i;
      const match = rawText.match(searchRegex);

      if (match) {
        const query = match[1].trim();
        rawText = rawText.replace(searchRegex, "").trim(); 
        try {
          const { hits } = await index.search<SearchResult>(query, { hitsPerPage: 3 });
          foundProducts = hits;
        } catch (err) { console.error(err); }
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
      const errorMsg: Message = { 
        id: Date.now().toString(), 
        role: "agent", 
        content: "Oops, my circuits got tangled! 🤖 Give it another try?" 
      };
      const finalMessages = [...newMessages, errorMsg];
      setMessages(finalMessages);
      syncChat(finalMessages, sessionId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => { setIsOpen(true); setPosition({x:0, y:0}); }} 
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-[#D97706] text-white p-4 rounded-full shadow-2xl hover:bg-amber-600 hover:scale-105 transition-all z-50 flex items-center gap-2"
        >
          <span className="text-2xl">✨</span>
          <span className="font-bold hidden md:block pr-2">Ask AI</span>
        </button>
      )}

      {/* Chat Window - True Centered & Draggable */}
      {isOpen && (
        <div 
          className="fixed z-[100] flex flex-col bg-white border border-slate-200 shadow-2xl overflow-hidden"
          style={{
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
            width: '92vw',
            maxWidth: '400px',
            height: '600px',
            maxHeight: '85vh',
            borderRadius: '16px',
            // Add a subtle scale effect when dragging
            scale: isDragging ? '1.02' : '1',
            transition: isDragging ? 'none' : 'scale 0.2s ease'
          }}
        >
          {/* DRAGGABLE HEADER */}
          <div 
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            // touch-none is critical here. It stops the mobile browser from scrolling the page when dragging
            className="bg-slate-900 text-white flex flex-col cursor-grab active:cursor-grabbing touch-none select-none relative"
          >
            {/* Visual Drag Indicator (The little pill line) */}
            <div className="w-full flex justify-center pt-2 pb-1 pointer-events-none">
              <div className="w-10 h-1.5 bg-slate-600 rounded-full opacity-50"></div>
            </div>

            <div className="px-5 pb-4 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                <h3 className="font-bold text-sm md:text-base">Kabale AI Guide</h3>
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-4 pointer-events-auto">
                <button onClick={clearChat} className="text-slate-400 hover:text-white text-sm" title="Clear Chat">🗑️</button>
                <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white text-2xl leading-none">&times;</button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50 relative">
            {messages.length === 0 && (
              <div className="text-center mt-12 text-slate-500">
                <span className="text-5xl block mb-4">👋</span>
                <p className="text-sm font-medium">Hey! Looking for something specific, or just need help selling?</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col">
                <div className={`p-3.5 rounded-2xl max-w-[85%] text-sm shadow-sm whitespace-pre-wrap ${
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
                            <Image src={product.image} alt={product.name} fill className="object-cover" sizes="140px" />
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

                {/* 👍 👎 FEEDBACK TRACKING */}
                {msg.role === "agent" && !msg.content.includes("circuits got tangled") && (
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
