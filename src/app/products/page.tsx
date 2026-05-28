"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchDrugs, PaginatedResult } from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import ProductTable from "@/components/ProductTable";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import FilterPanel from "@/components/FilterPanel";

interface FilterData {
  stages: string[];
  targets: string[];
  indications: string[];
  conjugationMethods: string[];
  payloadClasses: string[];
  linkerTypes: string[];
}

function parseParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  const params: Record<string, string> = {};
  sp.forEach((v, k) => { params[k] = v; });
  return params;
}

export default function ProductsPage() {
  const [result, setResult] = useState<PaginatedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterData>({
    stages: [], targets: [], indications: [],
    conjugationMethods: [], payloadClasses: [], linkerTypes: [],
  });

  const loadData = useCallback(async () => {
    const params = parseParams();
    setLoading(true);
    try {
      const r = await fetchDrugs({
        search: params.search,
        stage: params.stage,
        target: params.target,
        payloadClass: params.payloadClass,
        conjugationMethod: params.conjugationMethod,
        sort: params.sort,
        order: params.order as "asc" | "desc" | undefined,
        page: params.page ? parseInt(params.page) : 1,
        pageSize: 15,
      });
      setResult(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    fetch("/api/filters/").then(r => r.json()).then(setFilters).catch(() => {});
    const handlePop = () => loadData();
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [loadData]);

  if (!result || loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-extrabold gradient-text">ADC 产品列表</h1>
            </div>
          </div>
          <div className="cyber-card p-12 text-center">
            <div className="w-8 h-8 mx-auto border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </>
    );
  }

  const { products, total, page, totalPages } = result;
  const params = parseParams();

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold gradient-text">ADC 产品列表</h1>
            <p className="text-sm text-cyber-text2 mt-1">
              共 <span className="text-cyber-accent font-bold">{total}</span> 款 ADC 产品
              {params.search && (
                <>
                  {" "}搜索: <span className="text-cyber-text">&quot;{params.search}&quot;</span>
                </>
              )}
            </p>
          </div>
          <SearchBar />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-64 shrink-0">
            <FilterPanel
              stages={filters.stages}
              targets={filters.targets}
              indications={filters.indications}
              conjugationMethods={filters.conjugationMethods}
              payloadClasses={filters.payloadClasses}
              linkerTypes={filters.linkerTypes}
            />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="hidden md:block cyber-card overflow-hidden">
              <ProductTable items={products} />
            </div>
            <div className="md:hidden space-y-3">
              {products.map((p) => (
                <ProductCard key={p.id} drug={p} />
              ))}
            </div>
            {products.length === 0 && (
              <div className="cyber-card p-12 text-center">
                <p className="text-cyber-text2 text-lg">未找到匹配的 ADC 产品</p>
                <p className="text-sm text-cyber-text2/60 mt-2">尝试调整搜索条件或清除筛选器</p>
              </div>
            )}
            <Pagination totalPages={totalPages} currentPage={page} />
          </div>
        </div>
      </main>
    </>
  );
}
