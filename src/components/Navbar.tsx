"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const route = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/notifications/");
      const data = await res.json();
      setNotifications(data.notifications?.slice(0, 10) || []);
      setUnreadCount(data.unreadCount || 0);
    } catch { /* ignore */ }
  }, [session]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications/all/", { method: "PUT" });
    setUnreadCount(0);
    setNotifications(notifications.map((n: any) => ({ ...n, read: 1 })));
  }

  const tabs = [
    { href: "/", label: "首页" },
    { href: "/products", label: "产品列表" },
    { href: "/formulation", label: "制剂冻干" },
    { href: "/visualize", label: "可视化图谱" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-cyber-border bg-cyber-bg/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
            <span className="text-lg font-extrabold tracking-wider gradient-text">
              ADC Panorama
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {tabs.map((t) => {
              const isActive = route === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 no-underline ${
                    isActive
                      ? "bg-cyber-accent/15 text-cyber-accent glow-text"
                      : "text-cyber-text2 hover:text-cyber-text hover:bg-white/5"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}

            {/* 分隔线 */}
            <div className="w-px h-5 bg-cyber-border/50 mx-1" />

            {/* 通知铃铛 */}
            {session?.user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); loadNotifications(); }}
                  className="relative px-2 py-1.5 rounded-lg text-cyber-text2 hover:text-cyber-text hover:bg-white/5 transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-cyber-pink text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-1 w-72 cyber-card p-2 z-50 max-h-80 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-cyber-text">通知</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] text-cyber-accent hover:underline">全部已读</button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-cyber-text2/40 text-center py-4">暂无通知</p>
                    ) : (
                      <div className="space-y-1">
                        {notifications.map((n: any) => (
                          <a
                            key={n.id}
                            href={n.link || "#"}
                            className={`block p-2 rounded text-xs transition-colors no-underline ${
                              n.read ? "text-cyber-text2/60" : "text-cyber-text bg-cyber-accent/5"
                            }`}
                          >
                            <div className="font-medium">{n.title}</div>
                            <div className="text-cyber-text2/50 mt-0.5 line-clamp-1">{n.body}</div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 用户区域 */}
            {session?.user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-cyber-text hover:bg-white/5 transition-all"
                >
                  <span className="w-6 h-6 rounded-full bg-cyber-accent/20 text-cyber-accent text-xs flex items-center justify-center font-bold">
                    {(session.user.name || session.user.email || "U")[0].toUpperCase()}
                  </span>
                  <span className="hidden sm:inline text-cyber-text2 max-w-[100px] truncate">
                    {session.user.name || session.user.email}
                  </span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 cyber-card p-1.5 z-50">
                    <div className="text-xs text-cyber-text2/60 px-2 py-1 truncate">
                      {session.user.email}
                    </div>
                    <div className="border-t border-cyber-border/30 my-1" />
                    <Link
                      href="/profile"
                      className="block w-full text-left px-2 py-1.5 rounded text-sm text-cyber-text2 hover:text-cyber-text hover:bg-white/5 transition-all no-underline"
                    >
                      个人中心
                    </Link>
                    {(session.user as any)?.role === "admin" && (
                      <Link
                        href="/admin"
                        className="block w-full text-left px-2 py-1.5 rounded text-sm text-cyber-accent hover:bg-cyber-accent/10 transition-all no-underline"
                      >
                        管理后台
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full text-left px-2 py-1.5 rounded text-sm text-cyber-text2 hover:text-cyber-pink hover:bg-cyber-pink/5 transition-all"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg text-sm text-cyber-text2 hover:text-cyber-text hover:bg-white/5 transition-all no-underline"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-lg text-sm bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30 hover:bg-cyber-accent/20 transition-all no-underline"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
