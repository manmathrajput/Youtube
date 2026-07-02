"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SearchBox({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
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
        setActiveIndex(-1); // reset active index on new suggestions
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
      setActiveIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        const selected = suggestions[activeIndex];
        setQuery(selected);
        onSearch(selected);
        setIsOpen(false);
        setActiveIndex(-1);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto" ref={wrapperRef}>
      <form onSubmit={handleSearch} className="relative z-10">
        <div className="relative flex items-center w-full h-[52px] rounded-full focus-within:shadow-lg focus-within:shadow-red-600/10 bg-[#1a1a1a] border border-white/10 focus-within:border-white/30 overflow-hidden transition-all duration-300">
          <input
            className="peer h-full w-full outline-none text-base text-white bg-transparent px-6 placeholder-gray-500 font-medium"
            type="text"
            id="search"
            placeholder="Search YouTube videos..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
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
                  className={`px-6 py-3 cursor-pointer text-gray-200 transition-colors flex items-center gap-3 ${
                    idx === activeIndex ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                  onClick={() => {
                    setQuery(suggestion);
                    onSearch(suggestion);
                    setIsOpen(false);
                    setActiveIndex(-1);
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
