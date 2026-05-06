"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  placeholder?: string;
}

export default function SearchBar({ placeholder = "搜索 ADC 药物、靶点、公司、适应症..." }: Props) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) {
      router.push(`/products?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/products");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-cyber-card border border-cyber-border rounded-xl px-5 py-3 pl-11 text-sm text-cyber-text placeholder:text-cyber-text2/50 focus:outline-none focus:border-cyber-accent focus:shadow-[0_0_20px_rgba(0,229,255,0.15)] transition-all"
      />
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-cyber-text2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyber-accent hover:bg-cyan-400 text-cyber-bg font-bold text-xs px-4 py-1.5 rounded-lg transition-all hover:shadow-[0_0_15px_rgba(0,229,255,0.5)]"
      >
        搜索
      </button>
    </form>
  );
}
