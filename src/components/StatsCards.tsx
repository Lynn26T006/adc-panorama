"use client";

import Link from "next/link";

interface Stat {
  label: string;
  value: number;
  unit?: string;
  href: string;
  color: string;
}

interface Props {
  drugCount: number;
  targetCount: number;
  approvedCount: number;
  indCount: number;
  companyCount: number;
}

export default function StatsCards({ drugCount, targetCount, approvedCount, indCount, companyCount }: Props) {
  const stats: Stat[] = [
    { label: "ADC 产品", value: drugCount, unit: "款", href: "/products", color: "from-cyber-accent to-cyan-400" },
    { label: "已上市", value: approvedCount, unit: "款", href: "/products?stage=已上市", color: "from-cyber-green to-green-300" },
    { label: "IND 阶段", value: indCount, unit: "款", href: "/products?stage=IND", color: "from-cyber-pink to-pink-300" },
    { label: "靶点", value: targetCount, unit: "个", href: "/products?sort=target", color: "from-cyber-orange to-yellow-300" },
    { label: "开发公司", value: companyCount, unit: "家", href: "/products?sort=companyOriginator", color: "from-cyber-accent2 to-violet-300" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <Link
          key={s.label}
          href={s.href}
          className="cyber-card p-4 text-center no-underline group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-current/5 rounded-2xl" />
          <div className={`text-3xl font-extrabold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
            {s.value}
          </div>
          <div className="text-xs text-cyber-text2 mt-1 group-hover:text-cyber-text transition-colors">
            {s.label}
          </div>
        </Link>
      ))}
    </div>
  );
}
