#!/usr/bin/env python3
"""
Bulk import from ADCdb - systematically collects all ADC entries.
Uses broad searches to capture the full database.
"""

import requests
import re
import json
import time
import sys

BASE = "https://adcdb.idrblab.net"
SEARCH = f"{BASE}/search/result/adc"

def clean_html(text):
    """Strip HTML tags and normalize whitespace."""
    text = re.sub(r'<[^>]+>', ' ', text)
    text = text.replace('&nbsp;', ' ')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def search_page(query, page=0):
    """Fetch and parse a single search results page."""
    params = {"search_api_fulltext": query, "page": page}
    try:
        resp = requests.get(SEARCH, params=params, timeout=30)
        if resp.status_code != 200:
            return [], 0
        html = resp.text
        clean = clean_html(html)

        entries = []
        # Find all ADC ID blocks
        for m in re.finditer(r'ADC ID:\s*(\w+)', clean):
            adc_id = m.group(1)
            # Get text after this ID until next ID or end
            end = clean.find('ADC ID:', m.end())
            block = clean[m.start():end if end > 0 else len(clean)]

            entry = {'adc_id': adc_id}

            name = re.search(r'ADC Name:\s*(.+?)(?=\s*ADC Info|\s*Drug Status)', block)
            if name: entry['name'] = name.group(1).strip()

            status = re.search(r'Drug Status:\s*(.+?)(?=\s*Representative)', block)
            if status: entry['status'] = status.group(1).strip()

            ind = re.search(r'Representative Indication:\s*(.+?)(?=\s*Antibody)', block)
            if ind: entry['indication'] = ind.group(1).strip()

            ab = re.search(r'Antibody Name:\s*(.+?)(?=\s*Antibody Info|\s*Payload)', block)
            if ab: entry['antibody'] = ab.group(1).strip()

            payload = re.search(r'Payload Name:\s*(.+?)(?=\s*Payload Info|\s*Linker)', block)
            if payload: entry['payload'] = payload.group(1).strip()

            linker = re.search(r'Linker Name:\s*(.+?)(?=\s*Linker Info|\s*ADC ID|\s*$)', block)
            if linker: entry['linker'] = linker.group(1).strip()

            entries.append(entry)

        # Check for more pages
        has_more = 'page=' + str(page+1) in html
        return entries, has_more

    except Exception as e:
        print(f"  Error: {e}")
        return [], False

def main():
    # Broad search queries to capture all entries
    queries = [
        # By payload type
        "auristatin", "maytansinoid", "calicheamicin", "duocarmycin",
        "pyrrolobenzodiazepine", "camptothecin", "exatecan", "deruxtecan",
        "topoisomerase", "tubulin", "DNA", "MMAE", "MMAF", "DM1", "DM4",
        "DXd", "SN-38", "PBD", "DGN", "SG3199", "PNU",
        # By linker
        "Val-Cit", "Val-Ala", "maleimide", "disulfide", "cleavable",
        # By target
        "HER2", "EGFR", "TROP2", "B7-H3", "CDH6", "NECTIN", "FRalpha",
        "BCMA", "CD19", "CD20", "CD22", "CD30", "CD33", "CD37", "CD70",
        "CD79", "CD123", "CD138", "CDH17", "CLDN", "c-MET", "DLL3",
        "MSLN", "ROR1", "ROR2", "PSMA", "PD-L1", "5T4", "CEACAM",
        "LIV-1", "ENPP3", "NaPi2b", "SLITRK6", "GPRC5D", "STEAP1",
        "MUC1", "MUC16", "TA-MUC1", "AXL", "EPHA2", "FGFR",
        # General
        "antibody", "drug conjugate", "immunoconjugate",
        "ADC", "vedotin", "tesirine", "govitecan", "mafodotin",
    ]

    seen = set()
    all_entries = {}

    for q in queries:
        print(f"Query: '{q}'", end="", flush=True)
        page = 0
        q_count = 0
        while True:
            entries, has_more = search_page(q, page)
            for e in entries:
                if e['adc_id'] not in seen:
                    seen.add(e['adc_id'])
                    all_entries[e['adc_id']] = e
                    q_count += 1
            if not has_more or page >= 50:  # Max 50 pages per query
                break
            page += 1
            time.sleep(0.2)
        print(f" -> {q_count} new (total: {len(all_entries)})")
        time.sleep(0.5)

    print(f"\n{'='*60}")
    print(f"Total unique ADCs collected: {len(all_entries)}")

    from collections import Counter
    statuses = Counter(e.get('status', 'Unknown') for e in all_entries.values())
    print("\nBy status:")
    for s, c in statuses.most_common():
        print(f"  {s}: {c}")

    output = list(all_entries.values())
    fname = 'adcdb_full.json'
    with open(fname, 'w') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\nSaved to {fname}")

if __name__ == "__main__":
    main()
