import { ADCProduct } from "./types";
import productsData from "../../data/adc_products.json";

const products: ADCProduct[] = productsData as ADCProduct[];

export function getAllProducts(): ADCProduct[] {
  return products;
}

export function getProductById(id: string): ADCProduct | undefined {
  return products.find((p) => p.id === id);
}

export function getProductTargets(): string[] {
  return [...new Set(products.map((p) => p.target))].sort();
}

export function getProductStages(): string[] {
  const stages = [...new Set(products.map((p) => p.stage))].sort();
  return ["临床阶段", ...stages];
}

export function getProductCompanies(): string[] {
  const companies = products.flatMap((p) => [
    p.companyOriginator,
    ...(p.companyLicensee ? p.companyLicensee.split("/") : []),
  ]);
  return [...new Set(companies.map((c) => c.trim()).filter(Boolean))].sort();
}

export function getProductIndications(): string[] {
  return [...new Set(products.flatMap((p) => p.indication))].sort();
}

export function getConjugationMethods(): string[] {
  return [...new Set(products.map((p) => p.conjugationMethod))].sort();
}

export function getPayloadClasses(): string[] {
  return [...new Set(products.map((p) => p.payloadClass))].sort();
}

export function getLinkerTypes(): string[] {
  return [...new Set(products.map((p) => p.linkerType))].sort();
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

export function filterAndPaginate(params: FilterParams): PaginatedResult {
  let filtered = [...products];

  if (params.search) {
    const q = params.search.toLowerCase();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordRe = new RegExp(`\\b${escaped}\\b`, "i");
    // Match indication only if not in a negative context (e.g. "HER2-", "HER2-low")
    const negRe = new RegExp(`${escaped}\\s*[-阴性]|${escaped}\\s*low|${escaped}\\s*negative`, "i");
    filtered = filtered.filter(
      (p) =>
        p.brandName.toLowerCase().includes(q) ||
        p.genericNameEn.toLowerCase().includes(q) ||
        p.genericNameCn.toLowerCase().includes(q) ||
        p.target.toLowerCase().includes(q) ||
        p.indication.some((i) => wordRe.test(i) && !negRe.test(i)) ||
        p.companyOriginator.toLowerCase().includes(q) ||
        (p.companyLicensee || "").toLowerCase().includes(q)
    );
  }

  if (params.stage) {
    let stages = params.stage.split(",");
    // Expand "临床阶段" to all clinical trial phases
    if (stages.includes("临床阶段")) {
      stages = stages.filter(s => s !== "临床阶段");
      stages.push("临床I期", "临床II期", "临床III期", "NDA",
        "临床I期 (终止)", "临床II期 (终止)", "临床III期 (终止)");
    }
    filtered = filtered.filter((p) => stages.includes(p.stage));
  }

  if (params.target) {
    const targets = params.target.split(",");
    filtered = filtered.filter((p) => targets.includes(p.target));
  }

  if (params.indication) {
    const indications = params.indication.split(",");
    filtered = filtered.filter((p) =>
      p.indication.some((i) => indications.some((fi) => i.includes(fi)))
    );
  }

  if (params.company) {
    const companies = params.company.split(",");
    filtered = filtered.filter(
      (p) =>
        companies.some((c) => p.companyOriginator.includes(c)) ||
        companies.some((c) => (p.companyLicensee || "").includes(c))
    );
  }

  if (params.conjugationMethod) {
    const methods = params.conjugationMethod.split(",");
    filtered = filtered.filter((p) => methods.includes(p.conjugationMethod));
  }

  if (params.payloadClass) {
    const classes = params.payloadClass.split(",");
    filtered = filtered.filter((p) => classes.includes(p.payloadClass));
  }

  if (params.linkerType) {
    const types = params.linkerType.split(",");
    filtered = filtered.filter((p) => types.includes(p.linkerType));
  }

  if (params.sort) {
    const order = params.order === "desc" ? -1 : 1;
    filtered.sort((a, b) => {
      const aVal = a[params.sort as keyof ADCProduct];
      const bVal = b[params.sort as keyof ADCProduct];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * order;
      }
      return String(aVal).localeCompare(String(bVal)) * order;
    });
  }

  const page = params.page || 1;
  const pageSize = params.pageSize || 15;
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return { products: paginated, total, page, pageSize, totalPages };
}
