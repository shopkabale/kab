"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import algoliasearch from "algoliasearch/lite";
import Link from "next/link";
import Image from "next/image";

// Initialize Algolia
const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""
);
const index = searchClient.initIndex(process.env.ALGOLIA_INDEX_NAME || "kabale_products");

interface SearchResult {
  objectID: string;
  name: string;
  category: string;
  price: number;
  image: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle the Live Dropdown Search
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

  // Handle the "Enter" Key press OR the Search Button click
  const handleFullSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevents page reload
    if (query.trim() !== "") {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto" ref={searchRef}>
      {/* The <form> tag is the magic here. 
        It naturally captures the "Enter" key on Desktop 
        AND the "Go/Search" button on mobile keyboards! 
      */}
      <form onSubmit={handleFullSearchSubmit} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={handleLiveSearch}
          onFocus={() => query.trim() !== "" && setIsOpen(true)}
          placeholder="Search laptops, cables, kettles..."
          className="w-full pl-5 pr-14 py-2.5 border border-slate-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all shadow-sm"
        />
        
        {/* The Clickable Search Button for Mobile & Desktop */}
        <button 
          type="submit"
          aria-label="Submit Search"
          className="absolute right-1 top-1 bottom-1 w-9 bg-[#D97706] hover:bg-amber-600 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>

      {/* The Algolia Live Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
          {results.map((hit) => (
            <Link
              key={hit.objectID}
              href={`/product/${hit.objectID}`} 
              onClick={() => { setIsOpen(false); setQuery(""); }}
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
          
          {/* A prompt at the bottom of the dropdown to view all results */}
          <div 
            className="bg-slate-50 p-2 text-center border-t border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={handleFullSearchSubmit}
          >
            <span className="text-xs font-bold text-[#D97706]">Press Enter to see all results ➔</span>
          </div>
        </div>
      )}
    </div>
  );
}
