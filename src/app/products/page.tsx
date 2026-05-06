import { Metadata } from "next";
import {
  filterAndPaginate,
  getProductStages,
  getProductTargets,
  getProductIndications,
  getConjugationMethods,
  getPayloadClasses,
  getLinkerTypes,
} from "@/lib/data";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import ProductTable from "@/components/ProductTable";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import FilterPanel from "@/components/FilterPanel";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "ADC 产品列表 — ADC Panorama",
};

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") params[k] = v;
    else if (Array.isArray(v)) params[k] = v[0];
  }

  const { products, total, page, totalPages } = filterAndPaginate({
    search: params.search,
    stage: params.stage,
    target: params.target,
    indication: params.indication,
    company: params.company,
    conjugationMethod: params.conjugationMethod,
    payloadClass: params.payloadClass,
    linkerType: params.linkerType,
    sort: params.sort,
    order: params.order as "asc" | "desc" | undefined,
    page: params.page ? parseInt(params.page) : 1,
    pageSize: 15,
  });

  const stages = getProductStages();
  const targets = getProductTargets();
  const indications = getProductIndications();
  const conjugationMethods = getConjugationMethods();
  const payloadClasses = getPayloadClasses();
  const linkerTypes = getLinkerTypes();

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
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
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-64 shrink-0">
            <Suspense>
              <FilterPanel
                stages={stages}
                targets={targets}
                indications={indications}
                conjugationMethods={conjugationMethods}
                payloadClasses={payloadClasses}
                linkerTypes={linkerTypes}
              />
            </Suspense>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Table (desktop) */}
            <div className="hidden md:block cyber-card overflow-hidden">
              <Suspense>
                <ProductTable products={products} />
              </Suspense>
            </div>

            {/* Cards (mobile) */}
            <div className="md:hidden space-y-3">
              <Suspense>
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </Suspense>
            </div>

            {products.length === 0 && (
              <div className="cyber-card p-12 text-center">
                <p className="text-cyber-text2 text-lg">未找到匹配的 ADC 产品</p>
                <p className="text-sm text-cyber-text2/60 mt-2">尝试调整搜索条件或清除筛选器</p>
              </div>
            )}

            <Suspense>
              <Pagination totalPages={totalPages} currentPage={page} />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}
