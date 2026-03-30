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

  // Responsive & Visibility States
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Dragging States (For Desktop)
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0, isDragging: false });

  // 1. Initialize Screen Size, Session & Load History
  useEffect(() => {
    // Check screen size for layout
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

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

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-hide the hint after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  // 2. Auto-scroll chat window
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, isLoading, isOpen]);

  // 3. Scroll Detection for the Floating Trigger Button
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

  // 6. Robust Drag Logic for Desktop Window
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMobile) return; // Disable dragging on mobile bottom sheet
    dragRef.current.isDragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.lastX = position.x;
    dragRef.current.lastY = position.y;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging || isMobile) return;
    setPosition({
      x: dragRef.current.lastX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.lastY + (e.clientY - dragRef.current.startY)
    });
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMobile) return;
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
      {/* 🌟 THE FLOATING TRIGGER BUTTON 🌟         */}
      {/* ========================================= */}
      {!isOpen && !isDismissed && (
        <div 
          className={`fixed bottom-24 xl:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end transition-all duration-500 ease-in-out ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
          }`}
        >
          {showHint && (
            <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              Need help? Ask anything
              <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 rotate-45"></div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowHint(false); }}
                className="absolute -top-2 -left-2 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm border border-slate-200 dark:border-slate-600"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <button 
              onClick={() => setIsDismissed(true)}
              className="bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm border border-slate-200 dark:border-slate-700 mb-2 transition-colors z-10"
              aria-label="Dismiss AI Button"
            >
              ✕
            </button>

            <button 
              onClick={() => { setIsOpen(true); setPosition({x:0, y:0}); setShowHint(false); }}
              className="group relative flex items-center justify-center bg-[#D97706] text-white w-14 h-14 rounded-full shadow-[0_8px_30px_rgba(217,119,6,0.3)] hover:bg-amber-600 hover:scale-105 hover:shadow-[0_8px_30px_rgba(217,119,6,0.5)] transition-all duration-300"
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
      {/* 💬 THE CHAT WINDOW (MOBILE & DESKTOP) 💬  */}
      {/* ========================================= */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsOpen(false)} 
            aria-label="Close chat background"
          />

          {/* Dynamic Wrapper */}
          <div 
            className={`fixed z-[100] flex flex-col overflow-hidden transition-all duration-300 ease-out ${
              isMobile 
                ? "inset-x-0 bottom-0 bg-[#1a1a1a] text-white rounded-t-3xl h-[88vh] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-full" 
                : "bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-2xl"
            }`}
            style={
              isMobile 
                ? {} // No custom positioning on mobile, handles via Tailwind inset-x-0 bottom-0
                : {
                    top: '50%',
                    left: '50%',
                    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                    width: '92vw',
                    maxWidth: '420px',
                    height: '650px',
                    maxHeight: '85vh',
                  }
            }
          >
            {/* 1. THE HEADER */}
            <div 
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`relative flex flex-col ${
                !isMobile 
                  ? "cursor-grab active:cursor-grabbing bg-slate-900 text-white pt-2 pb-4 px-5 border-b border-slate-800" 
                  : "pt-4 pb-4 px-6 border-b border-slate-800"
              }`}
            >
              {/* Drag Handle (Visual Only) */}
              <div className="w-full flex justify-center pb-3 pointer-events-none">
                <div className={`w-12 h-1.5 rounded-full ${isMobile ? "bg-slate-600" : "bg-slate-700 opacity-50"}`}></div>
              </div>

              <div className="flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${isMobile ? 'bg-slate-800 text-[#D97706]' : 'bg-white/10 text-white'}`}>
                    ✨
                  </div>
                  <div>
                    <h3 className="font-bold text-base md:text-lg tracking-tight">Kabale AI Guide</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <p className={`text-[11px] font-medium ${isMobile ? 'text-slate-400' : 'text-slate-300'}`}>Online & ready to help</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 pointer-events-auto">
                  <button onClick={clearChat} className={`hover:scale-110 transition-transform ${isMobile ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-white'}`} title="Clear Chat">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  <button onClick={() => setIsOpen(false)} className={`hover:scale-110 transition-transform ${isMobile ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-white'}`}>
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. MESSAGES AREA */}
            <div className={`flex-1 overflow-y-auto p-4 md:p-5 space-y-6 relative scroll-smooth ${isMobile ? 'bg-[#1a1a1a]' : 'bg-slate-50 dark:bg-[#111]'}`}>

              {/* Empty State / Welcome Screen */}
              {messages.length === 0 && (
                <div className="flex flex-col h-full items-center justify-center animate-in fade-in zoom-in-95 duration-500 pb-10">
                  <div className="w-16 h-16 bg-[#D97706]/10 rounded-full flex items-center justify-center text-3xl mb-4">👋</div>
                  <h2 className={`text-2xl font-black mb-1 tracking-tight ${isMobile ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Hi there</h2>
                  <p className={`text-sm font-medium mb-8 ${isMobile ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>How can I help you today?</p>

                  <div className="grid grid-cols-1 gap-3 w-full max-w-[90%]">
                    {[
                      { icon: "🏷️", text: "How do I sell an item?", query: "How do I sell an item here?" },
                      { icon: "🛒", text: "How to buy safely", query: "How do I buy an item securely?" },
                      { icon: "💻", text: "Show me electronics", query: "Show me some electronics." },
                    ].map((btn, i) => (
                      <button 
                        key={i}
                        onClick={() => sendMessage(btn.query)}
                        className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all shadow-sm border text-left group hover:-translate-y-0.5 ${
                          isMobile 
                            ? 'bg-slate-800 border-slate-700 hover:border-[#D97706]' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-[#D97706] dark:hover:border-[#D97706]'
                        }`}
                      >
                        <span className={`text-xl p-2 rounded-xl transition-colors ${isMobile ? 'bg-slate-700' : 'bg-slate-50 dark:bg-slate-700'}`}>
                          {btn.icon}
                        </span>
                        <span className={`font-bold text-sm transition-colors ${isMobile ? 'text-slate-200 group-hover:text-white' : 'text-slate-700 dark:text-slate-200 group-hover:text-[#D97706]'}`}>
                          {btn.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message List */}
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col animate-in fade-in slide-in-from-bottom-4">
                  
                  <div className={`p-4 max-w-[88%] text-sm shadow-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-[#D97706] text-white ml-auto rounded-2xl rounded-tr-sm font-medium" 
                      : isMobile 
                          ? "bg-slate-800 border border-slate-700 text-slate-200 mr-auto rounded-2xl rounded-tl-sm"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 mr-auto rounded-2xl rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>

                  {/* Product Cards Result */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3.5 ml-1 flex gap-3 overflow-x-auto pb-3 no-scrollbar items-stretch snap-x">
                      {msg.products.map((product) => (
                        <Link 
                          key={product.objectID} 
                          href={`/product/${product.objectID}`}
                          onClick={() => setIsOpen(false)} 
                          className={`snap-start min-w-[150px] max-w-[150px] rounded-xl overflow-hidden shadow-sm flex-shrink-0 flex flex-col group border transition-all hover:border-[#D97706] ${
                            isMobile 
                              ? "bg-slate-800 border-slate-700" 
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <div className="h-28 w-full relative bg-slate-100 dark:bg-slate-900 overflow-hidden">
                            {product.image ? (
                              <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="150px" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-slate-400 font-bold uppercase tracking-widest">No Image</div>
                            )}
                          </div>
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <p className={`text-xs font-bold line-clamp-2 leading-snug mb-2 ${isMobile ? 'text-slate-200' : 'text-slate-800 dark:text-slate-200'}`}>{product.name}</p>
                            <p className="text-sm font-black text-[#D97706]">UGX {product.price.toLocaleString()}</p>
                          </div>
                        </Link>
                      ))}

                      {/* View More Card */}
                      {msg.searchQuery && (
                        <Link 
                          href={`/search?q=${encodeURIComponent(msg.searchQuery)}`}
                          onClick={() => setIsOpen(false)} 
                          className={`snap-start min-w-[120px] rounded-xl flex flex-col items-center justify-center shadow-sm transition-all flex-shrink-0 p-3 group border hover:border-[#D97706] ${
                            isMobile 
                              ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' 
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-3 transition-colors shadow-sm text-xl ${
                            isMobile 
                              ? 'bg-slate-700 text-white group-hover:bg-[#D97706]' 
                              : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white group-hover:bg-[#D97706] group-hover:text-white'
                          }`}>
                            ➔
                          </span>
                          <span className={`text-xs font-bold text-center tracking-wide ${isMobile ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>View All</span>
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Feedback Buttons */}
                  {msg.role === "agent" && !msg.content.includes("circuits got tangled") && (
                    <div className="flex items-center gap-1.5 mt-2 ml-2">
                      <button onClick={() => handleFeedback(msg.id, "up")} className={`text-xs px-2 py-1 rounded transition-colors ${msg.feedback === 'up' ? 'bg-[#D97706] text-white' : isMobile ? 'text-slate-500 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>👍</button>
                      <button onClick={() => handleFeedback(msg.id, "down")} className={`text-xs px-2 py-1 rounded transition-colors ${msg.feedback === 'down' ? 'bg-red-500 text-white' : isMobile ? 'text-slate-500 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>👎</button>
                    </div>
                  )}
                </div>
              ))}

              {/* Sleek Loading Indicator */}
              {isLoading && (
                <div className={`w-fit px-5 py-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5 border ${
                  isMobile 
                    ? 'bg-slate-800 border-slate-700' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="w-1.5 h-1.5 bg-[#D97706] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-[#D97706] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-[#D97706] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              )}
              
              <div ref={scrollRef} className="h-2" />
            </div>

            {/* 3. INPUT AREA */}
            <form onSubmit={handleSubmit} className={`p-3 md:p-4 border-t flex gap-2 ${
              isMobile 
                ? 'bg-[#1a1a1a] border-slate-800' 
                : 'bg-white dark:bg-[#1a1a1a] border-slate-100 dark:border-slate-800'
            }`}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className={`flex-1 px-5 py-3.5 border-transparent focus:ring-2 focus:ring-[#D97706] focus:border-transparent rounded-full outline-none text-sm transition-all ${
                  isMobile 
                    ? 'bg-slate-800 text-white placeholder-slate-400' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400'
                }`}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-[#D97706] text-white w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-amber-600 shadow-md flex-shrink-0 transition-colors"
              >
                 <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>

          </div>
        </>
      )}
    </>
  );
}
