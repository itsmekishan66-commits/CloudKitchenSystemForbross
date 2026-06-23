"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { FaMapMarkerAlt, FaSearch } from "react-icons/fa";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const current = searchParams.get("q") || "";
    // Avoid synchronous setState inside effect to prevent cascading renders.
    // Schedule an async update that only changes state if different.
    Promise.resolve().then(() =>
      setQuery((prev) => (prev === current ? prev : current))
    );
  }, [searchParams]);

  function updateUrl(value: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      router.push(qs ? `/menu?${qs}` : "/menu");
    }, 300);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:mt-12">
      <div className="relative flex-1 group">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            updateUrl(e.target.value);
          }}
          placeholder="Search for dishes, flavors, or ingredients..."
          className="w-full bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 pl-12 pr-4 py-4 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100/50 transition-all duration-200 text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              const params = new URLSearchParams(searchParams.toString());
              params.delete("q");
              const qs = params.toString();
              router.push(qs ? `/menu?${qs}` : "/menu");
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      <div className="bg-white/80 backdrop-blur-sm px-5 py-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 min-w-60">
        <FaMapMarkerAlt className="text-orange-500 shrink-0" />
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
            Delivery to
          </p>
          <p className="font-semibold text-sm text-gray-800">
            Biratnagar &bull; 35-45 mins
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Menusearch() {
  return (
    <Suspense fallback={
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 h-14 bg-white/80 rounded-xl animate-pulse" />
        <div className="min-w-60 h-14 bg-white/80 rounded-xl animate-pulse" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
