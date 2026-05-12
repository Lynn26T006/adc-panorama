"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Bookmark {
  id: number;
  drug_id: number;
  note: string | null;
  created_at: string;
  antibody: string;
  brand_name: string;
  generic_cn: string;
  stage: string;
  target: string;
}

interface CommentItem {
  id: number;
  drug_id: number;
  content: string;
  created_at: string;
  brand_name?: string;
  antibody?: string;
}

interface SubmissionItem {
  id: number;
  drug_name: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"bookmarks" | "comments" | "submissions">("bookmarks");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "loading") return;
    loadData();
  }, [status, router, session]);

  async function loadData() {
    setLoading(true);
    try {
      const [bmRes] = await Promise.all([
        fetch("/api/bookmarks/"),
      ]);
      const bmData = await bmRes.json();
      setBookmarks(bmData.bookmarks || []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function loadComments() {
    try {
      const res = await fetch("/api/comments/?mine=true");
      const data = await res.json();
      setComments(data.comments || []);
    } catch { /* ignore */ }
  }

  async function loadSubmissions() {
    try {
      const res = await fetch("/api/submissions/?mine=true");
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (tab === "comments") loadComments();
    if (tab === "submissions") loadSubmissions();
  }, [tab]);

  if (status === "loading" || !session?.user) {
    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
          <div className="cyber-card p-12 text-center">
            <div className="w-8 h-8 mx-auto border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </>
    );
  }

  const user = session.user;

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 用户信息卡片 */}
        <div className="cyber-card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-cyber-accent/20 text-cyber-accent text-xl flex items-center justify-center font-bold">
              {(user.name || user.email || "U")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-cyber-text">{user.name || "未设置用户名"}</h1>
              <p className="text-sm text-cyber-text2">{user.email}</p>
              {(user as any).role === "admin" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30 mt-1 inline-block">
                  管理员
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1 mb-6 border-b border-cyber-border">
          {[
            { key: "bookmarks", label: `收藏 (${bookmarks.length})` },
            { key: "comments", label: "我的评论" },
            { key: "submissions", label: "数据提交" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === t.key
                  ? "border-cyber-accent text-cyber-accent"
                  : "border-transparent text-cyber-text2/60 hover:text-cyber-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 收藏列表 */}
        {tab === "bookmarks" && (
          <section>
            {loading ? (
              <div className="cyber-card p-12 text-center">
                <div className="w-8 h-8 mx-auto border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="cyber-card p-12 text-center">
                <p className="text-cyber-text2 text-lg">暂无收藏</p>
                <p className="text-sm text-cyber-text2/60 mt-2">
                  在药品详情页点击星标即可收藏
                </p>
                <Link
                  href="/products"
                  className="inline-block mt-4 text-sm px-4 py-2 rounded-lg bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30 hover:bg-cyber-accent/20 transition-all no-underline"
                >
                  浏览产品
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookmarks.map((bm) => (
                  <div key={bm.id} className="cyber-card p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${bm.drug_id}`}
                        className="text-sm font-medium text-cyber-accent hover:underline no-underline"
                      >
                        {bm.brand_name || bm.antibody}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-cyber-text2/60">{bm.antibody}</span>
                        {bm.target && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyber-pink/10 text-cyber-pink border border-cyber-pink/20">
                            {bm.target}
                          </span>
                        )}
                        {bm.stage && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/20">
                            {bm.stage}
                          </span>
                        )}
                      </div>
                      {bm.note && <p className="text-xs text-cyber-text2/40 mt-1">{bm.note}</p>}
                    </div>
                    <button
                      onClick={async () => {
                        await fetch(`/api/bookmarks/${bm.drug_id}/`, { method: "DELETE" });
                        setBookmarks(bookmarks.filter(b => b.id !== bm.id));
                      }}
                      className="text-xs text-cyber-text2/40 hover:text-cyber-pink transition-colors shrink-0"
                    >
                      取消收藏
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 评论历史 */}
        {tab === "comments" && (
          <section>
            {comments.length === 0 ? (
              <div className="cyber-card p-12 text-center">
                <p className="text-cyber-text2 text-lg">暂无评论</p>
                <p className="text-sm text-cyber-text2/60 mt-2">你发表的评论将显示在这里</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="cyber-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Link
                        href={`/products/${c.drug_id}`}
                        className="text-sm font-medium text-cyber-accent hover:underline no-underline"
                      >
                        {c.brand_name || c.antibody || `药物 #${c.drug_id}`}
                      </Link>
                      <span className="text-xs text-cyber-text2/40">
                        {new Date(c.created_at).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                    <p className="text-sm text-cyber-text2">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 数据提交历史 */}
        {tab === "submissions" && (
          <section>
            {submissions.length === 0 ? (
              <div className="cyber-card p-12 text-center">
                <p className="text-cyber-text2 text-lg">暂无提交记录</p>
                <Link
                  href="/submit"
                  className="inline-block mt-4 text-sm px-4 py-2 rounded-lg bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30 hover:bg-cyber-accent/20 transition-all no-underline"
                >
                  提交新数据
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((s) => (
                  <div key={s.id} className="cyber-card p-4 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-sm font-medium text-cyber-text">{s.drug_name}</span>
                      <span className="text-xs text-cyber-text2/40 ml-2">
                        {new Date(s.created_at).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.status === "approved"
                        ? "bg-cyber-green/10 text-cyber-green border border-cyber-green/30"
                        : s.status === "rejected"
                          ? "bg-cyber-pink/10 text-cyber-pink border border-cyber-pink/30"
                          : "bg-cyber-orange/10 text-cyber-orange border border-cyber-orange/30"
                    }`}>
                      {s.status === "approved" ? "已通过" : s.status === "rejected" ? "已拒绝" : "审核中"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
