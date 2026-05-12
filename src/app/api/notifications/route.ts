import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  connectionLimit: 5,
});

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const userId = (session.user as any).id;
    const [rows] = await pool.query(
      "SELECT id, type, title, body, link, `read`, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [userId]
    );
    const [unread] = await pool.query(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND `read` = 0",
      [userId]
    ) as any[];

    return NextResponse.json({
      notifications: rows,
      unreadCount: unread[0]?.count || 0,
    });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
