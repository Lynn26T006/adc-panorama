"use client";

import Link from "next/link";

type StatItem = {
  title: string;
  count: number;
  suffix: string;
  link: string;
  grad: string;
};

type StatProps = {
  drugCount: number;
  targetCount: number;
  approvedCount: number;
  indCount: number;
  clinicalCount: number;
  companyCount: number;
};

function buildItems(p: StatProps): StatItem[] {
  return [
    { title: "ADC 产品", count: p.drugCount, suffix: "款", link: "/products", grad: "from-cyber-accent to-cyan-400" },
    { title: "已上市", count: p.approvedCount, suffix: "款", link: "/products?stage=已上市", grad: "from-cyber-green to-green-300" },
    { title: "IND 阶段", count: p.indCount, suffix: "款", link: "/products?stage=IND", grad: "from-cyber-pink to-pink-300" },
    { title: "临床阶段", count: p.clinicalCount, suffix: "款", link: "/products?stage=临床III期", grad: "from-[#00e5ff] to-cyan-300" },
    { title: "靶点", count: p.targetCount, suffix: "个", link: "/products?sort=target", grad: "from-cyber-orange to-yellow-300" },
    { title: "开发公司", count: p.companyCount, suffix: "家", link: "/products?sort=companyOriginator", grad: "from-cyber-accent2 to-violet-300" },
  ];
}

export default function StatsCards(props: StatProps) {
  const entries = buildItems(props);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {entries.map((e) => (
        <Link
          key={e.title}
          href={e.link}
          className="cyber-card p-4 text-center no-underline group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-current/5 rounded-2xl" />
          <div className={`text-3xl font-extrabold bg-gradient-to-r ${e.grad} bg-clip-text text-transparent`}>
            {e.count}
          </div>
          <div className="text-xs text-cyber-text2 mt-1 group-hover:text-cyber-text transition-colors">
            {e.title}
          </div>
        </Link>
      ))}
    </div>
  );
}
