#!/usr/bin/env python3
"""Patch existing entries: fetch ADCdb detail pages for all entries missing target/company/DAR."""
import json, requests, time, sys, os, re
from datetime import datetime

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(DATA_DIR, "../adc_products.json")
H = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'}
BASE = "https://adcdb.idrblab.net"

def fetch_detail(adc_id):
    try:
        resp = requests.get(f"{BASE}/data/adc/details/{adc_id}", headers=H, timeout=20)
        if resp.status_code != 200:
            return {}
        html = resp.text
        info = {}
        rows = re.findall(r'<tr[^>]*>\s*<th[^>]*>(.*?)</th>\s*<td[^>]*>(.*?)</td>', html, re.DOTALL)
        for th, td in rows:
            key = re.sub(r'<[^>]+>', '', th).strip()
            val = re.sub(r'<[^>]+>', '', td).strip()
            val = re.sub(r'\s+', ' ', val)
            if key == 'Antigen Name':
                info['target'] = val
            elif key == 'Organization':
                info['company'] = val
            elif key == 'Drug-to-Antibody Ratio':
                info['dar'] = val
            elif key == 'Indication':
                ind = re.search(r'In total \d+ Indication\(s\)\s*(.+?)(?:\s+Approved|\s+Phase|\s+Clinical)', val)
                if ind:
                    info['indication'] = ind.group(1).strip()
            elif key == 'Conjugate Type':
                info['conjugation'] = val
        return info
    except Exception as e:
        print(f"  Error: {e}")
        return {}

def main():
    with open(JSON_PATH) as f:
        data = json.load(f)

    need_patch = [d for d in data if d['id'].startswith('DRG') and not d.get('target')]
    print(f"Entries needing patch: {len(need_patch)}")

    patched = 0
    checkpoint_every = 100

    for i, d in enumerate(need_patch):
        detail = fetch_detail(d['id'])
        if not detail:
            time.sleep(0.15)
            continue

        changed = False
        if detail.get('target') and not d.get('target'):
            d['target'] = detail['target']
            changed = True
        if detail.get('company') and not d.get('companyOriginator'):
            d['companyOriginator'] = detail['company']
            changed = True
        if detail.get('dar') and not d.get('dar'):
            d['dar'] = detail['dar']
            changed = True
        if detail.get('conjugation') and not d.get('conjugationMethod'):
            d['conjugationMethod'] = detail['conjugation']
            changed = True
        if detail.get('indication') and (not d.get('indication') or d['indication'] == ['未公开']):
            d['indication'] = [detail['indication']]

        if changed:
            patched += 1

        if (i + 1) % 100 == 0:
            print(f"  [{i+1}/{len(need_patch)}] patched {patched} so far...")
            with open(JSON_PATH, 'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  [checkpoint]")

        time.sleep(0.15)

    with open(JSON_PATH, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    remaining = sum(1 for d in data if not d.get('target'))
    print(f"\nDone! Patched {patched}, remaining without target: {remaining}")

if __name__ == "__main__":
    main()
