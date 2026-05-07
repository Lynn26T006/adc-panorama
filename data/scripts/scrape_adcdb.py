#!/usr/bin/env python3
"""
ADCdb Scraper - Extracts ADC pipeline data from adcdb.idrblab.net
Usage: python3 scrape_adcdb.py [max_pages_per_term]
"""

import requests
import re
import json
import time
import sys
from collections import Counter

BASE_URL = "https://adcdb.idrblab.net"
SEARCH_URL = f"{BASE_URL}/search/result/adc"

# Comprehensive list of search terms to cover the ADC landscape
SEARCH_TERMS = [
    "vedotin", "deruxtecan", "govitecan", "tesirine", "mafodotin",
    "emtansine", "ozogamicin", "soravtansine", "pasudotox", "sarotalocan",
    "tirumotecan", "rezetecan", "botidotin", "brengitecan", "pelitecan",
    "ADC", "PBD", "MMAE", "DM1", "DM4", "DXd", "SN-38", "calicheamicin",
    "maytansinoid", "auristatin", "camptothecin", "duostatin",
    "trastuzumab", "sacituzumab", "loncastuximab", "belantamab",
    "mirvetuximab", "inotuzumab", "gemtuzumab", "moxetumomab",
    "cetuximab", "polatuzumab", "enfortumab", "tisotumab", "brentuximab",
    "disitamab", "datopotamab", "patritumab", "ifinatamab", "raludotatug",
    "zocilurtatug", "izalontamab", "ficerafusp", "pivekimab",
    "telisotuzumab", "becotatug", "HER2", "TROP2", "HER3", "EGFR",
    "B7-H3", "CDH6", "DLL3", "ROR1", "CLDN", "Nectin-4", "FRalpha",
    "BCMA", "CD19", "CD22", "CD30", "CD33", "CD79b", "c-Met",
    "Tissue Factor", "PD-L1", "MSLN",
]

def search_adc(term, page=0):
    """Search ADCdb and return parsed entries."""
    params = {"search_api_fulltext": term, "page": page}
    try:
        resp = requests.get(SEARCH_URL, params=params, timeout=30)
        if resp.status_code != 200:
            return []
        return parse_results(resp.text)
    except Exception as e:
        print(f"  Error: {e}")
        return []

def parse_results(html):
    """Parse ADC entries from search results HTML."""
    entries = []
    # Find ADC ID blocks
    id_matches = re.findall(r'ADC ID:\s*(\w+)', html)
    name_matches = re.findall(r'ADC Name:\s*([^<\n]+)', html)
    ab_matches = re.findall(r'Antibody Name:\s*([^<\n]+)', html)
    payload_matches = re.findall(r'Payload Name:\s*([^<\n]+)', html)
    linker_matches = re.findall(r'Linker Name:\s*([^<\n]+)', html)
    status_matches = re.findall(r'Drug status:\s*([^<\n]+)', html)

    for i, adc_id in enumerate(id_matches):
        entry = {'adc_id': adc_id.strip()}
        if i < len(name_matches): entry['name'] = name_matches[i].strip()
        if i < len(ab_matches): entry['antibody'] = ab_matches[i].strip()
        if i < len(payload_matches): entry['payload'] = payload_matches[i].strip()
        if i < len(linker_matches): entry['linker'] = linker_matches[i].strip()
        if i < len(status_matches): entry['status'] = status_matches[i].strip()
        entries.append(entry)

    return entries

def fetch_detail(adc_id):
    """Fetch detailed info from ADC detail page."""
    url = f"{BASE_URL}/node/{adc_id}"  # ADCdb detail pages use node IDs
    try:
        resp = requests.get(url, timeout=30)
        if resp.status_code != 200:
            return None

        html = resp.text
        detail = {}

        # Extract target
        t = re.search(r'Target Name:\s*([^<\n]+)', html)
        if t: detail['target'] = t.group(1).strip()

        # Extract indication/disease
        d = re.search(r'Disease:\s*([^<\n]+)', html)
        if d: detail['disease'] = d.group(1).strip()

        # Extract company
        c = re.search(r'Company:\s*([^<\n]+)', html)
        if c: detail['company'] = c.group(1).strip()

        # Extract payload mechanism
        pm = re.search(r'Payload Mechanism:\s*([^<\n]+)', html)
        if pm: detail['payload_mechanism'] = pm.group(1).strip()

        # Extract linker type
        lt = re.search(r'Linker Type:\s*([^<\n]+)', html)
        if lt: detail['linker_type'] = lt.group(1).strip()

        # Extract DAR
        dar = re.search(r'DAR:\s*([^<\n]+)', html)
        if dar: detail['dar'] = dar.group(1).strip()

        # Extract conjugation
        conj = re.search(r'Conjugation[^:]*:\s*([^<\n]+)', html)
        if conj: detail['conjugation'] = conj.group(1).strip()

        return detail
    except:
        return None

def main():
    max_pages = int(sys.argv[1]) if len(sys.argv) > 1 else 3

    all_entries = {}
    seen = set()

    print(f"ADCdb Scraper - {len(SEARCH_TERMS)} terms, {max_pages} pages each\n")

    for term in SEARCH_TERMS:
        print(f"Search: '{term}'", end="", flush=True)
        term_count = 0
        for page in range(max_pages):
            entries = search_adc(term, page)
            if not entries:
                break
            for e in entries:
                if e['adc_id'] not in seen:
                    seen.add(e['adc_id'])
                    all_entries[e['adc_id']] = e
                    term_count += 1
            time.sleep(0.3)
        print(f" -> +{term_count} (total: {len(all_entries)})")
        time.sleep(0.5)

    print(f"\n{'='*50}")
    print(f"Total unique ADCs found: {len(all_entries)}")

    # Status distribution
    statuses = Counter(e.get('status', 'Unknown') for e in all_entries.values())
    print("\nBy status:")
    for s, c in statuses.most_common():
        print(f"  {s}: {c}")

    # Save
    output = list(all_entries.values())
    fname = 'adcdb_scraped.json'
    with open(fname, 'w') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\nSaved {len(output)} entries to {fname}")

if __name__ == "__main__":
    main()
