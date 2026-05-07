"use client";

import Link from "next/link";
import { ADCProduct } from "@/lib/types";

// 不同阶段对应的徽章颜色
const phaseBadge: Record<string, string> = {
  "已上市": "border-cyber-green/50 text-cyber-green",
  "NDA": "border-cyber-orange/50 text-cyber-orange",
  "临床III期": "border-cyber-accent/50 text-cyber-accent",
  "临床II期": "border-cyber-accent2/50 text-cyber-accent2",
  "临床I期": "border-cyber-pink/50 text-cyber-pink",
  "IND": "border-cyber-pink/50 text-cyber-pink",
};

type TableProps = {
  items: ADCProduct[];
};

// 超长文字截断组件，带title悬浮全称
function EllipsisText({ raw, cap = 20 }: { raw: string; cap?: number }) {
  if (!raw || raw === "未公开") return <span className="text-cyber-text2/40 text-xs">-</span>;
  const short = raw.length > cap ? raw.slice(0, cap) + "…" : raw;
  return (
    <span className="text-xs text-cyber-text2" title={raw}>
      {short}
    </span>
  );
}

export default function ProductTable({ items }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b border-cyber-border text-left">
            <th className="py-3 px-3 text-cyber-text2 font-medium text-xs uppercase tracking-wider w-[16%]">商品名</th>
            <th className="py-3 px-3 text-cyber-text2 font-medium text-xs uppercase tracking-wider w-[10%]">靶点</th>
            <th className="py-3 px-3 text-cyber-text2 font-medium text-xs uppercase tracking-wider w-[22%] hidden md:table-cell">适应症</th>
            <th className="py-3 px-3 text-cyber-text2 font-medium text-xs uppercase tracking-wider w-[9%]">阶段</th>
            <th className="py-3 px-3 text-cyber-text2 font-medium text-xs uppercase tracking-wider w-[14%] hidden lg:table-cell">公司</th>
            <th className="py-3 px-3 text-cyber-text2 font-medium text-xs uppercase tracking-wider w-[16%] hidden xl:table-cell">偶联方式</th>
            <th className="py-3 px-3 text-cyber-text2 font-medium text-xs uppercase tracking-wider w-[8%] hidden xl:table-cell">批准</th>
          </tr>
        </thead>
        <tbody>
          {items.map((drug) => (
            <tr key={drug.id} className="cyber-row border-b border-cyber-border/30">
              {/* 商品名 + 通用名 */}
              <td className="py-3 px-3">
                <Link
                  href={`/products/${drug.id}/`}
                  className="font-semibold text-cyber-text hover:text-cyber-accent transition-colors no-underline text-xs"
                  title={drug.genericNameEn}
                >
                  <EllipsisText raw={drug.brandName} cap={22} />
                </Link>
                <div className="text-[10px] text-cyber-text2/50 mt-0.5 truncate">{drug.genericNameEn}</div>
              </td>

              {/* 靶点，可点击跳转筛选 */}
              <td className="py-3 px-3">
                {drug.target ? (
                  <Link
                    href={`/products?target=${encodeURIComponent(drug.target)}`}
                    className="cyber-badge border-cyber-pink/50 text-cyber-pink hover:border-cyber-pink no-underline text-[11px] max-w-full truncate block"
                    title={drug.target}
                  >
                    {drug.target.length > 12 ? drug.target.slice(0, 10) + "…" : drug.target}
                  </Link>
                ) : (
                  <span className="text-cyber-text2/40 text-xs">-</span>
                )}
              </td>

              {/* 适应症，最多展示2个 */}
              <td className="py-3 px-3 hidden md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {drug.indication.slice(0, 2).map((ind) => (
                    <Link
                      key={ind}
                      href={`/products?indication=${encodeURIComponent(ind)}`}
                      className="text-[11px] text-cyber-text2 hover:text-cyber-accent transition-colors no-underline truncate max-w-[140px]"
                      title={ind}
                    >
                      {ind}
                    </Link>
                  ))}
                  {drug.indication.length > 2 && (
                    <span className="text-[10px] text-cyber-text2/50">+{drug.indication.length - 2}</span>
                  )}
                </div>
              </td>

              {/* 阶段徽章 */}
              <td className="py-3 px-3">
                <Link
                  href={`/products?stage=${encodeURIComponent(drug.stage)}`}
                  className={`cyber-badge text-[11px] ${phaseBadge[drug.stage] || "border-cyber-border text-cyber-text2"} no-underline`}
                >
                  {drug.stage.length > 8 ? drug.stage.slice(0, 6) + "…" : drug.stage}
                </Link>
              </td>

              {/* 公司，大屏才显示 */}
              <td className="py-3 px-3 hidden lg:table-cell">
                {drug.companyOriginator ? (
                  <Link
                    href={`/products?company=${encodeURIComponent(drug.companyOriginator)}`}
                    className="text-cyber-text2 hover:text-cyber-accent transition-colors no-underline text-xs"
                    title={drug.companyOriginator}
                  >
                    {drug.companyOriginator.length > 18 ? drug.companyOriginator.slice(0, 15) + "…" : drug.companyOriginator}
                  </Link>
                ) : (
                  <span className="text-cyber-text2/40 text-xs">-</span>
                )}
              </td>

              {/* 偶联方式，超大屏才显示 */}
              <td className="py-3 px-3 hidden xl:table-cell">
                {drug.conjugationMethod ? (
                  <Link
                    href={`/products?conjugationMethod=${encodeURIComponent(drug.conjugationMethod)}`}
                    className="text-[11px] text-cyber-text2 hover:text-cyber-accent transition-colors no-underline"
                    title={drug.conjugationMethod}
                  >
                    {drug.conjugationMethod.length > 20 ? drug.conjugationMethod.slice(0, 17) + "…" : drug.conjugationMethod}
                  </Link>
                ) : (
                  <span className="text-cyber-text2/40 text-xs">-</span>
                )}
              </td>

              <td className="py-3 px-3 hidden xl:table-cell text-cyber-text2 text-xs">
                {drug.approvalYear || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
