import { Metadata } from "next";
import { Suspense } from "react";
import { getAllProducts, getProductTargets } from "@/lib/data";
import Navbar from "@/components/Navbar";
import StatsCards from "@/components/StatsCards";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import ClickableField from "@/components/ClickableField";

export const metadata: Metadata = {
  title: "ADC Panorama — 全球ADC药物全景图谱",
};

export default function HomePage() {
  const allProducts = getAllProducts();
  const targets = getProductTargets();
  const approved = allProducts.filter((p) => p.stage === "已上市");
  const ind = allProducts.filter((p) => p.stage === "IND");
  const companies = [...new Set(allProducts.map((p) => p.companyOriginator))];
  const topTargets = targets.slice(0, 8);

  return (
    <>
      <Navbar />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-cyber-border">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyber-accent/5 blur-[120px] rounded-full" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              <span className="gradient-text">ADC Panorama</span>
            </h1>
            <p className="mt-4 text-lg text-cyber-text2 max-w-2xl mx-auto">
              全球抗体药物偶联物全景数据库 — 追踪已上市及 IND 阶段 ADC 产品，深度覆盖 CMC、偶联工艺、制剂配方与冻干工艺
            </p>
            <div className="mt-8 flex justify-center">
              <Suspense fallback={<div className="w-full max-w-2xl h-11 bg-cyber-card rounded-xl animate-pulse" />}>
                <SearchBar placeholder="搜索 ADC 药物、靶点、公司..." />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <StatsCards
            drugCount={allProducts.length}
            targetCount={targets.length}
            approvedCount={approved.length}
            indCount={ind.length}
            companyCount={companies.length}
          />
        </section>

        {/* Quick links */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Stage links */}
            <div className="cyber-card p-6">
              <h2 className="text-lg font-bold text-cyber-text mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-cyber-accent rounded-full glow-border" />
                按研发阶段
              </h2>
              <div className="flex flex-wrap gap-2">
                {["已上市", "NDA", "临床III期", "临床II期", "临床I期", "IND"].map((stage) => {
                  const count = allProducts.filter((p) => p.stage === stage).length;
                  if (count === 0) return null;
                  const color =
                    stage === "已上市" ? "green" :
                    stage === "IND" ? "pink" :
                    stage === "NDA" ? "orange" : "accent";
                  return (
                    <ClickableField
                      key={stage}
                      value={`${stage} (${count})`}
                      href={`/products?stage=${encodeURIComponent(stage)}`}
                      color={color as "green" | "pink" | "orange" | "accent"}
                    />
                  );
                })}
              </div>
            </div>

            {/* Top targets */}
            <div className="cyber-card p-6">
              <h2 className="text-lg font-bold text-cyber-text mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full" style={{ backgroundColor: "#ff6ec7", boxShadow: "0 0 10px rgba(255,110,199,0.3)" }} />
                热门靶点
              </h2>
              <div className="flex flex-wrap gap-2">
                {topTargets.map((t) => {
                  const count = allProducts.filter((p) => p.target === t).length;
                  return (
                    <ClickableField
                      key={t}
                      value={`${t} (${count})`}
                      href={`/products?target=${encodeURIComponent(t)}`}
                      color="pink"
                    />
                  );
                })}
              </div>
            </div>

            {/* Conjugation methods */}
            <div className="cyber-card p-6">
              <h2 className="text-lg font-bold text-cyber-text mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full" style={{ backgroundColor: "#b388ff", boxShadow: "0 0 10px rgba(179,136,255,0.3)" }} />
                按偶联方式
              </h2>
              <div className="flex flex-wrap gap-2">
                {[...new Set(allProducts.map((p) => p.conjugationMethod))].slice(0, 8).map((m) => {
                  const count = allProducts.filter((p) => p.conjugationMethod === m).length;
                  return (
                    <ClickableField
                      key={m}
                      value={`${m} (${count})`}
                      href={`/products?conjugationMethod=${encodeURIComponent(m)}`}
                      color="purple"
                    />
                  );
                })}
              </div>
            </div>

            {/* Visualize CTA */}
            <Link href="/visualize" className="cyber-card p-6 relative overflow-hidden group no-underline block">
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-accent/5 via-transparent to-cyber-accent2/5 group-hover:from-cyber-accent/10 group-hover:to-cyber-accent2/10 transition-all rounded-2xl" />
              <div className="relative">
                <h2 className="text-lg font-bold text-cyber-text mb-2">可视化图谱</h2>
                <p className="text-sm text-cyber-text2 mb-4">
                  交互式力导向图 — 直观查看 ADC 药物、靶点、公司、适应症之间的关联，点击任意节点深入探索
                </p>
                <span className="text-sm text-cyber-accent font-bold hover:glow-text transition-all">
                  进入图谱 →
                </span>
              </div>
            </Link>

          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-cyber-border py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-bold gradient-text mb-2">BioDlink</p>
            <p className="text-xs text-cyber-text2/60">
              数据来源：FDA Drugs@FDA · EMA EPAR · PMDA 審査報告書 · NMPA/CDE · ClinicalTrials.gov · Google Patents · PubMed
            </p>
            <p className="text-xs text-cyber-text2/40 mt-1">
              © {new Date().getFullYear()} BioDlink · 由 <span className="text-cyber-accent/70">Lynn</span> 创建维护 · 数据持续更新中
            </p>
          </div>
        </footer>

      </main>
    </>
  );
}
