import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { drugs } from "@/lib/db/schema";
import { and, isNotNull, or, like } from "drizzle-orm";
import mysql from "mysql2/promise";

const pool = mysql.createPool({ uri: process.env.DATABASE_URL!, connectionLimit: 3 });

// 分类映射（用于 LIKE 查询）
const CLASS_TO_KEYWORDS: Record<string, string[]> = {
  "柠檬酸盐": ["柠檬酸钠", "柠檬酸"],
  "琥珀酸盐": ["琥珀酸钠", "琥珀酸"],
  "Tris": ["Tris", "tris"],
  "L-组氨酸": ["组氨酸", "histidine"],
  "MES": ["MES"],
  "磷酸盐": ["磷酸"],
  "甘氨酸": ["甘氨酸", "glycine"],
  "蔗糖": ["蔗糖", "sucrose"],
  "海藻糖": ["海藻糖", "trehalose"],
  "甘露醇": ["甘露醇", "mannitol"],
  "氯化钠": ["氯化钠", "NaCl"],
  "聚山梨酯80": ["聚山梨酯80", "Polysorbate 80", "Tween 80", "吐温80"],
  "聚山梨酯20": ["聚山梨酯20", "Polysorbate 20", "Tween 20", "吐温20"],
};

function buildLikeClause(field: any, classification: string | null) {
  if (!classification || !CLASS_TO_KEYWORDS[classification]) return undefined;
  const keywords = CLASS_TO_KEYWORDS[classification];
  return or(...keywords.map((kw: string) => like(field, `%${kw}%`)));
}

export async function GET(request: NextRequest) {
  const db = await getDb();
  try {
    const { searchParams } = request.nextUrl;
    const buffer = searchParams.get("buffer") || "";
    const stabilizer = searchParams.get("stabilizer") || "";
    const surfactant = searchParams.get("surfactant") || "";
    const ph = searchParams.get("ph") || "";
    const storage = searchParams.get("storage") || "";

    // 基础条件：只查有配方数据的产品
    const baseConditions = [
      or(
        isNotNull(drugs.lyoBuffer),
        isNotNull(drugs.lyoStabilizer),
        isNotNull(drugs.lyoSurfactant),
        isNotNull(drugs.lyoPh),
        isNotNull(drugs.liquidExcipients)
      ),
    ];

    // 添加筛选条件
    const bufCond = buildLikeClause(drugs.lyoBuffer, buffer);
    const stabCond = buildLikeClause(drugs.lyoStabilizer, stabilizer);
    const surfCond = buildLikeClause(drugs.lyoSurfactant, surfactant);

    if (bufCond) baseConditions.push(bufCond);
    if (stabCond) baseConditions.push(stabCond);
    if (surfCond) baseConditions.push(surfCond);
    if (ph) baseConditions.push(like(drugs.lyoPh, `%${ph}%`));
    if (storage) baseConditions.push(like(drugs.storageCondition, `%${storage}%`));

    const whereClause = and(...baseConditions);

    const results = await db
      .select()
      .from(drugs)
      .where(whereClause)
      .orderBy(drugs.id)
      .limit(100);

    // 聚合配方
    const aggregate = aggregateRecipe(results);

    // 保存配方生成记录（仅登录用户）
    const session = await auth().catch(() => null);
    if (session?.user) {
      const userId = (session.user as any).id;
      const resultIds = results.map((r: any) => r.id).slice(0, 50);
      await pool.query(
        "INSERT INTO recipe_generations (user_id, parameters, result_ids) VALUES (?, ?, ?)",
        [
          userId,
          JSON.stringify({ buffer, stabilizer, surfactant, ph, storage }),
          JSON.stringify(resultIds),
        ]
      ).catch(() => { /* 静默失败，不影响主流程 */ });
    }

    return NextResponse.json({
      products: results,
      total: results.length,
      aggregate,
    });
  } catch (error) {
    console.error("Recipe API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function mostCommon<T extends string | null>(items: T[]): T | undefined {
  const freq = new Map<string, { val: T; count: number }>();
  for (const item of items) {
    if (!item) continue;
    const k = String(item);
    const entry = freq.get(k) || { val: item, count: 0 };
    entry.count++;
    freq.set(k, entry);
  }
  let best: { val: T; count: number } | undefined;
  for (const entry of freq.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  return best?.val;
}

function aggregateRecipe(matches: any[]) {
  if (matches.length === 0) return null;

  const buffers = matches.map(p => p.lyoBuffer as string | null).filter(Boolean);
  const stabs = matches.map(p => p.lyoStabilizer as string | null).filter(Boolean);
  const surfs = matches.map(p => p.lyoSurfactant as string | null).filter(Boolean);
  const phs = matches.map(p => p.lyoPh as string | null).filter(Boolean);
  const cycles = matches.map(p => p.lyoCycle as string | null).filter(Boolean);
  const recons = matches.map(p => p.reconstitutionMedia as string | null).filter(Boolean);
  const storages = matches.map(p => p.storageCondition as string | null).filter(Boolean);
  const shelves = matches.map(p => p.shelfLife as string | null).filter(Boolean);
  const containers = matches.map(p => p.containerClosure as string | null).filter(Boolean);

  return {
    buffer: mostCommon(buffers) || null,
    stabilizer: mostCommon(stabs) || null,
    surfactant: mostCommon(surfs) || null,
    ph: mostCommon(phs) || null,
    cycle: mostCommon(cycles) || null,
    reconstitution: mostCommon(recons) || null,
    storage: mostCommon(storages) || null,
    shelfLife: mostCommon(shelves) || null,
    container: mostCommon(containers) || null,
  };
}
