"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Comment {
  id: number;
  user_id: string;
  drug_id: number;
  parent_id: number | null;
  content: string;
  created_at: string;
  updated_at: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function CommentSection({ drugId }: { drugId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments/drug/${drugId}/`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [drugId]);

  useEffect(() => { loadComments(); }, [loadComments]);

  async function handleSubmit() {
    if (!text.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/comments/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drugId, content: text, parentId: replyTo }),
    });
    if (res.ok) {
      setText("");
      setReplyTo(null);
      loadComments();
    }
    setSubmitting(false);
  }

  async function handleEdit(id: number) {
    if (!editText.trim()) return;
    const res = await fetch(`/api/comments/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editText }),
    });
    if (res.ok) {
      setEditingId(null);
      setEditText("");
      loadComments();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("确定删除这条评论？")) return;
    const res = await fetch(`/api/comments/${id}/`, { method: "DELETE" });
    if (res.ok) loadComments();
  }

  // 按嵌套结构组织
  const topComments = comments.filter(c => !c.parent_id);
  const replies = (parentId: number) => comments.filter(c => c.parent_id === parentId);

  return (
    <div className="cyber-card p-5 mt-6">
      <h3 className="text-sm font-bold text-cyber-text mb-4">
        讨论 ({comments.length})
      </h3>

      {/* 评论输入框 */}
      {session?.user ? (
        <div className="mb-4">
          {replyTo && (
            <div className="text-xs text-cyber-text2 mb-1 flex items-center gap-2">
              回复中
              <button onClick={() => setReplyTo(null)} className="text-cyber-pink text-xs">取消</button>
            </div>
          )}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={replyTo ? "写下回复..." : "写下你的评论..."}
            rows={2}
            className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text placeholder:text-cyber-text2/40 focus:outline-none focus:border-cyber-accent resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="mt-2 text-xs px-4 py-1.5 rounded-lg bg-cyber-accent text-cyber-bg font-bold hover:bg-cyan-400 transition-all disabled:opacity-50"
          >
            {submitting ? "发送中..." : "发表评论"}
          </button>
        </div>
      ) : (
        <div className="text-center py-4 mb-4 border border-cyber-border/30 rounded-lg">
          <p className="text-sm text-cyber-text2/60">
            <Link href="/login" className="text-cyber-accent hover:underline">登录</Link> 后参与讨论
          </p>
        </div>
      )}

      {/* 评论列表 */}
      {loading ? (
        <div className="text-center py-4 text-xs text-cyber-text2/50">加载中...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-xs text-cyber-text2/40">暂无评论</div>
      ) : (
        <div className="space-y-3">
          {topComments.map(c => (
            <div key={c.id}>
              <CommentItem
                comment={c}
                userId={(session?.user as any)?.id}
                onReply={id => { setReplyTo(id); setText(""); }}
                onEdit={id => { setEditingId(id); setEditText(c.content); }}
                onDelete={handleDelete}
                editingId={editingId}
                editText={editText}
                setEditText={setEditText}
                handleEdit={handleEdit}
              />
              {/* 回复 */}
              {replies(c.id).map(r => (
                <div key={r.id} className="ml-8 mt-2">
                  <CommentItem
                    comment={r}
                    userId={(session?.user as any)?.id}
                    onReply={id => { setReplyTo(id); setText(""); }}
                    onEdit={id => { setEditingId(id); setEditText(r.content); }}
                    onDelete={handleDelete}
                    editingId={editingId}
                    editText={editText}
                    setEditText={setEditText}
                    handleEdit={handleEdit}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment, userId, onReply, onEdit, onDelete,
  editingId, editText, setEditText, handleEdit,
}: {
  comment: Comment;
  userId: string;
  onReply: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  editingId: number | null;
  editText: string;
  setEditText: (t: string) => void;
  handleEdit: (id: number) => void;
}) {
  const isOwner = userId === comment.user_id;
  const initials = (comment.display_name || "U")[0].toUpperCase();

  return (
    <div className="flex gap-2">
      <div className="w-6 h-6 rounded-full bg-cyber-accent/20 text-cyber-accent text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-cyber-text">
            {comment.display_name || "匿名用户"}
          </span>
          <span className="text-[10px] text-cyber-text2/40">
            {new Date(comment.created_at).toLocaleDateString("zh-CN")}
          </span>
        </div>
        {editingId === comment.id ? (
          <div className="mt-1">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={2}
              className="w-full bg-cyber-bg border border-cyber-border rounded px-2 py-1 text-xs text-cyber-text focus:outline-none focus:border-cyber-accent resize-none"
            />
            <div className="flex gap-2 mt-1">
              <button onClick={() => handleEdit(comment.id)} className="text-xs text-cyber-accent">保存</button>
              <button onClick={() => onEdit(0)} className="text-xs text-cyber-text2/50">取消</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-cyber-text2 mt-0.5 break-words">{comment.content}</p>
        )}
        {userId && editingId !== comment.id && (
          <div className="flex gap-3 mt-1">
            <button onClick={() => onReply(comment.id)} className="text-[10px] text-cyber-text2/40 hover:text-cyber-accent transition-colors">
              回复
            </button>
            {isOwner && (
              <>
                <button onClick={() => onEdit(comment.id)} className="text-[10px] text-cyber-text2/40 hover:text-cyber-accent transition-colors">
                  编辑
                </button>
                <button onClick={() => onDelete(comment.id)} className="text-[10px] text-cyber-text2/40 hover:text-cyber-pink transition-colors">
                  删除
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
