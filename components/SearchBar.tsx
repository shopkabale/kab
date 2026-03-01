"use client";

import { useState, useEffect, useRef } from "react";
import algoliasearch from "algoliasearch/lite";
import Link from "next/link";
import Image from "next/image";

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          onFocus={() => query.trim() !== "" && setIsOpen(true)}
          placeholder="Search laptops, seeds, textbooks..."
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50">
          {results.map((hit) => (
            <Link
              key={hit.objectID}
              // CRITICAL FIX: Pointing to /item/
              href={`/item/${hit.objectID}`}
              onClick={() => { setIsOpen(false); setQuery(""); }}
              className="flex items-center p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
            >
              {hit.image ? (
                <div className="relative h-10 w-10 flex-shrink-0 bg-slate-100 rounded-md overflow-hidden">
                  <Image src={hit.image} alt={hit.name} fill className="object-cover" sizes="40px" />
                </div>
              ) : (
                <div className="h-10 w-10 flex-shrink-0 bg-slate-100 rounded-md flex items-center justify-center text-[10px] text-slate-400">No img</div>
              )}
              <div className="ml-3 flex-grow overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 truncate">{hit.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">UGX {hit.price.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{hit.category.replace('_', ' ')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}