"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import {
  getProductsWithFormulation,
  getDosageForms,
  getBufferClasses,
  getStabilizerClasses,
  getSurfactantClasses,
  getLyoPhValues,
  getStorageConditions,
  classifyBuffer,
  classifyStabilizer,
  classifySurfactant,
} from "@/lib/data";
import type { ADCProduct } from "@/lib/types";

const PAGE_SIZE = 12;

function hasFormulationDetail(p: ADCProduct): boolean {
  return !!(p.lyoExcipientsBuffer || p.lyoExcipientsStabilizer || p.lyoExcipientsSurfactant || p.lyoPh || p.lyoCycle || p.liquidExcipients);
}

export default function FormulationPage() {
  const all = useMemo(() => getProductsWithFormulation(), []);
  const withDetail = useMemo(() => all.filter(hasFormulationDetail), [all]);
  const dosageForms = useMemo(() => getDosageForms(), []);
  const bufferClasses = useMemo(() => getBufferClasses(), []);
  const stabilizerClasses = useMemo(() => getStabilizerClasses(), []);
  const surfactantClasses = useMemo(() => getSurfactantClasses(), []);
  const phValues = useMemo(() => getLyoPhValues(), []);
  const storageConds = useMemo(() => getStorageConditions(), []);

  // 统计（只统计有配方细节的产品）
  const stats = useMemo(() => {
    const lyo = withDetail.filter(p => p.lyophilization === true);
    const liquid = withDetail.filter(p => !p.lyophilization && !!p.liquidExcipients);
    const ph6plus = withDetail.filter(p => {
      const ph = p.lyoPh;
      if (!ph) return false;
      const m = ph.match(/(\d+(?:\.\d+)?)/);
      return m && parseFloat(m[1]) >= 6;
    });
    return {
      total: withDetail.length,
      lyo: lyo.length,
      liquid: liquid.length,
      buffers: bufferClasses.length,
      ph6plus: ph6plus.length,
      cycles: new Set(withDetail.map(p => p.lyoCycle).filter(Boolean)).size,
    };
  }, [withDetail, bufferClasses]);

  // 筛选状态
  const [dosageFilter, setDosageFilter] = useState("全部");
  const [bufferFilter, setBufferFilter] = useState("全部");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detailOnly, setDetailOnly] = useState(true);

  // 过滤
  const filtered = useMemo(() => {
    let pool = [...all];
    if (dosageFilter === "冻干粉针") {
      pool = pool.filter(p => p.lyophilization === true);
    } else if (dosageFilter === "注射液") {
      pool = pool.filter(p => p.dosageForm && !p.lyophilization);
    } else if (dosageFilter !== "全部") {
      pool = pool.filter(p => p.dosageForm === dosageFilter);
    }
    if (bufferFilter !== "全部") {
      pool = pool.filter(p => classifyBuffer(p.lyoExcipientsBuffer) === bufferFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      pool = pool.filter(p =>
        p.antibody.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.genericNameEn.toLowerCase().includes(q)
      );
    }
    return pool;
  }, [all, dosageFilter, bufferFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // 切换筛选时回到第一页
  const setFilter = (setter: (v: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  // 配方生成器状态
  const [recipeBuffer, setRecipeBuffer] = useState("");
  const [recipeStabilizer, setRecipeStabilizer] = useState("");
  const [recipeSurfactant, setRecipeSurfactant] = useState("");
  const [recipePh, setRecipePh] = useState("");
  const [recipeStorage, setRecipeStorage] = useState("");
  const [recipeMatches, setRecipeMatches] = useState<ADCProduct[]>([]);
  const [recipeGenerated, setRecipeGenerated] = useState(false);

  function handleGenerateRecipe() {
    if (!recipeBuffer && !recipeStabilizer && !recipeSurfactant && !recipePh && !recipeStorage) {
      return;
    }
    const matches = all.filter(p => {
      if (recipeBuffer && classifyBuffer(p.lyoExcipientsBuffer) !== recipeBuffer) return false;
      if (recipeStabilizer) {
        const s = classifyStabilizer(p.lyoExcipientsStabilizer);
        if (s !== recipeStabilizer && !p.lyoExcipientsStabilizer?.includes(recipeStabilizer)) return false;
      }
      if (recipeSurfactant) {
        const sf = classifySurfactant(p.lyoExcipientsSurfactant);
        if (sf !== recipeSurfactant && !p.lyoExcipientsSurfactant?.includes(recipeSurfactant)) return false;
      }
      if (recipePh && p.lyoPh !== recipePh) return false;
      if (recipeStorage && p.storageCondition !== recipeStorage) return false;
      return true;
    });
    setRecipeMatches(matches);
    setRecipeGenerated(true);
    setPage(1);
  }

  // 聚合配方：取匹配产品中最常见的字段值
  function mostCommon<T>(items: T[]): T | undefined {
    const freq = new Map<string, { val: T; count: number }>();
    for (const item of items) {
      const k = String(item);
      const entry = freq.get(k) || { val: item, count: 0 };
      entry.count++;
      freq.set(k, entry);
    }
    let best: { val: T; count: number } | undefined;
    for (const entry of freq.values()) {
      if (!best || entry.count > best.count) best = entry;
    }
    return best?.val;
  }

  const aggregateRecipe = useMemo(() => {
    if (recipeMatches.length === 0) return null;
    // 取第一个匹配产品作为参考，聚合高频值
    const buffers = recipeMatches.map(p => p.lyoExcipientsBuffer).filter(Boolean);
    const stabs = recipeMatches.map(p => p.lyoExcipientsStabilizer).filter(Boolean);
    const surfs = recipeMatches.map(p => p.lyoExcipientsSurfactant).filter(Boolean);
    const phs = recipeMatches.map(p => p.lyoPh).filter(Boolean);
    const cycles = recipeMatches.map(p => p.lyoCycle).filter(Boolean);
    const recons = recipeMatches.map(p => p.reconstitutionMedia).filter(Boolean);
    const storages = recipeMatches.map(p => p.storageCondition).filter(Boolean);
    const shelves = recipeMatches.map(p => p.shelfLife).filter(Boolean);
    const containers = recipeMatches.map(p => p.containerClosure).filter(Boolean);
    return {
      buffer: mostCommon(buffers) || "",
      stabilizer: mostCommon(stabs) || "",
      surfactant: mostCommon(surfs) || "",
      ph: mostCommon(phs) || "",
      cycle: mostCommon(cycles) || "",
      reconstitution: mostCommon(recons) || "",
      storage: mostCommon(storages) || "",
      shelfLife: mostCommon(shelves) || "",
      container: mostCommon(containers) || "",
    };
  }, [recipeMatches]);

  function handleRandomSuggest() {
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    setRecipeBuffer(pick(bufferClasses) || "");
    setRecipeStabilizer(pick(stabilizerClasses) || "");
    setRecipeSurfactant(pick(surfactantClasses) || "");
    setRecipePh(pick(phValues) || "");
    setRecipeStorage(pick(storageConds) || "");
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold gradient-text">制剂与冻干工艺</h1>
          <p className="text-sm text-cyber-text2 mt-1">
            覆盖冻干粉针与注射液配方数据 · {all.length} 款产品
          </p>
        </div>

        {/* 统计卡片 */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: "制剂产品", value: stats.total, gradient: "from-cyber-accent to-cyan-400" },
            { label: "冻干粉针", value: stats.lyo, gradient: "from-cyber-pink to-purple-400" },
            { label: "注射液/溶液", value: stats.liquid, gradient: "from-cyber-green to-emerald-400" },
            { label: "缓冲体系", value: stats.buffers, gradient: "from-cyber-orange to-yellow-400" },
            { label: "pH ≥ 6 产品", value: stats.ph6plus, gradient: "from-cyber-accent2 to-violet-400" },
            { label: "冻干周期种类", value: stats.cycles, gradient: "from-cyber-green to-teal-400" },
          ].map(card => (
            <div key={card.label} className="cyber-card p-4 text-center">
              <div className={`text-3xl font-extrabold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                {card.value}
              </div>
              <div className="text-xs text-cyber-text2 mt-1">{card.label}</div>
            </div>
          ))}
        </section>

        {/* 快速筛选 */}
        <section className="mb-6 space-y-3">
          {/* 剂型筛选 */}
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

          {/* 缓冲体系筛选 */}
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

          {/* 搜索 */}
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

        {/* 产品表格 */}
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
                          <span className={`text-xs font-mono ${
                            (() => {
                              const m = p.lyoPh.match(/(\d+(?:\.\d+)?)/);
                              if (m) {
                                const v = parseFloat(m[1]);
                                if (v < 5.5) return "text-cyber-orange";
                                if (v <= 7.5) return "text-cyber-green";
                                return "text-cyber-accent2";
                              }
                              return "text-cyber-text";
                            })()
                          }`}>
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
              {(() => {
                const wing = 2;
                const pages: (number | "...")[] = [];
                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= page - wing && i <= page + wing)) {
                    pages.push(i);
                  } else if (pages[pages.length - 1] !== "...") {
                    pages.push("...");
                  }
                }
                return pages.map((item, k) =>
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
                );
              })()}
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

        {/* 配方生成器 */}
        <section className="mb-12">
          <div className="cyber-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-5 bg-cyber-accent rounded-full" />
              <h2 className="text-lg font-bold text-cyber-text">配方生成器</h2>
              <span className="text-xs text-cyber-text2/60 ml-2">选择参数，生成推荐配方</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 左侧：参数选择 */}
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
                    className="text-sm px-6 py-2 rounded-lg bg-cyber-accent hover:bg-cyan-400 text-cyber-bg font-bold transition-all hover:shadow-[0_0_15px_rgba(0,229,255,0.5)]"
                  >
                    生成配方
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

              {/* 右侧：生成结果 */}
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

                    {/* 聚合配方卡片 */}
                    {aggregateRecipe && (
                      <div className="cyber-card p-4 space-y-2 text-sm">
                        <h3 className="text-xs font-semibold text-cyber-accent uppercase tracking-wider mb-2">推荐配方</h3>
                        {aggregateRecipe.buffer && (
                          <div className="flex justify-between">
                            <span className="text-cyber-text2/60">缓冲体系</span>
                            <span className="text-cyber-text font-medium">{aggregateRecipe.buffer}</span>
                          </div>
                        )}
                        {aggregateRecipe.stabilizer && (
                          <div className="flex justify-between">
                            <span className="text-cyber-text2/60">稳定/赋形剂</span>
                            <span className="text-cyber-text font-medium">{aggregateRecipe.stabilizer}</span>
                          </div>
                        )}
                        {aggregateRecipe.surfactant && (
                          <div className="flex justify-between">
                            <span className="text-cyber-text2/60">表面活性剂</span>
                            <span className="text-cyber-text font-medium">{aggregateRecipe.surfactant}</span>
                          </div>
                        )}
                        {aggregateRecipe.ph && (
                          <div className="flex justify-between">
                            <span className="text-cyber-text2/60">pH</span>
                            <span className="text-cyber-text font-mono">{aggregateRecipe.ph}</span>
                          </div>
                        )}
                        {aggregateRecipe.cycle && (
                          <div className="flex justify-between">
                            <span className="text-cyber-text2/60">冻干周期</span>
                            <span className="text-cyber-text font-medium">{aggregateRecipe.cycle}</span>
                          </div>
                        )}
                        {aggregateRecipe.reconstitution && (
                          <div className="flex justify-between">
                            <span className="text-cyber-text2/60">复溶溶媒</span>
                            <span className="text-cyber-text font-medium">{aggregateRecipe.reconstitution}</span>
                          </div>
                        )}
                        {aggregateRecipe.storage && (
                          <div className="flex justify-between">
                            <span className="text-cyber-text2/60">储存条件</span>
                            <span className="text-cyber-text font-medium">{aggregateRecipe.storage}</span>
                          </div>
                        )}
                        {aggregateRecipe.shelfLife && (
                          <div className="flex justify-between">
                            <span className="text-cyber-text2/60">有效期</span>
                            <span className="text-cyber-text font-medium">{aggregateRecipe.shelfLife}</span>
                          </div>
                        )}
                        {aggregateRecipe.container && (
                          <div className="flex justify-between">
                            <span className="text-cyber-text2/60">包材</span>
                            <span className="text-cyber-text font-medium">{aggregateRecipe.container}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 匹配产品列表 */}
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
