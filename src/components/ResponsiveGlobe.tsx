"use client";

import { useState, useEffect } from "react";

export default function ResponsiveGlobe({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) {
    return (
      <div className="relative flex items-center justify-center min-h-[300px] bg-[#020810]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,229,255,0.08)_0%,_transparent_70%)]" />
        <div className="relative text-center px-4 py-12">
          <div className="text-5xl mb-4">&#127758;</div>
          <h2 className="text-lg font-bold text-cyber-text mb-2">3D 药物星球图谱</h2>
          <p className="text-sm text-cyber-text2/60 mb-4 max-w-xs mx-auto">
            请在电脑端打开以体验交互式 3D 可视化
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
