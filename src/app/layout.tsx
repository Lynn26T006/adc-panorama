import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-full flex flex-col bg-cyber-bg text-cyber-text">
        {children}
      </body>
    </html>
  );
}
