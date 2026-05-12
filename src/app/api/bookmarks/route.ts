import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mysql from "mysql2/promise";

const pool = mysql.createPool({ uri: process.env.DATABASE_URL!, connectionLimit: 5 });

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const { drugId, note } = await request.json();
    const userId = (session.user as any).id;

    // DrugId can be numeric or adcdb_id string
    let drugIdNum = parseInt(String(drugId));
    if (isNaN(drugIdNum)) {
      const [rows] = await pool.query("SELECT id FROM drugs WHERE adcdb_id = ? LIMIT 1", [drugId]) as any[];
      if (rows.length === 0) return NextResponse.json({ error: "药物不存在" }, { status: 404 });
      drugIdNum = rows[0].id;
    }

    // Upsert: ignore if already exists
    await pool.query(
      "INSERT IGNORE INTO bookmarks (user_id, drug_id, note) VALUES (?, ?, ?)",
      [userId, drugIdNum, note || null]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "收藏失败" }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const userId = (session.user as any).id;
    const [rows] = await pool.query(
      `SELECT b.id, b.drug_id, b.note, b.created_at,
              d.antibody, d.brand_name, d.generic_cn, d.stage, d.target
       FROM bookmarks b
       JOIN drugs d ON b.drug_id = d.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );
    return NextResponse.json({ bookmarks: rows });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
