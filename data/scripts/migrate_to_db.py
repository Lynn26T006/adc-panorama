#!/usr/bin/env python3
"""
将 adc_products.json 导入 MySQL 数据库。

用法:
  python3 data/scripts/migrate_to_db.py [--dry-run]

前置条件:
  1. 已在 MySQL 中执行 migrations/0000_initial_schema.sql 建表
  2. 已配置 .env.local 中的 DATABASE_URL (mysql://user:pass@host:3306/db)
"""

import json
import os
import sys
import re
import pymysql

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(os.path.dirname(DATA_DIR))
JSON_FILE = os.path.join(os.path.dirname(DATA_DIR), "adc_products.json")


def parse_env_database_url():
    """从 .env.local 读取 DATABASE_URL"""
    env_file = os.path.join(PROJECT_DIR, ".env.local")
    if not os.path.exists(env_file):
        print("ERROR: 未找到 .env.local")
        return None
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            if key.strip() == "DATABASE_URL":
                return val.strip()
    return None


def parse_mysql_url(url):
    """解析 mysql://user:pass@host:port/db 格式"""
    m = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', url)
    if not m:
        raise ValueError(f"无法解析 DATABASE_URL: {url}\n格式应为: mysql://user:pass@host:port/db")
    return {
        "user": m.group(1),
        "password": m.group(2),
        "host": m.group(3),
        "port": int(m.group(4)),
        "database": m.group(5),
    }


def migrate(dry_run=False):
    print("=== ADC Panorama 数据迁移：JSON → MySQL ===\n")

    url = parse_env_database_url()
    if not url:
        print("请先在 .env.local 中配置 DATABASE_URL")
        print("格式: DATABASE_URL=mysql://root:password@host:3306/adc_panorama")
        return 1

    cfg = parse_mysql_url(url)
    masked_url = re.sub(r':[^@]+@', ':****@', url)
    print(f"数据库: {cfg['host']}:{cfg['port']}/{cfg['database']}")

    with open(JSON_FILE) as f:
        products = json.load(f)
    print(f"数据源: {len(products)} 条产品记录")

    if dry_run:
        print("\n[Dry Run] 只验证不写入\n")

    conn = pymysql.connect(
        host=cfg["host"],
        port=cfg["port"],
        user=cfg["user"],
        password=cfg["password"],
        database=cfg["database"],
        charset="utf8mb4",
    )
    cur = conn.cursor()
    print("数据库连接成功\n")

    fields = [
        "adcdb_id", "antibody", "brand_name", "generic_cn", "antibody_subclass",
        "target", "stage", "indication", "approval_year", "approval_regions",
        "payload_name", "payload_class", "payload_mechanism",
        "linker_name", "linker_type", "linker_structure",
        "conjugation_method", "conjugation_site", "conjugation_chemistry",
        "dar", "dar_distribution", "purification_method",
        "dosage_form", "lyophilization", "lyo_buffer", "lyo_stabilizer",
        "lyo_surfactant", "lyo_ph", "lyo_cycle", "lyo_pre_conc",
        "lyo_post_conc", "reconstitution_media", "liquid_excipients",
        "storage_condition", "shelf_life", "container_closure",
        "purity_method", "potency_method", "critical_quality_attrs",
        "payload_smiles", "payload_structure", "pdb_id",
        "heavy_chain_seq", "light_chain_seq", "cell_line",
        "company_originator", "company_licensee", "manufacturer",
        "patent_number", "patent_title", "patent_assignee",
        "patent_filing_date", "patent_expiry",
        "reference_label", "reference_url", "notes", "last_updated",
    ]

    placeholders = ", ".join(["%s"] * len(fields))
    insert_sql = f"INSERT INTO drugs ({', '.join(fields)}) VALUES ({placeholders})"

    success = 0
    skipped = 0
    errors = 0

    for i, p in enumerate(products):
        values = (
            p.get("id"),
            p.get("antibody", ""),
            p.get("brandName"),
            p.get("genericNameCn"),
            p.get("antibodySubclass"),
            p.get("target"),
            p.get("stage"),
            json.dumps(p.get("indication")) if p.get("indication") else None,
            p.get("approvalYear"),
            json.dumps(p.get("approvalRegions")) if p.get("approvalRegions") else None,
            p.get("payloadName"),
            p.get("payloadClass"),
            p.get("payloadMechanism"),
            p.get("linkerName"),
            p.get("linkerType"),
            p.get("linkerStructure"),
            p.get("conjugationMethod"),
            p.get("conjugationSite"),
            p.get("conjugationChemistry"),
            p.get("dar"),
            p.get("darDistribution"),
            p.get("purificationMethod"),
            p.get("dosageForm"),
            1 if p.get("lyophilization") else 0,
            p.get("lyoExcipientsBuffer"),
            p.get("lyoExcipientsStabilizer"),
            p.get("lyoExcipientsSurfactant"),
            p.get("lyoPh"),
            p.get("lyoCycle"),
            p.get("lyoPreConc"),
            p.get("lyoPostConc"),
            p.get("reconstitutionMedia"),
            p.get("liquidExcipients"),
            p.get("storageCondition"),
            p.get("shelfLife"),
            p.get("containerClosure"),
            p.get("purityMethod"),
            p.get("potencyMethod"),
            p.get("criticalQualityAttrs"),
            p.get("payloadSmiles"),
            p.get("payloadStructure"),
            p.get("pdbId"),
            p.get("antibodySequenceHeavy"),
            p.get("antibodySequenceLight"),
            p.get("cellLine"),
            p.get("companyOriginator"),
            p.get("companyLicensee"),
            p.get("manufacturer"),
            p.get("patentNumber"),
            p.get("patentTitle"),
            p.get("patentAssignee"),
            p.get("patentFilingDate"),
            p.get("patentExpiry"),
            p.get("referenceLabel"),
            p.get("referenceUrl"),
            p.get("notes"),
            p.get("lastUpdated"),
        )

        if dry_run:
            success += 1
            if i < 3:
                print(f"  [{i+1}] {p.get('antibody', '?')[:50]} — OK")
            continue

        try:
            cur.execute(insert_sql, values)
            success += 1
        except pymysql.err.IntegrityError:
            skipped += 1
        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"  ERROR [{i+1}] {p.get('antibody', '?')[:40]}: {e}")

        if (i + 1) % 500 == 0:
            conn.commit()
            print(f"  进度: {i+1}/{len(products)} ({success} 成功, {skipped} 跳过, {errors} 失败)")

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n=== 迁移完成 ===")
    print(f"成功: {success}")
    print(f"跳过(重复): {skipped}")
    print(f"失败: {errors}")
    return 0


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    sys.exit(migrate(dry_run=dry))
