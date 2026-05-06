"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "首页" },
    { href: "/products", label: "产品列表" },
    { href: "/visualize", label: "可视化图谱" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-cyber-border bg-cyber-bg/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="text-lg font-extrabold tracking-wider gradient-text">
              ADC Panorama
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 no-underline ${
                  pathname === l.href
                    ? "bg-cyber-accent/15 text-cyber-accent glow-text"
                    : "text-cyber-text2 hover:text-cyber-text hover:bg-white/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
