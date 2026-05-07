#!/usr/bin/env python3
"""
Auto-update ADC database from ADCdb.
Run: python3 auto_update.py [--full]
  --full : re-scrape all entries (takes hours)
  default: only scrape new/updated entries since last run
"""

import requests, re, json, time, sys, os
from datetime import datetime
from collections import Counter

BASE = "https://adcdb.idrblab.net"
H = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'}
DATA_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(DATA_DIR, "../adc_products.json")
LOG_PATH = os.path.join(DATA_DIR, "../update_log.json")

TARGET_STATUSES = {'Approved', 'Phase 3', 'Phase 2', 'Phase 1', 'Investigative'}
STATUS_MAP = {
    'Approved': '已上市', 'Phase 3': '临床III期', 'Phase 2': '临床II期',
    'Phase 1': '临床I期', 'Investigative': 'IND/临床前',
    'Phase 3 (Terminated)': '临床III期 (终止)', 'Phase 2 (Terminated)': '临床II期 (终止)',
    'Phase 1 (Terminated)': '临床I期 (终止)',
}

# Search queries covering ADC landscape
SEARCH_QUERIES = [
    "vedotin", "deruxtecan", "tesirine", "mafodotin", "emtansine", "ozogamicin",
    "soravtansine", "govitecan", "MMAE", "DM1", "DM4", "DXd", "SN-38", "PBD",
    "auristatin", "camptothecin", "trastuzumab", "sacituzumab", "brentuximab",
    "HER2", "TROP2", "EGFR", "HER3", "B7-H3", "CDH6", "DLL3", "BCMA", "CLDN18",
    "Nectin-4", "c-Met", "FRalpha", "MSLN", "PD-L1", "CD19", "CD22", "CD30",
    "ROR1", "CEACAM5", "NaPi2b", "5T4", "GPRC5D", "LIV-1", "STEAP1", "PSMA",
]


def search_adc(query, page=0):
    """Search ADCdb and return parsed entries."""
    try:
        resp = requests.get(f"{BASE}/search/result/adc",
                           params={"search_api_fulltext": query, "page": page},
                           headers=H, timeout=30)
        if resp.status_code != 200: return []
        html = resp.text
        clean = re.sub(r'<[^>]+>', ' ', html).replace('&nbsp;', ' ')
        clean = re.sub(r'\s+', ' ', clean)
        entries = []
        for m in re.finditer(r'ADC ID:\s*(\w+)', clean):
            end = clean.find('ADC ID:', m.end())
            block = clean[m.start():end if end > 0 else len(clean)]
            e = {'adc_id': m.group(1)}
            for field, key in [('ADC Name:', 'name'), ('Drug Status:', 'status'),
                               ('Representative Indication:', 'indication'),
                               ('Antibody Name:', 'antibody'), ('Payload Name:', 'payload'),
                               ('Linker Name:', 'linker')]:
                v = re.search(field + r'\s*(.+?)(?=\s*(?:ADC Info|Drug Status|Representative|Antibody Name|Payload Name|Linker Name|Antibody Info|Payload Info|Linker Info|ADC ID|\s*$))', block)
                if v: e[key] = v.group(1).strip()
            if e.get('status') in TARGET_STATUSES:
                entries.append(e)
        return entries
    except Exception as e:
        print(f"  Search error: {e}")
        return []


def fetch_detail(adc_id):
    """Fetch additional details from ADC detail page."""
    try:
        resp = requests.get(f"{BASE}/data/adc/details/{adc_id}", headers=H, timeout=20)
        if resp.status_code != 200: return {}
        html = resp.text
        info = {}
        rows = re.findall(r'<tr[^>]*>\s*<th[^>]*>(.*?)</th>\s*<td[^>]*>(.*?)</td>', html, re.DOTALL)
        for th, td in rows:
            key = re.sub(r'<[^>]+>', '', th).strip()
            val = re.sub(r'<[^>]+>', '', td).strip()
            val = re.sub(r'\s+', ' ', val)
            if key == 'Antigen Name': info['target'] = val
            elif key == 'Organization': info['company'] = val
            elif key == 'Drug-to-Antibody Ratio': info['dar'] = val
            elif key == 'Indication':
                ind = re.search(r'In total \d+ Indication\(s\)\s*(.+?)(?:\s+Approved|\s+Phase|\s+Clinical)', val)
                if ind: info['indication'] = ind.group(1).strip()
            elif key == 'Conjugate Type': info['conjugation'] = val
        return info
    except:
        return {}


