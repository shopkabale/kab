"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import algoliasearch from "algoliasearch/lite";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

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
  searchQuery?: string; 
  feedback?: "up" | "down" | null; 
};

export default function FloatingHelpButton() {
  // Chat States
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Floating Button Scroll & Visibility States
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Dragging States
  const [position, setPosition] = useState({ x: 0, y: 0 });
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

  // Auto-hide the hint after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  // 2. Auto-scroll chat window
  useEffect(() => {
    if (isOpen) scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  // 3. Scroll Detection for the Floating Button
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
          setShowHint(false); 
        } else if (currentScrollY < lastScrollY) {
          setIsVisible(true);
        }
        setLastScrollY(currentScrollY);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // 4. Listen for external clicks (from your MiddleNav "Need help?" button)
  useEffect(() => {
    const handleOpen = () => { setIsOpen(true); setPosition({x:0, y:0}); setShowHint(false); };
    window.addEventListener('open-ai-widget', handleOpen);
    return () => window.removeEventListener('open-ai-widget', handleOpen);
  }, []);

  // 5. Sync Chat to LocalStorage and Firebase
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

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(`chat_${sessionId}`);
  };

  // 6. Robust Drag Logic for Window
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.isDragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.lastX = position.x;
    dragRef.current.lastY = position.y;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging) return;
    setPosition({
      x: dragRef.current.lastX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.lastY + (e.clientY - dragRef.current.startY)
    });
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.isDragging = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // 7. Handle Feedback
  const handleFeedback = (messageId: string, type: "up" | "down") => {
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, feedback: type } : msg
    );
    setMessages(updatedMessages);
    syncChat(updatedMessages, sessionId);
  };

  // 8. Unified Send Message Logic
  const sendMessage = async (textToSubmit: string) => {
    if (!textToSubmit.trim() || isLoading) return;

    const userText = textToSubmit.trim();
    const newMessages: Message[] = [...messages, { id: Date.now().toString(), role: "user", content: userText }];
    setMessages(newMessages);
    setInput(""); 
    setIsLoading(true);
    syncChat(newMessages, sessionId);

    try {
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
      let usedSearchQuery = "";

      const searchRegex = /\|\|SEARCH:(.*?)\|\|/i;
      const match = rawText.match(searchRegex);

      if (match) {
        usedSearchQuery = match[1].trim();
        rawText = rawText.replace(searchRegex, "").trim(); 
        try {
          const { hits } = await index.search<SearchResult>(usedSearchQuery, { hitsPerPage: 3 });
          foundProducts = hits;
        } catch (err) { console.error(err); }
      }

      const agentMessage: Message = { 
        id: (Date.now() + 1).toString(),
        role: "agent", 
        content: rawText, 
        products: foundProducts.length > 0 ? foundProducts : undefined,
        searchQuery: usedSearchQuery || undefined,
        feedback: null
      };

      const finalMessages = [...newMessages, agentMessage];
      setMessages(finalMessages);
      syncChat(finalMessages, sessionId);

    } catch (error) {
      const errorMsg: Message = { id: Date.now().toString(), role: "agent", content: "Oops, my circuits got tangled! Give it another try?" };
      const finalMessages = [...newMessages, errorMsg];
      setMessages(finalMessages);
      syncChat(finalMessages, sessionId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* ========================================= */}
      {/* 🌟 THE MERGED FLOATING TRIGGER BUTTON 🌟  */}
      {/* ========================================= */}
      {!isOpen && !isDismissed && (
        <div 
          className={`fixed bottom-24 xl:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end transition-all duration-500 ease-in-out ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
          }`}
        >
          {/* THE SUBTLE HINT */}
          {showHint && (
            <div className="relative bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              Need help? Ask anything
              <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-slate-200 rotate-45"></div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowHint(false); }}
                className="absolute -top-2 -left-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm border border-slate-200"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <button 
              onClick={() => setIsDismissed(true)}
              className="bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm border border-slate-200 mb-2 transition-colors z-10"
              aria-label="Dismiss AI Button"
            >
              ✕
            </button>

            {/* 🌟 NEW: PERFECT CIRCLE MESSAGE ICON BUTTON */}
            <button 
              onClick={() => { setIsOpen(true); setPosition({x:0, y:0}); setShowHint(false); }}
              className="group relative flex items-center justify-center bg-[#D97706] text-white w-14 h-14 rounded-full shadow-lg hover:bg-amber-600 hover:scale-105 hover:shadow-xl transition-all duration-300"
              aria-label="Open AI Chat"
            >
              <svg className="w-6 h-6 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 💬 THE CLEAN, CENTERED CHAT WINDOW 💬     */}
      {/* ========================================= */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)} 
            aria-label="Close chat background"
          />

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
            }}
          >
            {/* DRAGGABLE HEADER */}
            <div 
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="bg-slate-900 text-white flex flex-col cursor-grab active:cursor-grabbing touch-none select-none relative"
            >
              <div className="w-full flex justify-center pt-2 pb-1 pointer-events-none">
                <div className="w-10 h-1.5 bg-slate-600 rounded-full opacity-50"></div>
              </div>

              <div className="px-5 pb-4 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  <h3 className="font-bold text-sm md:text-base">Kabale AI Guide</h3>
                </div>
                <div className="flex items-center gap-4 pointer-events-auto">
                  <button onClick={clearChat} className="text-slate-400 hover:text-white text-sm" title="Clear Chat">🗑️</button>
                  <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white text-2xl leading-none">&times;</button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50 relative">

              {messages.length === 0 && (
                <div className="flex flex-col h-full items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Hi there 👋</h2>
                  <p className="text-slate-500 font-medium mb-8">Where should we start?</p>

                  <div className="flex flex-col gap-3 w-full max-w-[85%]">
                    <button 
                      onClick={() => sendMessage("How do I sell an item here?")}
                      className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-2xl hover:bg-amber-50 hover:border-amber-200 transition-colors shadow-sm text-left group"
                    >
                      <span className="text-xl bg-slate-50 p-2 rounded-xl group-hover:bg-white transition-colors">🏷️</span>
                      <span className="font-bold text-slate-700 text-sm group-hover:text-[#D97706] transition-colors">How to sell</span>
                    </button>

                    <button 
                      onClick={() => sendMessage("How do I buy an item?")}
                      className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-2xl hover:bg-amber-50 hover:border-amber-200 transition-colors shadow-sm text-left group"
                    >
                      <span className="text-xl bg-slate-50 p-2 rounded-xl group-hover:bg-white transition-colors">🛒</span>
                      <span className="font-bold text-slate-700 text-sm group-hover:text-[#D97706] transition-colors">How to buy</span>
                    </button>

                    <button 
                      onClick={() => sendMessage("I need to contact the admin.")}
                      className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-2xl hover:bg-amber-50 hover:border-amber-200 transition-colors shadow-sm text-left group"
                    >
                      <span className="text-xl bg-slate-50 p-2 rounded-xl group-hover:bg-white transition-colors">📞</span>
                      <span className="font-bold text-slate-700 text-sm group-hover:text-[#D97706] transition-colors">Contact admin</span>
                    </button>

                    <button 
                      onClick={() => sendMessage("Show me some electronics.")}
                      className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-2xl hover:bg-amber-50 hover:border-amber-200 transition-colors shadow-sm text-left group"
                    >
                      <span className="text-xl bg-slate-50 p-2 rounded-xl group-hover:bg-white transition-colors">💻</span>
                      <span className="font-bold text-slate-700 text-sm group-hover:text-[#D97706] transition-colors">Find electronics</span>
                    </button>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col animate-in fade-in slide-in-from-bottom-2">
                  <div className={`p-3.5 rounded-2xl max-w-[85%] text-sm shadow-sm whitespace-pre-wrap ${
                    msg.role === "user" 
                      ? "bg-slate-900 text-white ml-auto rounded-br-sm" 
                      : "bg-white border border-slate-200 text-slate-800 mr-auto rounded-bl-sm"
                  }`}>
                    {msg.content}
                  </div>

                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 ml-2 flex gap-3 overflow-x-auto pb-2 scrollbar-hide items-stretch">
                      {msg.products.map((product) => (
                        <Link 
                          key={product.objectID} 
                          href={`/product/${product.objectID}`}
                          onClick={() => setIsOpen(false)} 
                          className="min-w-[140px] max-w-[140px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-[#D97706] transition-colors flex-shrink-0 flex flex-col group"
                        >
                          <div className="h-24 w-full relative bg-slate-100">
                            {product.image ? (
                              <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="140px" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-slate-400">No Image</div>
                            )}
                          </div>
                          <div className="p-2 flex-1 flex flex-col justify-between">
                            <p className="text-xs font-bold text-slate-800 line-clamp-2">{product.name}</p>
                            <p className="text-sm font-black text-slate-900 mt-1">UGX {product.price.toLocaleString()}</p>
                          </div>
                        </Link>
                      ))}

                      {msg.searchQuery && (
                        <Link 
                          href={`/search?q=${encodeURIComponent(msg.searchQuery)}`}
                          onClick={() => setIsOpen(false)} 
                          className="min-w-[100px] bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center justify-center shadow-sm hover:border-[#D97706] hover:text-[#D97706] transition-colors flex-shrink-0 text-slate-500 p-3 group"
                        >
                          <span className="w-8 h-8 rounded-full bg-white group-hover:bg-[#D97706] group-hover:text-white flex items-center justify-center font-bold mb-2 transition-colors shadow-sm text-lg">➔</span>
                          <span className="text-xs font-bold text-center">View More</span>
                        </Link>
                      )}
                    </div>
                  )}

                  {msg.role === "agent" && !msg.content.includes("circuits got tangled") && (
                    <div className="flex items-center gap-2 mt-1.5 ml-2">
                      <button onClick={() => handleFeedback(msg.id, "up")} className={`text-xs p-1 rounded ${msg.feedback === 'up' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}>👍</button>
                      <button onClick={() => handleFeedback(msg.id, "down")} className={`text-xs p-1 rounded ${msg.feedback === 'down' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}>👎</button>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="bg-white border border-slate-200 w-fit px-4 py-3.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
                placeholder="Ask a question..."
                className="flex-1 px-4 py-3 bg-slate-100 border-transparent focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-full outline-none text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-slate-900 text-white w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-slate-800 shadow-sm flex-shrink-0"
              >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
