// ADCProduct类型定义，每条ADC药物的完整数据结构
// 包含从公开数据库抓取的所有字段：基本信息、CMC工艺、细胞株、专利等

export interface ADCProduct {
  // 基本标识
  id: string;                    // 唯一编号，来自ADCdb或自行生成
  genericNameEn: string;         // 英文通用名，如Trastuzumab Emtansine
  genericNameCn: string;         // 中文通用名，如恩美曲妥珠单抗
  brandName: string;             // 商品名，如Kadcyla / 赫赛莱
  target: string;                // 靶点蛋白，如HER2、TROP2、EGFR
  antibody: string;              // 抗体名称，如Trastuzumab
  antibodySubclass: string;      // 抗体亚型，如IgG1κ、IgG4
  indication: string[];          // 适应症列表，如["乳腺癌", "胃癌"]
  stage: string;                 // 研发阶段：已上市 / NDA / 临床III期 / 临床II期 / 临床I期 / IND
  companyOriginator: string;     // 原研公司（最早开发该药物的公司）
  companyLicensee: string;       // 合作/授权公司，多个用 / 分隔
  approvalYear: number | null;   // 首次获批年份，未获批则为null
  approvalRegions: string[];     // 已获批地区列表，如["FDA", "EMA", "NMPA"]

  // CMC，载荷与连接子（Payload & Linker）
  payloadName: string;           // 载荷名称，如DM1、MMAE、DXd
  payloadClass: string;          // 载荷类型，如Auristatin、Camptothecin
  payloadMechanism: string;      // 载荷作用机制，如微管抑制剂、拓扑异构酶I抑制剂
  linkerName: string;            // 连接子名称，如SMCC、mc-VC-PAB
  linkerType: string;            // 连接子类型：可裂解 / 不可裂解
  linkerStructure: string;       // 连接子化学结构描述

  // CMC，偶联工艺（Conjugation）
  conjugationMethod: string;     // 偶联方式，如半胱氨酸偶联、赖氨酸偶联、ThioBridge
  conjugationSite: string;       // 偶联位点，如链间二硫键、Cys突变位点
  conjugationChemistry: string;  // 偶联化学反应名称，如Michael Addition
  dar: string;                   // 药物-抗体比(Drug-to-Antibody Ratio)，如3.5、~4、DAR8
  darDistribution: string;       // DAR分布情况，如DAR0-DAR8混合
  purificationMethod: string;    // 纯化方法，如疏水层析(HIC)、SEC

  // CMC，制剂与冻干工艺（Formulation & Lyophilization）
  dosageForm: string;            // 剂型，如冻干粉针、注射液
  lyophilization: boolean;       // 是否需要冻干工艺
  lyoExcipientsBuffer: string;   // 冻干缓冲体系，如组氨酸-HCl
  lyoExcipientsStabilizer: string; // 冻干稳定剂/赋形剂，如蔗糖、海藻糖
  lyoExcipientsSurfactant: string; // 冻干表面活性剂，如PS80(聚山梨酯80)
  lyoPh: string;                 // 冻干前溶液pH值
  lyoPreConc: string;            // 冻干前蛋白浓度
  lyoPostConc: string;           // 复溶后蛋白浓度
  lyoCycle: string;              // 冻干周期参数（温度曲线、时间等）
  reconstitutionMedia: string;   // 复溶溶媒，如注射用水(WFI)
  liquidExcipients: string;      // 注射液辅料（非冻干产品用）
  storageCondition: string;      // 储存条件，如2-8°C避光
  shelfLife: string;             // 有效期，如36个月
  containerClosure: string;      // 包材/容器，如西林瓶(vial) + 橡胶塞

  // CMC，分析质控（Analytics）
  purityMethod: string;          // 纯度分析方法，如SEC-HPLC、CE-SDS
  potencyMethod: string;         // 活性检测方法，如细胞毒性实验
  criticalQualityAttrs: string;  // 关键质量属性(CQA)，如DAR分布、聚体含量

  // 细胞株与序列（Cell Line & Sequence）
  cellLine: string;              // 生产细胞类型，如CHO-K1、CHO-DG44、HEK293
  antibodySequenceHeavy: string; // 抗体重链氨基酸序列（单字母缩写）
  antibodySequenceLight: string; // 抗体轻链氨基酸序列（单字母缩写）
  signalPeptide: string;         // 信号肽序列，引导抗体分泌到细胞外
  plasmidInfo: string;           // 质粒载体信息，如pCDNA3.1、CMV启动子

  // 载荷化学（Payload Chemistry）
  payloadSmiles: string;         // 载荷的SMILES化学结构编码（可用于生成结构图）
  payloadStructure: string;      // 载荷结构式图片URL（从PubChem获取）

  // PDB蛋白结构
  pdbId: string;                 // RCSB PDB数据库编号，如1N8Z（可查看3D蛋白结构）

  // 生产厂家（灌装/制剂生产方，非原研公司）
  manufacturer: string;          // 实际灌装生产商，如Lonza、BSP Pharmaceuticals

  // 专利与参考文献
  patentNumber: string;          // 专利号，多个用 ; 分隔
  patentTitle: string;           // 专利标题
  patentAssignee: string;        // 专利权人/专利权归属
  patentFilingDate: string;      // 专利申请日
  patentExpiry: string;          // 专利过期日（申请日+20年）
  referenceLabel: string;        // 数据来源标注，如ADCdb ID: DRG0XXXXX
  referenceUrl: string;          // 数据来源链接
  lastUpdated: string;           // 最后更新时间
  notes: string;                 // 备注
}

// 研发阶段筛选器联合类型
export type StageFilter =
  | "已上市"
  | "NDA"
  | "临床III期"
  | "临床II期"
  | "临床I期"
  | "IND";

// 排序字段与顺序
export type SortField = "brandName" | "target" | "stage" | "approvalYear" | "conjugationMethod";
export type SortOrder = "asc" | "desc";
