"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import type { ADCProduct } from "@/lib/api-client";
import { classifyBuffer, classifyStabilizer, classifySurfactant } from "@/lib/classifiers";
import { getProductsWithFormulation } from "@/lib/data";

const PAGE_SIZE = 12;

function phColor(lyoPh: string): string {
  const m = lyoPh.match(/(\d+(?:\.\d+)?)/);
  if (!m) return "text-cyber-text";
  const v = parseFloat(m[1]);
  if (v < 5.5) return "text-cyber-orange";
  if (v <= 7.5) return "text-cyber-green";
  return "text-cyber-accent2";
}

function buildPages(current: number, total: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 2 && i <= current + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }
  return pages;
}

function getData() {
  if (typeof window === "undefined") return [];
  return getProductsWithFormulation();
}

export default function FormulationClient() {
  const allProducts = useMemo(() => getData(), []);
  const lyophilized = allProducts.filter(p => p.lyophilization).length;
  const approved = allProducts.filter(p => p.stage === "已上市").length;

  const bufferClasses = useMemo(
    () => [...new Set(allProducts.map(p => classifyBuffer(p.lyoExcipientsBuffer)).filter(Boolean))].sort(),
    [allProducts]
  );
  const stabilizerClasses = useMemo(
    () => [...new Set(allProducts.map(p => classifyStabilizer(p.lyoExcipientsStabilizer)).filter(Boolean))].sort(),
    [allProducts]
  );
  const surfactantClasses = useMemo(
    () => [...new Set(allProducts.map(p => classifySurfactant(p.lyoExcipientsSurfactant)).filter(Boolean))].sort(),
    [allProducts]
  );
  const phValues = useMemo(
    () => [...new Set(allProducts.map(p => p.lyoPh).filter((v): v is string => !!v))].sort(),
    [allProducts]
  );
  const storageConds = useMemo(
    () => [...new Set(allProducts.map(p => p.storageCondition).filter((v): v is string => !!v))].sort(),
    [allProducts]
  );

  const [dosageFilter, setDosageFilter] = useState("全部");
  const [bufferFilter, setBufferFilter] = useState("全部");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let pool = [...allProducts];
    if (dosageFilter === "冻干粉针") {
      pool = pool.filter(p => p.lyophilization === true);
    } else if (dosageFilter === "注射液") {
      pool = pool.filter(p => p.dosageForm && !p.lyophilization && String(p.dosageForm).includes("液"));
    }
    if (bufferFilter !== "全部") {
      pool = pool.filter(p => classifyBuffer(p.lyoExcipientsBuffer) === bufferFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      pool = pool.filter(p =>
        p.antibody?.toLowerCase().includes(q) ||
        p.brandName?.toLowerCase().includes(q) ||
        p.genericNameCn?.toLowerCase().includes(q)
      );
    }
    return pool;
  }, [allProducts, dosageFilter, bufferFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const setFilter = (setter: (v: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  const [recipeBuffer, setRecipeBuffer] = useState("");
  const [recipeStabilizer, setRecipeStabilizer] = useState("");
  const [recipeSurfactant, setRecipeSurfactant] = useState("");
  const [recipePh, setRecipePh] = useState("");
  const [recipeStorage, setRecipeStorage] = useState("");
  const [recipeMatches, setRecipeMatches] = useState<ADCProduct[]>([]);
  const [recipeAggregate, setRecipeAggregate] = useState<any>(null);
  const [recipeGenerated, setRecipeGenerated] = useState(false);
  const [recipeLoading, setRecipeLoading] = useState(false);

  async function handleGenerateRecipe() {
    if (!recipeBuffer && !recipeStabilizer && !recipeSurfactant && !recipePh && !recipeStorage) return;
    setRecipeLoading(true);
    setRecipeGenerated(true);

    const params = new URLSearchParams();
    if (recipeBuffer) params.set("buffer", recipeBuffer);
    if (recipeStabilizer) params.set("stabilizer", recipeStabilizer);
    if (recipeSurfactant) params.set("surfactant", recipeSurfactant);
    if (recipePh) params.set("ph", recipePh);
    if (recipeStorage) params.set("storage", recipeStorage);

    try {
      const res = await fetch(`/api/formulation/recipe/?${params.toString()}`);
      const data = await res.json();
      setRecipeMatches(data.products || []);
      setRecipeAggregate(data.aggregate || null);
    } catch {
      setRecipeMatches([]);
      setRecipeAggregate(null);
    }
    setRecipeLoading(false);
  }

  function handleRandomSuggest() {
    const pick = (arr: (string | null)[]) => arr.filter(Boolean)[Math.floor(Math.random() * arr.length)] || "";
    setRecipeBuffer(pick(bufferClasses) || "");
    setRecipeStabilizer(pick(stabilizerClasses) || "");
    setRecipeSurfactant(pick(surfactantClasses) || "");
    setRecipePh(pick(phValues) || "");
    setRecipeStorage(pick(storageConds) || "");
  }

  const pageNumbers = useMemo(() => buildPages(page, totalPages), [page, totalPages]);

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold gradient-text">制剂与冻干工艺</h1>
          <p className="text-sm text-cyber-text2 mt-1">
            覆盖冻干粉针与注射液配方数据 · {allProducts.length} 款产品
          </p>
        </div>

        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: "制剂产品", value: allProducts.length, gradient: "from-cyber-accent to-cyan-400" },
            { label: "冻干粉针", value: lyophilized, gradient: "from-cyber-pink to-purple-400" },
            { label: "已上市ADC", value: approved, gradient: "from-cyber-green to-emerald-400" },
            { label: "缓冲体系", value: bufferClasses.length, gradient: "from-cyber-orange to-yellow-400" },
            { label: "总药物数", value: allProducts.length, gradient: "from-cyber-accent2 to-violet-400" },
            { label: "稳定剂种类", value: stabilizerClasses.length, gradient: "from-cyber-green to-teal-400" },
          ].map(card => (
            <div key={card.label} className="cyber-card p-4 text-center">
              <div className={`text-3xl font-extrabold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                {card.value}
              </div>
              <div className="text-xs text-cyber-text2 mt-1">{card.label}</div>
            </div>
          ))}
        </section>

        <section className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-cyber-text2/70 uppercase mr-1">剂型</span>
            {["全部", "冻干粉针", "注射液"].map(opt => (
              <button
                key={opt}
                onClick={() => setFilter(setDosageFilter, opt)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  dosageFilter === opt
                    ? "bg-cyber-accent/15 border-cyber-accent/60 text-cyber-accent"
                    : "border-cyber-border/50 text-cyber-text2/70 hover:border-cyber-border hover:text-cyber-text"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-cyber-text2/70 uppercase mr-1">缓冲</span>
            <button
              onClick={() => setFilter(setBufferFilter, "全部")}
              className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                bufferFilter === "全部"
                  ? "bg-cyber-accent/15 border-cyber-accent/60 text-cyber-accent"
                  : "border-cyber-border/50 text-cyber-text2/70 hover:border-cyber-border hover:text-cyber-text"
              }`}
            >
              全部
            </button>
            {bufferClasses.map(b => (
              <button
                key={b}
                onClick={() => setFilter(setBufferFilter, b)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                  bufferFilter === b
                    ? "bg-cyber-pink/15 border-cyber-pink/60 text-cyber-pink"
                    : "border-cyber-border/50 text-cyber-text2/70 hover:border-cyber-border hover:text-cyber-text"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="搜索抗体或商品名..."
              className="bg-cyber-bg border border-cyber-border rounded-lg px-3 py-1.5 text-sm text-cyber-text placeholder:text-cyber-text2/40 focus:outline-none focus:border-cyber-accent w-64"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                className="text-xs text-cyber-text2/50 hover:text-cyber-text"
              >
                清除
              </button>
            )}
            <span className="text-xs text-cyber-text2/50 ml-auto">
              共 {filtered.length} 款
            </span>
          </div>
        </section>

        <section className="mb-8">
          <div className="cyber-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyber-border text-left text-xs font-semibold text-cyber-text2 uppercase tracking-wider">
                  <th className="p-3 whitespace-nowrap">抗体名称</th>
                  <th className="p-3 whitespace-nowrap hidden md:table-cell">商品名</th>
                  <th className="p-3 whitespace-nowrap">剂型</th>
                  <th className="p-3 whitespace-nowrap hidden lg:table-cell">缓冲体系</th>
                  <th className="p-3 whitespace-nowrap hidden lg:table-cell">稳定剂/赋形剂</th>
                  <th className="p-3 whitespace-nowrap hidden xl:table-cell">表面活性剂</th>
                  <th className="p-3 whitespace-nowrap">pH</th>
                  <th className="p-3 whitespace-nowrap hidden lg:table-cell">储存</th>
                  <th className="p-3 whitespace-nowrap">有效期</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-cyber-text2/50">
                      无匹配数据
                    </td>
                  </tr>
                ) : (
                  paged.map(p => (
                    <tr key={p.id} className="cyber-row border-b border-cyber-border/30">
                      <td className="p-3">
                        <a
                          href={`/products/${p.id}`}
                          className="text-cyber-accent hover:underline font-medium text-sm no-underline"
                        >
                          {p.antibody}
                        </a>
                        <div className="text-xs text-cyber-text2/60 md:hidden mt-0.5">{p.brandName || "-"}</div>
                      </td>
                      <td className="p-3 text-cyber-text hidden md:table-cell">{p.brandName || "-"}</td>
                      <td className="p-3">
                        {p.lyophilization ? (
                          <span className="cyber-badge text-xs px-2 py-0.5 border-cyber-pink/40 text-cyber-pink">冻干</span>
                        ) : p.dosageForm ? (
                          <span className="cyber-badge text-xs px-2 py-0.5 border-cyber-green/40 text-cyber-green">
                            {p.dosageForm.length > 8 ? "注射液" : p.dosageForm}
                          </span>
                        ) : (
                          <span className="text-cyber-text2/40">-</span>
                        )}
                      </td>
                      <td className="p-3 text-cyber-text2 hidden lg:table-cell max-w-[180px] truncate" title={p.lyoExcipientsBuffer || undefined}>
                        {p.lyoExcipientsBuffer || "-"}
                      </td>
                      <td className="p-3 text-cyber-text2 hidden lg:table-cell max-w-[180px] truncate" title={p.lyoExcipientsStabilizer || undefined}>
                        {p.lyoExcipientsStabilizer || p.liquidExcipients || "-"}
                      </td>
                      <td className="p-3 text-cyber-text2 hidden xl:table-cell" title={p.lyoExcipientsSurfactant || undefined}>
                        {p.lyoExcipientsSurfactant || "-"}
                      </td>
                      <td className="p-3">
                        {p.lyoPh ? (
                          <span className={`text-xs font-mono ${phColor(p.lyoPh)}`}>
                            {p.lyoPh}
                          </span>
                        ) : (
                          <span className="text-cyber-text2/40">-</span>
                        )}
                      </td>
                      <td className="p-3 text-cyber-text2 hidden lg:table-cell" title={p.storageCondition || undefined}>
                        {p.storageCondition || "-"}
                      </td>
                      <td className="p-3 text-cyber-text2">
                        {p.shelfLife || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
              {page > 1 && (
                <button onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded-lg text-sm text-cyber-text2 border border-cyber-border hover:border-cyber-accent hover:text-cyber-accent transition-all">
                  上一页
                </button>
              )}
              {pageNumbers.map((item, k) =>
                item === "..." ? (
                  <span key={`dots-${k}`} className="px-2 text-cyber-text2/50">...</span>
                ) : (
                  <button key={item} onClick={() => setPage(item as number)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      item === page
                        ? "bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/50 glow-text"
                        : "text-cyber-text2 border border-transparent hover:border-cyber-border hover:text-cyber-text"
                    }`}>
                    {item}
                  </button>
                )
              )}
              {page < totalPages && (
                <button onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded-lg text-sm text-cyber-text2 border border-cyber-border hover:border-cyber-accent hover:text-cyber-accent transition-all">
                  下一页
                </button>
              )}
              {totalPages > 10 && (
                <span className="flex items-center gap-1 text-xs text-cyber-text2/60 ml-2">
                  跳至
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        const t = parseInt((e.target as HTMLInputElement).value);
                        if (t >= 1 && t <= totalPages) setPage(t);
                      }
                    }}
                    placeholder={String(page)}
                    className="w-16 px-2 py-1 rounded-md bg-cyber-bg border border-cyber-border text-cyber-text text-sm text-center focus:outline-none focus:border-cyber-accent"
                  />
                  / {totalPages} 页
                </span>
              )}
            </div>
          )}
        </section>

        <section className="mb-12">
          <div className="cyber-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-5 bg-cyber-accent rounded-full" />
              <h2 className="text-lg font-bold text-cyber-text">配方生成器</h2>
              <span className="text-xs text-cyber-text2/60 ml-2">选择参数，生成推荐配方</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-cyber-text2/70 uppercase block mb-1">缓冲体系</label>
                  <select
                    value={recipeBuffer}
                    onChange={e => setRecipeBuffer(e.target.value)}
                    className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:outline-none focus:border-cyber-accent appearance-none cursor-pointer"
                  >
                    <option value="">不限</option>
                    {bufferClasses.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-cyber-text2/70 uppercase block mb-1">稳定剂 / 赋形剂</label>
                  <select
                    value={recipeStabilizer}
                    onChange={e => setRecipeStabilizer(e.target.value)}
                    className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:outline-none focus:border-cyber-accent appearance-none cursor-pointer"
                  >
                    <option value="">不限</option>
                    {stabilizerClasses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-cyber-text2/70 uppercase block mb-1">表面活性剂</label>
                  <select
                    value={recipeSurfactant}
                    onChange={e => setRecipeSurfactant(e.target.value)}
                    className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:outline-none focus:border-cyber-accent appearance-none cursor-pointer"
                  >
                    <option value="">不限</option>
                    {surfactantClasses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-cyber-text2/70 uppercase block mb-1">pH 值</label>
                    <select
                      value={recipePh}
                      onChange={e => setRecipePh(e.target.value)}
                      className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:outline-none focus:border-cyber-accent appearance-none cursor-pointer"
                    >
                      <option value="">不限</option>
                      {phValues.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-cyber-text2/70 uppercase block mb-1">储存条件</label>
                    <select
                      value={recipeStorage}
                      onChange={e => setRecipeStorage(e.target.value)}
                      className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:outline-none focus:border-cyber-accent appearance-none cursor-pointer"
                    >
                      <option value="">不限</option>
                      {storageConds.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleRandomSuggest}
                    className="text-sm px-4 py-2 rounded-lg border border-cyber-accent2/40 text-cyber-accent2 hover:bg-cyber-accent2/10 transition-all"
                  >
                    随机推荐
                  </button>
                  <button
                    onClick={handleGenerateRecipe}
                    disabled={recipeLoading}
                    className="text-sm px-6 py-2 rounded-lg bg-cyber-accent hover:bg-cyan-400 text-cyber-bg font-bold transition-all hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] disabled:opacity-50"
                  >
                    {recipeLoading ? "查询中..." : "生成配方"}
                  </button>
                </div>
                {(recipeBuffer || recipeStabilizer || recipeSurfactant || recipePh || recipeStorage) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {recipeBuffer && <span className="text-xs px-2 py-0.5 rounded-full bg-cyber-pink/10 border border-cyber-pink/30 text-cyber-pink">{recipeBuffer}</span>}
                    {recipeStabilizer && <span className="text-xs px-2 py-0.5 rounded-full bg-cyber-green/10 border border-cyber-green/30 text-cyber-green">{recipeStabilizer}</span>}
                    {recipeSurfactant && <span className="text-xs px-2 py-0.5 rounded-full bg-cyber-accent2/10 border border-cyber-accent2/30 text-cyber-accent2">{recipeSurfactant}</span>}
                    {recipePh && <span className="text-xs px-2 py-0.5 rounded-full bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent">{recipePh}</span>}
                    {recipeStorage && <span className="text-xs px-2 py-0.5 rounded-full bg-cyber-orange/10 border border-cyber-orange/30 text-cyber-orange">{recipeStorage}</span>}
                  </div>
                )}
              </div>

              <div className="border-l border-cyber-border/30 pl-6">
                {!recipeGenerated ? (
                  <div className="flex items-center justify-center h-full min-h-[200px]">
                    <p className="text-sm text-cyber-text2/40 text-center">
                      选择参数后点击"生成配方"<br />查看推荐配方和匹配产品
                    </p>
                  </div>
                ) : recipeMatches.length === 0 ? (
                  <div className="flex items-center justify-center h-full min-h-[200px]">
                    <p className="text-sm text-cyber-text2/50 text-center">
                      未找到匹配的产品<br />
                      <span className="text-xs text-cyber-text2/30">尝试减少筛选条件或使用"随机推荐"</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-cyber-text2">匹配</span>
                      <span className="text-lg font-bold text-cyber-accent">{recipeMatches.length}</span>
                      <span className="text-sm text-cyber-text2">款产品</span>
                    </div>

                    {recipeLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-cyber-text2 ml-3">数据库查询中...</span>
                      </div>
                    ) : recipeAggregate && (
                      <div className="cyber-card p-4 space-y-2 text-sm">
                        <h3 className="text-xs font-semibold text-cyber-accent uppercase tracking-wider mb-2">推荐配方（高频聚合）</h3>
                        {recipeAggregate.buffer && (
                          <div className="flex justify-between"><span className="text-cyber-text2/60">缓冲体系</span><span className="text-cyber-text font-medium">{recipeAggregate.buffer}</span></div>
                        )}
                        {recipeAggregate.stabilizer && (
                          <div className="flex justify-between"><span className="text-cyber-text2/60">稳定/赋形剂</span><span className="text-cyber-text font-medium">{recipeAggregate.stabilizer}</span></div>
                        )}
                        {recipeAggregate.surfactant && (
                          <div className="flex justify-between"><span className="text-cyber-text2/60">表面活性剂</span><span className="text-cyber-text font-medium">{recipeAggregate.surfactant}</span></div>
                        )}
                        {recipeAggregate.ph && (
                          <div className="flex justify-between"><span className="text-cyber-text2/60">pH</span><span className="text-cyber-text font-mono">{recipeAggregate.ph}</span></div>
                        )}
                        {recipeAggregate.cycle && (
                          <div className="flex justify-between"><span className="text-cyber-text2/60">冻干周期</span><span className="text-cyber-text font-medium">{recipeAggregate.cycle}</span></div>
                        )}
                        {recipeAggregate.reconstitution && (
                          <div className="flex justify-between"><span className="text-cyber-text2/60">复溶溶媒</span><span className="text-cyber-text font-medium">{recipeAggregate.reconstitution}</span></div>
                        )}
                        {recipeAggregate.storage && (
                          <div className="flex justify-between"><span className="text-cyber-text2/60">储存条件</span><span className="text-cyber-text font-medium">{recipeAggregate.storage}</span></div>
                        )}
                        {recipeAggregate.shelfLife && (
                          <div className="flex justify-between"><span className="text-cyber-text2/60">有效期</span><span className="text-cyber-text font-medium">{recipeAggregate.shelfLife}</span></div>
                        )}
                        {recipeAggregate.container && (
                          <div className="flex justify-between"><span className="text-cyber-text2/60">包材</span><span className="text-cyber-text font-medium">{recipeAggregate.container}</span></div>
                        )}
                      </div>
                    )}

                    <div>
                      <h3 className="text-xs font-semibold text-cyber-text2/70 uppercase mb-2">匹配产品</h3>
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {recipeMatches.slice(0, 20).map(p => (
                          <a
                            key={p.id}
                            href={`/products/${p.id}`}
                            className="block text-sm text-cyber-text hover:text-cyber-accent transition-colors py-1 no-underline"
                          >
                            <span className="text-cyber-accent">{p.antibody}</span>
                            {p.brandName && <span className="text-cyber-text2/60 ml-1.5">({p.brandName})</span>}
                          </a>
                        ))}
                        {recipeMatches.length > 20 && (
                          <p className="text-xs text-cyber-text2/40 pt-1">
                            还有 {recipeMatches.length - 20} 款产品...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
