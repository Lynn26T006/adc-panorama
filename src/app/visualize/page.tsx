import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ForceGraphWrapper from "@/components/ForceGraphWrapper";
import { getAllProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "可视化图谱，ADC Panorama",
};

export default function VisualizePage() {
  const allProducts = getAllProducts();

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-extrabold gradient-text">可视化图谱</h1>
              <p className="text-sm text-cyber-text2 mt-1">
                力导向图 · 点击节点跳转详情
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
          <ForceGraphWrapper products={allProducts} />
        </div>
      </main>
    </>
  );
}
