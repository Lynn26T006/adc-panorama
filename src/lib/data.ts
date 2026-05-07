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
