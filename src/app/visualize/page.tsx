// ============================================================
// 可视化图谱页面 — 独立的 3D 星球全屏视图
// 首页已经嵌入了 ForceGraph，这个页面作为深度浏览入口保留
// ============================================================

import { Metadata } from "next";
import { getAllProducts } from "@/lib/data";
import Navbar from "@/components/Navbar";
import ForceGraph from "@/components/ForceGraph";

export const metadata: Metadata = {
  title: "可视化图谱 — ADC Panorama",
};

export default function VisualizePage() {
  const products = getAllProducts();

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-extrabold gradient-text">可视化图谱</h1>
              <p className="text-sm text-cyber-text2 mt-1">
                力导向图 · {products.length} 款 ADC · 点击节点跳转详情
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
          <ForceGraph products={products} />
        </div>
      </main>
    </>
  );
}
