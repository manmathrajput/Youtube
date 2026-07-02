"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SearchBox({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length === 0) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data);
      } catch (e) {
        console.error(e);
      }
    };

    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 200);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto" ref={wrapperRef}>
      <form onSubmit={handleSearch} className="relative z-10">
        <div className="relative flex items-center w-full h-16 rounded-full focus-within:shadow-lg bg-[#121212] border border-white/20 overflow-hidden transition-all duration-300">
          <div className="grid place-items-center h-full w-16 text-gray-400">
            <Search className="w-6 h-6" />
          </div>

          <input
            className="peer h-full w-full outline-none text-lg text-white bg-transparent pr-4 placeholder-gray-500 font-medium"
            type="text"
            id="search"
            placeholder="Search YouTube videos..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            autoComplete="off"
          />
        </div>
      </form>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute w-full mt-2 bg-[#181818] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden"
          >
            <ul className="py-2">
              {suggestions.map((suggestion, idx) => (
                <li
                  key={idx}
                  className="px-6 py-3 hover:bg-white/10 cursor-pointer text-gray-200 transition-colors flex items-center gap-3"
                  onClick={() => {
                    setQuery(suggestion);
                    onSearch(suggestion);
                    setIsOpen(false);
                  }}
                >
                  <Search className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-base">{suggestion}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
