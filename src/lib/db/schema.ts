import {
  mysqlTable,
  serial,
  varchar,
  text,
  int,
  boolean,
  json,
  char,
  timestamp,
  uniqueIndex,
  index,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

const userRoleValues = ["user", "editor", "admin"] as const;
const submissionStatusValues = ["pending", "approved", "rejected"] as const;

export const drugs = mysqlTable(
  "drugs",
  {
    id: serial("id").primaryKey(),
    adcdbId: varchar("adcdb_id", { length: 20 }).unique(),
    antibody: varchar("antibody", { length: 300 }).notNull(),
    brandName: varchar("brand_name", { length: 200 }),
    genericCn: varchar("generic_cn", { length: 300 }),
    antibodySubclass: varchar("antibody_subclass", { length: 50 }),
    target: varchar("target", { length: 200 }),
    stage: varchar("stage", { length: 50 }),
    indication: json("indication"),
    approvalYear: int("approval_year"),
    approvalRegions: json("approval_regions"),

    payloadName: varchar("payload_name", { length: 200 }),
    payloadClass: varchar("payload_class", { length: 100 }),
    payloadMechanism: varchar("payload_mechanism", { length: 300 }),
    linkerName: text("linker_name"),
    linkerType: varchar("linker_type", { length: 100 }),
    linkerStructure: text("linker_structure"),
    conjugationMethod: text("conjugation_method"),
    conjugationSite: text("conjugation_site"),
    conjugationChemistry: varchar("conjugation_chemistry", { length: 300 }),
    dar: varchar("dar", { length: 50 }),
    darDistribution: varchar("dar_distribution", { length: 200 }),
    purificationMethod: varchar("purification_method", { length: 200 }),

    dosageForm: varchar("dosage_form", { length: 100 }),
    lyophilization: boolean("lyophilization").default(false),
    lyoBuffer: text("lyo_buffer"),
    lyoStabilizer: text("lyo_stabilizer"),
    lyoSurfactant: text("lyo_surfactant"),
    lyoPh: varchar("lyo_ph", { length: 20 }),
    lyoCycle: text("lyo_cycle"),
    lyoPreConc: varchar("lyo_pre_conc", { length: 100 }),
    lyoPostConc: varchar("lyo_post_conc", { length: 100 }),
    reconstitutionMedia: varchar("reconstitution_media", { length: 200 }),
    liquidExcipients: text("liquid_excipients"),
    storageCondition: varchar("storage_condition", { length: 200 }),
    shelfLife: varchar("shelf_life", { length: 50 }),
    containerClosure: varchar("container_closure", { length: 200 }),

    purityMethod: varchar("purity_method", { length: 200 }),
    potencyMethod: varchar("potency_method", { length: 200 }),
    criticalQualityAttrs: text("critical_quality_attrs"),

    payloadSmiles: text("payload_smiles"),
    payloadStructure: text("payload_structure"),
    pdbId: varchar("pdb_id", { length: 20 }),
    heavyChainSeq: text("heavy_chain_seq"),
    lightChainSeq: text("light_chain_seq"),
    cellLine: varchar("cell_line", { length: 100 }),

    companyOriginator: varchar("company_originator", { length: 300 }),
    companyLicensee: varchar("company_licensee", { length: 300 }),
    manufacturer: varchar("manufacturer", { length: 300 }),
    patentNumber: text("patent_number"),
    patentTitle: text("patent_title"),
    patentAssignee: varchar("patent_assignee", { length: 200 }),
    patentFilingDate: varchar("patent_filing_date", { length: 50 }),
    patentExpiry: varchar("patent_expiry", { length: 50 }),

    referenceLabel: varchar("reference_label", { length: 200 }),
    referenceUrl: varchar("reference_url", { length: 500 }),
    notes: text("notes"),
    lastUpdated: varchar("last_updated", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_drugs_stage").on(table.stage),
    index("idx_drugs_target").on(table.target),
    index("idx_drugs_payload_class").on(table.payloadClass),
    index("idx_drugs_lyophilization").on(table.lyophilization),
    index("idx_drugs_antibody").on(table.antibody),
    index("idx_drugs_brand").on(table.brandName),
  ]
);

export const users = mysqlTable("users", {
  id: char("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  role: mysqlEnum("role", userRoleValues).default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookmarks = mysqlTable(
  "bookmarks",
  {
    id: serial("id").primaryKey(),
    userId: char("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    drugId: int("drug_id")
      .notNull()
      .references(() => drugs.id, { onDelete: "cascade" }),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [uniqueIndex("idx_bookmarks_user_drug").on(table.userId, table.drugId)]
);

export const comments = mysqlTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    userId: char("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    drugId: int("drug_id")
      .notNull()
      .references(() => drugs.id, { onDelete: "cascade" }),
    parentId: int("parent_id"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_comments_drug").on(table.drugId),
    index("idx_comments_user").on(table.userId),
  ]
);

export const recipeGenerations = mysqlTable("recipe_generations", {
  id: serial("id").primaryKey(),
  userId: char("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  parameters: json("parameters").notNull(),
  resultIds: json("result_ids"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dataChangelog = mysqlTable(
  "data_changelog",
  {
    id: serial("id").primaryKey(),
    drugId: int("drug_id").references(() => drugs.id, { onDelete: "set null" }),
    userId: char("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
    field: varchar("field", { length: 100 }),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    source: varchar("source", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_changelog_drug").on(table.drugId)]
);

export const submissions = mysqlTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    userId: char("user_id", { length: 36 }).references(() => users.id, { onDelete: "cascade" }),
    drugName: varchar("drug_name", { length: 300 }),
    fieldData: json("field_data").notNull(),
    status: mysqlEnum("status", submissionStatusValues).default("pending"),
    reviewerId: char("reviewer_id", { length: 36 }),
    reviewNote: text("review_note"),
    createdAt: timestamp("created_at").defaultNow(),
    reviewedAt: timestamp("reviewed_at"),
  },
  (table) => [index("idx_submissions_status").on(table.status)]
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: char("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }),
    title: varchar("title", { length: 200 }),
    body: text("body"),
    link: varchar("link", { length: 500 }),
    read: boolean("read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_notifications_user").on(table.userId),
    index("idx_notifications_unread").on(table.read),
  ]
);

export type Drug = typeof drugs.$inferSelect;
export type NewDrug = typeof drugs.$inferInsert;
export type User = typeof users.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type RecipeGeneration = typeof recipeGenerations.$inferSelect;
export type ChangelogEntry = typeof dataChangelog.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
