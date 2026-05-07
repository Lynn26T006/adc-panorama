import type { Metadata } from "next";
import "./globals.css";
import MeteorBackground from "@/components/MeteorBackground";

export const metadata: Metadata = {
  title: "ADC Panorama — 全球ADC药物全景图谱",
  description: "追踪全球已上市及IND阶段抗体药物偶联物(ADC)，涵盖靶点、CMC、偶联工艺、制剂配方等深度数据。由 Lynn 创建维护。",
  authors: [{ name: "Lynn", url: "https://github.com/lynn" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&family=Noto+Sans+SC:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-cyber-bg text-cyber-text relative">
        <MeteorBackground />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-cyber-border py-6">
          <div className="max-w-6xl mx-auto px-4 text-center space-y-1.5">
            <p className="text-xs text-cyber-text2/50">
              数据来源：FDA Drugs@FDA · EMA EPAR · PMDA · NMPA/CDE · ClinicalTrials.gov · Google Patents · PubMed · ADCdb · PubChem · RCSB PDB
            </p>
            <p className="text-[10px] text-cyber-text2/30 max-w-2xl mx-auto leading-relaxed">
              免责声明：本数据库内容仅供参考和学术研究使用，不构成任何医学建议、诊断或治疗推荐。用药决策请咨询专业医师。数据来源于公开数据库，BioDlink 不对其准确性、完整性做任何保证。
            </p>
            <p className="text-[10px] text-cyber-text2/30">
              © {new Date().getFullYear()} BioDlink · 保留所有权利
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
