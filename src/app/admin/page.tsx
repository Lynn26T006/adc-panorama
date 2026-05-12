"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface DashboardData {
  totalDrugs: number;
  totalUsers: number;
  totalComments: number;
  pendingSubmissions: number;
  recentUsers: any[];
  recentComments: any[];
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "loading") return;
    if ((session?.user as any)?.role !== "admin") { router.push("/"); return; }

    async function load() {
      const [dashRes, subRes] = await Promise.all([
        fetch("/api/admin/dashboard/"),
        fetch("/api/admin/submissions/?status=pending"),
      ]);
      setData(await dashRes.json());
      setSubmissions((await subRes.json()).submissions || []);
      setLoading(false);
    }
    load();
  }, [session, status, router]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-16 text-cyber-text2">加载中...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-extrabold gradient-text mb-8">管理后台</h1>

        {/* 统计卡片 */}
        {data && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "药物总数", value: data.totalDrugs, color: "from-cyber-accent to-cyan-400" },
              { label: "注册用户", value: data.totalUsers, color: "from-cyber-pink to-purple-400" },
              { label: "评论总数", value: data.totalComments, color: "from-cyber-green to-emerald-400" },
              { label: "待审核", value: data.pendingSubmissions, color: "from-cyber-orange to-yellow-400" },
            ].map(card => (
              <div key={card.label} className="cyber-card p-4 text-center">
                <div className={`text-2xl font-extrabold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                  {card.value}
                </div>
                <div className="text-xs text-cyber-text2 mt-1">{card.label}</div>
              </div>
            ))}
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 待审核提交 */}
          <section className="cyber-card p-5">
            <h2 className="text-sm font-bold text-cyber-text mb-4">待审核数据提交</h2>
            {submissions.length === 0 ? (
              <p className="text-xs text-cyber-text2/40 text-center py-8">暂无待审核</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub: any) => (
                  <div key={sub.id} className="border border-cyber-border/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-cyber-text">{sub.drug_name}</span>
                      <span className="text-xs text-cyber-text2/60">{sub.display_name || sub.email}</span>
                    </div>
                    <pre className="text-xs text-cyber-text2/70 bg-cyber-bg rounded p-2 mb-2 max-h-24 overflow-y-auto">
                      {JSON.stringify(sub.field_data, null, 2)}
                    </pre>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await fetch(`/api/admin/submissions/${sub.id}/`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "approved" }),
                          });
                          setSubmissions(submissions.filter(s => s.id !== sub.id));
                        }}
                        className="text-xs px-3 py-1 rounded bg-cyber-green/20 text-cyber-green hover:bg-cyber-green/30 transition-all"
                      >
                        通过
                      </button>
                      <button
                        onClick={async () => {
                          await fetch(`/api/admin/submissions/${sub.id}/`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "rejected", reviewNote: "未通过审核" }),
                          });
                          setSubmissions(submissions.filter(s => s.id !== sub.id));
                        }}
                        className="text-xs px-3 py-1 rounded bg-cyber-pink/20 text-cyber-pink hover:bg-cyber-pink/30 transition-all"
                      >
                        拒绝
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 最近注册 */}
          <section className="cyber-card p-5">
            <h2 className="text-sm font-bold text-cyber-text mb-4">最近注册用户</h2>
            {data?.recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-cyber-border/20 last:border-0">
                <div>
                  <span className="text-sm text-cyber-text">{u.display_name || "未设置"}</span>
                  <span className="text-xs text-cyber-text2/50 ml-2">{u.email}</span>
                </div>
                <span className="text-[10px] text-cyber-text2/40">
                  {new Date(u.created_at).toLocaleDateString("zh-CN")}
                </span>
              </div>
            ))}
          </section>
        </div>

        {/* 数据提交入口 */}
        <div className="mt-6 cyber-card p-5 text-center">
          <p className="text-sm text-cyber-text2 mb-2">向用户开放数据提交功能</p>
          <Link href="/submit" className="text-sm px-4 py-2 rounded-lg bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30 hover:bg-cyber-accent/20 transition-all no-underline">
            打开提交页面
          </Link>
        </div>
      </main>
    </>
  );
}
