import { ADCProduct } from "./types";
import sourceData from "../../data/adc_products.json";

const store: ADCProduct[] = sourceData as ADCProduct[];

export function getAllProducts(): ADCProduct[] {
  return store;
}

export function getProductById(id: string): ADCProduct | undefined {
  return store.find((d) => d.id === id);
}

// 去重排序后返回所有靶点列表
export function getProductTargets(): string[] {
  return [...new Set(store.map((d) => d.target))].sort();
}

// 返回所有出现过的研发阶段，把"临床阶段"虚拟标签放在最前面方便筛选
export function getProductStages(): string[] {
  const raw = [...new Set(store.map((d) => d.stage))].sort();
  return ["临床阶段", ...raw];
}

// 原研 + 合作方摊平去重
export function getProductCompanies(): string[] {
  const flat = store.flatMap((d) => [
    d.companyOriginator,
    ...(d.companyLicensee ? d.companyLicensee.split("/") : []),
  ]);
  return [...new Set(flat.map((c) => c.trim()).filter(Boolean))].sort();
}

export function getProductIndications(): string[] {
  return [...new Set(store.flatMap((d) => d.indication))].sort();
}

export function getConjugationMethods(): string[] {
  return [...new Set(store.map((d) => d.conjugationMethod))].sort();
}

export function getPayloadClasses(): string[] {
  return [...new Set(store.map((d) => d.payloadClass))].sort();
}

export function getLinkerTypes(): string[] {
  return [...new Set(store.map((d) => d.linkerType))].sort();
}