def create_entry(s, detail_info=None):
    """Create a standard ADC product entry from scraped data."""
    stage = STATUS_MAP.get(s.get('status', ''), 'IND/临床前')
    return {
        'id': s['adc_id'],
        'genericNameEn': s.get('name', ''), 'genericNameCn': '',
        'brandName': s.get('name', ''), 'target': detail_info.get('target', '') if detail_info else '',
        'antibody': s.get('antibody', ''), 'antibodySubclass': '',
        'indication': [detail_info.get('indication', s.get('indication', ''))] if detail_info or s.get('indication') else ['未公开'],
        'stage': stage,
        'companyOriginator': detail_info.get('company', '') if detail_info else '',
        'companyLicensee': '', 'approvalYear': None, 'approvalRegions': [],
        'payloadName': s.get('payload', ''), 'payloadClass': '', 'payloadMechanism': '',
        'linkerName': s.get('linker', ''), 'linkerType': '', 'linkerStructure': '',
        'conjugationMethod': detail_info.get('conjugation', '') if detail_info else '',
        'conjugationSite': '', 'conjugationChemistry': '',
        'dar': detail_info.get('dar', '') if detail_info else '',
        'darDistribution': '', 'purificationMethod': '',
        'dosageForm': '', 'lyophilization': False,
        'lyoExcipientsBuffer': '', 'lyoExcipientsStabilizer': '',
        'lyoExcipientsSurfactant': '', 'lyoPh': '', 'lyoPreConc': '',
        'lyoPostConc': '', 'lyoCycle': '', 'reconstitutionMedia': '',
        'liquidExcipients': '', 'storageCondition': '', 'shelfLife': '',
        'containerClosure': '', 'purityMethod': '', 'potencyMethod': '',
        'criticalQualityAttrs': '',
        'patentNumber': '', 'patentTitle': '', 'patentAssignee': '', 'patentFilingDate': '',
        'referenceLabel': f'ADCdb ID: {s["adc_id"]} | Auto-updated {datetime.now().strftime("%Y-%m-%d")}',
        'referenceUrl': f'https://adcdb.idrblab.net/search/result/adc?search_api_fulltext={s.get("name","")}',
        'lastUpdated': datetime.now().strftime('%Y-%m-%d'),
        'notes': f'来源: ADCdb | {s.get("status","")} | {s.get("payload","")}'
    }


def main():
    full_mode = "--full" in sys.argv
    print(f"=== ADC Auto-Update {'(FULL)' if full_mode else '(INCREMENTAL)'} ===")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # Load existing data
    with open(JSON_PATH) as f:
        existing = json.load(f)
    existing_ids = {e['id'] for e in existing}
    print(f"Existing entries: {len(existing)}")

    # Scrape search results
    seen = set()
    new_entries = []
    updated_count = 0

    for q in SEARCH_QUERIES:
        print(f"Searching: '{q}'", end="", flush=True)
        q_new = 0
        for page in range(5):  # 5 pages per query
            results = search_adc(q, page)
            if not results: break
            for s in results:
                if s['adc_id'] in seen: continue
                seen.add(s['adc_id'])

                if s['adc_id'] not in existing_ids:
                    # New entry - fetch details for clinical-stage
                    detail = {}
                    if s.get('status') in {'Approved', 'Phase 3', 'Phase 2', 'Phase 1'}:
                        detail = fetch_detail(s['adc_id'])
                        time.sleep(0.2)
                    new_entries.append(create_entry(s, detail))
                    q_new += 1
                elif full_mode and s.get('status') in {'Approved', 'Phase 3', 'Phase 2', 'Phase 1'}:
                    # Update existing clinical entry with detail info
                    for e in existing:
                        if e['id'] == s['adc_id'] and not e.get('target'):
                            detail = fetch_detail(s['adc_id'])
                            if detail.get('target'): e['target'] = detail['target']
                            if detail.get('company'): e['companyOriginator'] = detail['company']
                            if detail.get('dar'): e['dar'] = detail['dar']
                            updated_count += 1
                            time.sleep(0.2)
            time.sleep(0.3)
        print(f" -> +{q_new} new")
        time.sleep(0.5)

    # Merge new entries
    if new_entries:
        existing.extend(new_entries)
        print(f"\nAdded {len(new_entries)} new entries")

    if full_mode:
        print(f"Updated {updated_count} existing entries with detail info")

    # Save
    with open(JSON_PATH, 'w') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    # Log
    stages = Counter(e['stage'] for e in existing)
    log = {
        'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'total': len(existing),
        'new_added': len(new_entries),
        'updated': updated_count,
        'stages': dict(stages)
    }
    with open(LOG_PATH, 'w') as f:
        json.dump(log, f, ensure_ascii=False, indent=2)

    print(f"\nTotal: {len(existing)} entries")
    for s, c in stages.most_common(8):
        print(f"  {s}: {c}")
    print(f"Log saved to {LOG_PATH}")
    print("Done!")


if __name__ == "__main__":
    main()
