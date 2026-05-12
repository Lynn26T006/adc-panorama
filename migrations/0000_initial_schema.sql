-- ADC Panorama 初始数据库 schema (MySQL 版)
-- 用法: mysql -h <host> -u <user> -p <db> < this_file.sql

CREATE DATABASE IF NOT EXISTS adc_panorama CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE adc_panorama;

-- ============================================================
-- 1. 药物主表
-- ============================================================
CREATE TABLE drugs (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  adcdb_id        VARCHAR(20) UNIQUE,
  antibody        VARCHAR(300) NOT NULL,
  brand_name      VARCHAR(200),
  generic_cn      VARCHAR(300),
  antibody_subclass VARCHAR(50),
  target          VARCHAR(200),
  stage           VARCHAR(50),
  indication      JSON,
  approval_year   INT,
  approval_regions JSON,

  -- CMC 载荷与连接子
  payload_name    VARCHAR(200),
  payload_class   VARCHAR(100),
  payload_mechanism VARCHAR(300),
  linker_name     VARCHAR(200),
  linker_type     VARCHAR(100),
  linker_structure TEXT,
  conjugation_method VARCHAR(200),
  conjugation_site  VARCHAR(200),
  conjugation_chemistry VARCHAR(300),
  dar             VARCHAR(50),
  dar_distribution VARCHAR(200),
  purification_method VARCHAR(200),

  -- 制剂冻干
  dosage_form     VARCHAR(100),
  lyophilization  TINYINT(1) DEFAULT 0,
  lyo_buffer      TEXT,
  lyo_stabilizer  TEXT,
  lyo_surfactant  TEXT,
  lyo_ph          VARCHAR(20),
  lyo_cycle       TEXT,
  lyo_pre_conc    VARCHAR(100),
  lyo_post_conc   VARCHAR(100),
  reconstitution_media VARCHAR(200),
  liquid_excipients    TEXT,
  storage_condition    VARCHAR(200),
  shelf_life      VARCHAR(50),
  container_closure    VARCHAR(200),

  -- 分析质控
  purity_method   VARCHAR(200),
  potency_method  VARCHAR(200),
  critical_quality_attrs TEXT,

  -- 分子信息
  payload_smiles  TEXT,
  payload_structure TEXT,
  pdb_id          VARCHAR(20),
  heavy_chain_seq LONGTEXT,
  light_chain_seq LONGTEXT,
  cell_line       VARCHAR(100),

  -- 商业信息
  company_originator VARCHAR(300),
  company_licensee   VARCHAR(300),
  manufacturer    VARCHAR(300),
  patent_number   TEXT,
  patent_title    TEXT,
  patent_assignee VARCHAR(200),
  patent_filing_date VARCHAR(50),
  patent_expiry   VARCHAR(50),

  -- 元数据
  reference_label VARCHAR(200),
  reference_url   VARCHAR(500),
  notes           TEXT,
  last_updated    VARCHAR(50),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_stage (stage),
  INDEX idx_target (target),
  INDEX idx_payload_class (payload_class),
  INDEX idx_lyophilization (lyophilization),
  INDEX idx_antibody (antibody),
  INDEX idx_brand (brand_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. 用户表
-- ============================================================
CREATE TABLE users (
  id            CHAR(36) PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  display_name  VARCHAR(100),
  avatar_url    TEXT,
  role          ENUM('user', 'editor', 'admin') DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. 收藏
-- ============================================================
CREATE TABLE bookmarks (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   CHAR(36) NOT NULL,
  drug_id   INT NOT NULL,
  note      TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_bookmarks_user_drug (user_id, drug_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. 评论
-- ============================================================
CREATE TABLE comments (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   CHAR(36) NOT NULL,
  drug_id   INT NOT NULL,
  parent_id INT,
  content   TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_comments_drug (drug_id),
  INDEX idx_comments_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. 配方生成记录
-- ============================================================
CREATE TABLE recipe_generations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     CHAR(36),
  parameters  JSON NOT NULL,
  result_ids  JSON,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. 数据变更日志
-- ============================================================
CREATE TABLE data_changelog (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  drug_id     INT,
  user_id     CHAR(36),
  field       VARCHAR(100),
  old_value   TEXT,
  new_value   TEXT,
  source      VARCHAR(100),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_changelog_drug (drug_id),
  FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. 数据提交
-- ============================================================
CREATE TABLE submissions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     CHAR(36),
  drug_name   VARCHAR(300),
  field_data  JSON NOT NULL,
  status      ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  reviewer_id CHAR(36),
  review_note TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  INDEX idx_submissions_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. 通知
-- ============================================================
CREATE TABLE notifications (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   CHAR(36) NOT NULL,
  type      VARCHAR(50),
  title     VARCHAR(200),
  body      TEXT,
  link      VARCHAR(500),
  `read`    TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_unread (`read`),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
