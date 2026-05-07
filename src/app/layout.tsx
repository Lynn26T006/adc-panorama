// 根布局组件，整个网站的HTML框架
// 所有页面都包裹在这个布局里，包含导航栏、页脚、流星背景

import type { Metadata } from "next";
import "./globals.css";
import MeteorBackground from "@/components/MeteorBackground";

// 搜索引擎和社交分享用的元数据
export const metadata: Metadata = {
  title: "ADC Panorama，全球ADC药物全景图谱",
  description: "追踪全球已上市及IND阶段抗体药物偶联物(ADC)，涵盖靶点、CMC、偶联工艺、制剂配方等深度数据。由 Lynn 创建维护。",
  authors: [{ name: "Lynn", url: "https://github.com/lynn26T006" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // lang="zh-CN" 告诉浏览器这是中文网站，antialiased让字体边缘更平滑
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        {/* 预连接 Google Fonts 服务器，加载 Inter(英文) + Noto Sans SC(中文) 字体 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&family=Noto+Sans+SC:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      {/*
        flex flex-col: 让内容区和页脚自动分摊高度
        bg-cyber-bg: 赛博朋克风格深色背景
        relative: 为流星背景提供定位锚点
      */}
      <body className="min-h-full flex flex-col bg-cyber-bg text-cyber-text relative">
        {/* 全站背景流星动画，固定在屏幕后方，不响应鼠标事件 */}
        <MeteorBackground />

        {/* flex-1 让内容区自动撑满剩余空间，把页脚推到底部 */}
        <div className="flex-1">{children}</div>

        {/* 全局页脚，所有页面共用 */}
        <footer className="border-t border-cyber-border py-6">
          <div className="max-w-6xl mx-auto px-4 text-center space-y-1.5">
            {/* 数据来源声明，列出所有引用的公开数据库 */}
            <p className="text-xs text-cyber-text2/50">
              数据来源：FDA Drugs@FDA · EMA EPAR · PMDA · NMPA/CDE · ClinicalTrials.gov · Google Patents · PubMed · ADCdb · PubChem · RCSB PDB
            </p>
            {/* 免责声明，法律合规必备 */}
            <p className="text-[10px] text-cyber-text2/30 max-w-2xl mx-auto leading-relaxed">
              免责声明：本数据库内容仅供参考和学术研究使用，不构成任何医学建议、诊断或治疗推荐。用药决策请咨询专业医师。数据来源于公开数据库，BioDlink 不对其准确性、完整性做任何保证。
            </p>
            {/* 版权信息，© + 年份 + 权利声明 */}
            <p className="text-[10px] text-cyber-text2/30">
              © {new Date().getFullYear()} BioDlink · 保留所有权利
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
