"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import algoliasearch from "algoliasearch/lite";
import Link from "next/link";
import Image from "next/image";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; 
import { useAuth } from "@/components/AuthProvider";

// Initialize Algolia
const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
);
const index = searchClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "products");

interface SearchResult {
  objectID: string;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface SearchBarProps {
  onSearch?: () => void;
}

// 🔥 STEP 1: Rename the main component to SearchBarContent
function SearchBarContent({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams(); // THIS is what broke the build!
  
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Turn off the loader as soon as the URL changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLiveSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === "") {
      setResults([]);
      setIsOpen(false);
      return;
    }

    try {
      const { hits } = await index.search<SearchResult>(value, { hitsPerPage: 5 });
      setResults(hits);
      setIsOpen(true);
    } catch (error) {
      console.error("Algolia search error:", error);
    }
  };

  const handleFullSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalQuery = query.trim();

    if (finalQuery !== "") {
      setIsOpen(false);
      setIsNavigating(true); // SHOW LOADER IMMEDIATELY
      
      if (onSearch) onSearch();

      try {
        const currentUser = user as any; 
        await addDoc(collection(db, "search_queries"), {
          query: finalQuery.toLowerCase(),
          userId: currentUser?.id || currentUser?.uid || "anonymous",
          userEmail: currentUser?.email || null,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Failed to save search query to Firestore:", error);
      }

      router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
    }
  };

  return (
    <div className="relative w-full mx-auto" ref={searchRef}>
      <form onSubmit={handleFullSearchSubmit} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={handleLiveSearch}
          onFocus={() => query.trim() !== "" && setIsOpen(true)}
          placeholder="Search laptops, cables, kettles..."
          className="w-full pl-5 pr-14 py-3 md:py-3.5 border border-slate-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all shadow-sm"
        />

        <button 
          type="submit"
          aria-label="Submit Search"
          className="absolute right-1.5 top-1.5 bottom-1.5 w-10 md:w-11 bg-[#D97706] hover:bg-amber-600 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100]">
          {results.map((hit) => (
            <Link
              key={hit.objectID}
              href={`/product/${hit.objectID}`} 
              onClick={() => { 
                setIsOpen(false); 
                setQuery(""); 
                setIsNavigating(true); 
                if (onSearch) onSearch(); 
              }}
              className="flex items-center p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
            >
              {hit.image ? (
                <div className="relative h-12 w-12 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <Image src={hit.image} alt={hit.name} fill className="object-cover" sizes="48px" />
                </div>
              ) : (
                <div className="h-12 w-12 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400 border border-slate-200">No img</div>
              )}
              <div className="ml-3 flex-grow overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">{hit.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-black text-[#D97706]">UGX {hit.price.toLocaleString()}</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold bg-slate-100 px-2 py-0.5 rounded-full">{hit.category.replace('_', ' ')}</span>
                </div>
              </div>
            </Link>
          ))}

          <div 
            className="bg-slate-50 p-3 text-center border-t border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={handleFullSearchSubmit}
          >
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider">Tap to see all results ➔</span>
          </div>
        </div>
      )}

      {/* THE INJECTED LOADER OVERLAY */}
      {isNavigating && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent pointer-events-none transition-opacity duration-300">
          <style>{`
            @keyframes kineticSpin {
              0% { transform: scale(0.6) rotate(0deg); opacity: 0.7; }
              50% { transform: scale(1.2) rotate(90deg); opacity: 1; }
              100% { transform: scale(0.6) rotate(360deg); opacity: 0.7; }
            }
            .animate-kinetic-spin {
              animation: kineticSpin 1.4s infinite ease-in-out;
            }
          `}</style>

          <svg 
            className="animate-kinetic-spin w-16 h-16 text-[#D97706] drop-shadow-md" 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="7" className="opacity-90" />
            <path d="M38 28v44m0-22l20-22m-20 22l20 22" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

// 🔥 STEP 2: Export a wrapper that isolates the Suspense boundary!
// This stops the build from crashing on Home, Products, etc.
export default function SearchBar(props: SearchBarProps) {
  return (
    <Suspense 
      fallback={
        <div className="relative w-full mx-auto">
          {/* Skeleton loader that looks like the real search bar to prevent layout shift */}
          <div className="w-full py-3 md:py-3.5 border border-slate-300 rounded-full bg-slate-100 dark:bg-slate-800 h-[46px] md:h-[50px] animate-pulse"></div>
        </div>
      }
    >
      <SearchBarContent {...props} />
    </Suspense>
  );
}