export interface FilterParams {
  search?: string;
  stage?: string;
  target?: string;
  indication?: string;
  company?: string;
  conjugationMethod?: string;
  payloadClass?: string;
  linkerType?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult {
  products: ADCProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 核心筛选 + 分页逻辑
// ---- 制剂/冻干数据提取函数 ----

/** 返回所有有制剂数据的产品 */
export function getProductsWithFormulation(): ADCProduct[] {
  return store.filter(p =>
    p.dosageForm ||
    p.lyoExcipientsBuffer ||
    p.lyoExcipientsStabilizer ||
    p.lyoExcipientsSurfactant ||
    p.lyoPh ||
    p.lyoCycle ||
    p.storageCondition ||
    p.shelfLife ||
    p.liquidExcipients
  );
}

/** 去重所有剂型 */
export function getDosageForms(): string[] {
  return [...new Set(store.map(p => p.dosageForm).filter(Boolean))].sort();
}

/** 去重冻干pH */
export function getLyoPhValues(): string[] {
  return [...new Set(store.map(p => p.lyoPh).filter(Boolean))].sort();
}

/** 去重储存条件 */
export function getStorageConditions(): string[] {
  return [...new Set(store.map(p => p.storageCondition).filter(Boolean))].sort();
}

// 缓冲体系归类映射
const BUFFER_CLASS_MAP: Record<string, string> = {
  "柠檬酸钠": "柠檬酸盐",
  "柠檬酸": "柠檬酸",
  "琥珀酸钠": "琥珀酸盐",
  "Tris": "Tris",
  "组氨酸": "L-组氨酸",
  "MES": "MES",
  "磷酸": "磷酸盐",
  "甘氨酸": "甘氨酸",
};

/** 缓冲体系归类 */
export function classifyBuffer(raw: string): string {
  if (!raw) return "";
  for (const [key, label] of Object.entries(BUFFER_CLASS_MAP)) {
    if (raw.includes(key)) return label;
  }
  return raw.split(" ")[0].split(";")[0].trim();
}

const STABILIZER_CLASS_MAP: Record<string, string> = {
  "海藻糖": "海藻糖",
  "蔗糖": "蔗糖",
  "甘露醇": "甘露醇",
  "D-甘露醇": "甘露醇",
  "氯化钠": "氯化钠",
  "右旋糖酐": "右旋糖酐",
  "聚山梨酯20": "聚山梨酯20",
  "聚山梨酯80": "聚山梨酯80",
};

/** 稳定剂归类 */
export function classifyStabilizer(raw: string): string {
  if (!raw) return "";
  for (const [key, label] of Object.entries(STABILIZER_CLASS_MAP)) {
    if (raw.includes(key)) return label;
  }
  return raw.split(" ")[0].split(";")[0].trim();
}

const SURFACTANT_CLASS_MAP: Record<string, string> = {
  "聚山梨酯80": "聚山梨酯80",
  "聚山梨酯20": "聚山梨酯20",
  "Polysorbate 80": "聚山梨酯80",
  "Polysorbate 20": "聚山梨酯20",
  "吐温80": "聚山梨酯80",
  "吐温20": "聚山梨酯20",
};

/** 表面活性剂归类 */
export function classifySurfactant(raw: string): string {
  if (!raw) return "";
  for (const [key, label] of Object.entries(SURFACTANT_CLASS_MAP)) {
    if (raw.includes(key)) return label;
  }
  return raw.split(" ")[0].split(";")[0].trim().replace(/,$/, "");
}

/** 去重缓冲体系分类 */
export function getBufferClasses(): string[] {
  return [...new Set(
    store.map(p => classifyBuffer(p.lyoExcipientsBuffer)).filter(Boolean)
  )].sort();
}

/** 去重稳定剂分类 */
export function getStabilizerClasses(): string[] {
  return [...new Set(
    store.map(p => classifyStabilizer(p.lyoExcipientsStabilizer)).filter(Boolean)
  )].sort();
}

/** 去重表面活性剂分类 */
export function getSurfactantClasses(): string[] {
  return [...new Set(
    store.map(p => classifySurfactant(p.lyoExcipientsSurfactant)).filter(Boolean)
  )].sort();
}

export function filterAndPaginate(params: FilterParams): PaginatedResult {
  let pool = [...store];

  // 关键词搜索，匹配商品名、通用名、靶点、适应症、公司
  if (params.search) {
    const q = params.search.toLowerCase();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordRe = new RegExp(`\\b${escaped}\\b`, "i");
    // 排除否定语境：HER2- / HER2-low / HER2阴性 不应匹配 "HER2"
    const negRe = new RegExp(`${escaped}\\s*[-阴性]|${escaped}\\s*low|${escaped}\\s*negative`, "i");
    pool = pool.filter(
      (d) =>
        d.brandName.toLowerCase().includes(q) ||
        d.genericNameEn.toLowerCase().includes(q) ||
        d.genericNameCn.toLowerCase().includes(q) ||
        d.target.toLowerCase().includes(q) ||
        d.indication.some((ind) => wordRe.test(ind) && !negRe.test(ind)) ||
        d.companyOriginator.toLowerCase().includes(q) ||
        (d.companyLicensee || "").toLowerCase().includes(q)
    );
  }

  if (params.stage) {
    let stages = params.stage.split(",");
    // "临床阶段"是个虚拟标签，展开成所有临床试验阶段
    if (stages.includes("临床阶段")) {
      stages = stages.filter(s => s !== "临床阶段");
      stages.push("临床I期", "临床II期", "临床III期", "NDA",
        "临床I期 (终止)", "临床II期 (终止)", "临床III期 (终止)");
    }
    pool = pool.filter((d) => stages.includes(d.stage));
  }

  if (params.target) {
    const targets = params.target.split(",");
    pool = pool.filter((d) => targets.includes(d.target));
  }

  if (params.indication) {
    const inds = params.indication.split(",");
    pool = pool.filter((d) => d.indication.some((i) => inds.some((fi) => i.includes(fi))));
  }

  if (params.company) {
    const cos = params.company.split(",");
    pool = pool.filter(
      (d) =>
        cos.some((c) => d.companyOriginator.includes(c)) ||
        cos.some((c) => (d.companyLicensee || "").includes(c))
    );
  }

  if (params.conjugationMethod) {
    const methods = params.conjugationMethod.split(",");
    pool = pool.filter((d) => methods.includes(d.conjugationMethod));
  }

  if (params.payloadClass) {
    const classes = params.payloadClass.split(",");
    pool = pool.filter((d) => classes.includes(d.payloadClass));
  }

  if (params.linkerType) {
    const types = params.linkerType.split(",");
    pool = pool.filter((d) => types.includes(d.linkerType));
  }

  // 排序
  if (params.sort) {
    const dir = params.order === "desc" ? -1 : 1;
    pool.sort((a, b) => {
      const va = a[params.sort as keyof ADCProduct];
      const vb = b[params.sort as keyof ADCProduct];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb)) * dir;
    });
  }

  const pg = params.page || 1;
  const sz = params.pageSize || 15;
  const total = pool.length;
  const totalPages = Math.ceil(total / sz);
  const start = (pg - 1) * sz;

  return { products: pool.slice(start, start + sz), total, page: pg, pageSize: sz, totalPages };
}
