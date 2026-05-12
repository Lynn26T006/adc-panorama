import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { drugs, users, comments, submissions } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const db = await getDb();

    const [totalDrugs] = await db.select({ n: sql<number>`count(*)` }).from(drugs);
    const [totalUsers] = await db.select({ n: sql<number>`count(*)` }).from(users);
    const [totalComments] = await db.select({ n: sql<number>`count(*)` }).from(comments);
    const [pendingSubs] = await db
      .select({ n: sql<number>`count(*)` })
      .from(submissions)
      .where(eq(submissions.status, "pending"));

    // 最近注册用户
    const recentUsers = await db
      .select({ id: users.id, email: users.email, displayName: users.displayName, createdAt: users.createdAt })
      .from(users)
      .orderBy(sql`created_at DESC`)
      .limit(5);

    // 最近评论
    const recentComments = await db
      .select({ id: comments.id, content: comments.content, userId: comments.userId, createdAt: comments.createdAt })
      .from(comments)
      .orderBy(sql`created_at DESC`)
      .limit(5);

    return NextResponse.json({
      totalDrugs: Number(totalDrugs?.n || 0),
      totalUsers: Number(totalUsers?.n || 0),
      totalComments: Number(totalComments?.n || 0),
      pendingSubmissions: Number(pendingSubs?.n || 0),
      recentUsers,
      recentComments,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
