"use client";

import Link from "next/link";

interface Props {
  value: string;
  href?: string;
  external?: boolean;
  className?: string;
  badge?: boolean;
  color?: "accent" | "green" | "pink" | "orange" | "purple" | "default";
}

const colorMap = {
  accent: "border-cyber-accent/50 text-cyber-accent hover:border-cyber-accent hover:text-cyber-accent",
  green: "border-cyber-green/50 text-cyber-green hover:border-cyber-green hover:text-cyber-green",
  pink: "border-cyber-pink/50 text-cyber-pink hover:border-cyber-pink hover:text-cyber-pink",
  orange: "border-cyber-orange/50 text-cyber-orange hover:border-cyber-orange hover:text-cyber-orange",
  purple: "border-cyber-accent2/50 text-cyber-accent2 hover:border-cyber-accent2 hover:text-cyber-accent2",
  default: "border-cyber-border text-cyber-text2 hover:border-cyber-accent/50 hover:text-cyber-text",
};

export default function ClickableField({
  value,
  href,
  external,
  className = "",
  badge = true,
  color = "default",
}: Props) {
  if (!value || value === "未公开" || value === "-" || value === "") {
    return <span className="text-cyber-text2/50 text-sm">{value || "-"}</span>;
  }

  const baseStyle = badge
    ? `cyber-badge ${colorMap[color]}`
    : `text-sm transition-all duration-200 cursor-pointer hover:text-cyber-accent hover:underline decoration-cyber-accent/50 underline-offset-4 ${colorMap[color]}`;

  if (external && href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseStyle} ${className}`}
      >
        {value}
        <svg className="w-3 h-3 ml-1 inline opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
        </svg>
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={`${baseStyle} ${className}`}>
        {value}
      </Link>
    );
  }

  return <span className={`${baseStyle} ${className} cursor-default`}>{value}</span>;
}
