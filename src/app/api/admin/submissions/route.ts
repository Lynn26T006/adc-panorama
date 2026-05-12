import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mysql from "mysql2/promise";

const pool = mysql.createPool({ uri: process.env.DATABASE_URL!, connectionLimit: 5 });

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const status = request.nextUrl.searchParams.get("status") || "pending";
    const [rows] = await pool.query(
      `SELECT s.*, u.display_name, u.email
       FROM submissions s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.status = ?
       ORDER BY s.created_at DESC
       LIMIT 50`,
      [status]
    );
    return NextResponse.json({ submissions: rows });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
