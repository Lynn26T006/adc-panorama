#!/usr/bin/env python3
"""
Extract formulation details from FDA drug labels and DrugMAP.
Enriches adc_products.json with buffer, stabilizer, surfactant, pH, etc.

Sources:
1. FDA drug labels (DESCRIPTION section) — for approved drugs
2. DrugMAP bulk download — drug DIG/excipient classification

Usage: python3 enrich_formulation.py [--full]
  Without --full: only enrich products missing formulation data
  With --full: re-scrape all products with brand names
"""

import json
import re
import os
import time
import requests
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent
PRODUCTS_FILE = DATA_DIR / "adc_products.json"
UPDATE_LOG = DATA_DIR / "update_log.json"

FDA_API = "https://api.fda.gov/drug/label.json"
FDA_HEADERS = {"Accept": "application/json"}
REQUEST_DELAY = 0.5  # seconds between API calls


def load_products():
    with open(PRODUCTS_FILE) as f:
        return json.load(f)


def save_products(products):
    with open(PRODUCTS_FILE, "w") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)


def log_update(msg):
    entry = {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "action": msg}
    log = []
    if UPDATE_LOG.exists():
        with open(UPDATE_LOG) as f:
            raw = json.load(f)
            log = raw if isinstance(raw, list) else [raw]
    log.append(entry)
    with open(UPDATE_LOG, "w") as f:
        json.dump(log, f, ensure_ascii=False, indent=2)


def fetch_fda_label(brand_name):
    """Fetch FDA drug label for a brand name, return the results dict or None."""
    try:
        url = f"{FDA_API}?search=openfda.brand_name:{brand_name}&limit=1"
        resp = requests.get(url, headers=FDA_HEADERS, timeout=20)
        if resp.status_code != 200:
            # try without field qualifier
            url2 = f"{FDA_API}?search={brand_name}&limit=1"
            resp2 = requests.get(url2, headers=FDA_HEADERS, timeout=20)
            if resp2.status_code != 200:
                return None
            data = resp2.json()
        else:
            data = resp.json()
        results = data.get("results", [])
        return results[0] if results else None
    except Exception as e:
        print(f"    FDA API error for {brand_name}: {e}")
        return None


def extract_formulation_from_description(desc_text):
    """
    Parse FDA label DESCRIPTION section for formulation details.
    Returns dict with extracted fields.
    """
    if not desc_text:
        return {}

    result = {}

    # Extract pH value: "pH of X.X" or "pH X.X" or "with a pH of X.X"
    ph_patterns = [
        r'(?:with\s+a\s+)?pH\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*(?:[–-]\s*(\d+(?:\.\d+)?))?',
        r'pH\s*(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)',
    ]
    for pat in ph_patterns:
        m = re.search(pat, desc_text, re.IGNORECASE)
        if m:
            if m.group(2):
                result["lyoPh"] = f"pH {m.group(1)}-{m.group(2)}"
            else:
                result["lyoPh"] = f"pH {m.group(1)}"
            break

    # Extract protein concentration: "XX mg/mL" pattern near "contains" or after reconstitution
    conc_match = re.findall(r'(\d+(?:\.\d+)?)\s*mg/mL', desc_text)
    if conc_match:
        result["lyoPostConc"] = f"{conc_match[0]} mg/mL (复溶后)"

    # Extract buffer: patterns like "sodium succinate (10 mM)", "L-histidine (20 mM)", "tris (X mg)", etc.
    buffer_patterns = [
        r'(sodium\s+succinate\s*\(?\d+\s*mM\)?)',
        r'(sodium\s+citrate\s*[^,;.)]*?)',
        r'(L?-?histidine[^,;.)]*?)',
        r'(tris[^,;.)]*?(?:mM|buffer)[^,;.)]*?)',
        r'(sodium\s+phosphate[^,;.)]*?)',
        r'(potassium\s+phosphate[^,;.)]*?)',
        r'(succinate\s*buffer[^,;.)]*?)',
        r'(citrate\s*buffer[^,;.)]*?)',
        r'(phosphate\s*buffer[^,;.)]*?)',
        r'(acetic\s+acid[^,;.)]*?)',
        r'(arginine[^,;.)]*?(?:mM|buffer|HCl)[^,;.)]*?)',
    ]
    buffers_found = []
    for pat in buffer_patterns:
        m = re.findall(pat, desc_text, re.IGNORECASE)
        buffers_found.extend(m)
    if buffers_found:
        result["lyoExcipientsBuffer"] = "; ".join(buffers_found[:2])

    # Extract stabilizer/sugar: sucrose, trehalose, mannitol
    sugar_patterns = [
        r'(sucrose\s*\[?[^,\])]*?\]?)',
        r'(trehalose[^,;.)]*?)',
        r'(mannitol[^,;.)]*?)',
        r'(lactose[^,;.)]*?)',
        r'(dextran[^,;.)]*?)',
        r'(maltose[^,;.)]*?)',
        r'(glucose[^,;.)]*?)',
    ]
    sugars_found = []
    for pat in sugar_patterns:
        m = re.findall(pat, desc_text, re.IGNORECASE)
        sugars_found.extend(m)
    if sugars_found:
        result["lyoExcipientsStabilizer"] = "; ".join(sugars_found[:3])

    # Extract surfactant: polysorbate
    surfactant_patterns = [
        r'(polysorbate\s*(?:80|20)\s*\[?[^\])]*?\]?)',
        r'(Polysorbate\s*(?:80|20)\s*\(?[^,;.)]*?\)?)',
        r'(Tween\s*(?:80|20)[^,;.)]*?)',
    ]
    surfactants_found = []
    for pat in surfactant_patterns:
        m = re.findall(pat, desc_text)
        surfactants_found.extend(m)
    if surfactants_found:
        result["lyoExcipientsSurfactant"] = "; ".join(surfactants_found[:2])

    # Detect if lyophilized
    if re.search(r'lyophilized|freeze[- ]?dried|lyophilization', desc_text, re.IGNORECASE):
        result["lyophilization"] = True
        result["dosageForm"] = result.get("dosageForm") or "冻干粉针"

    # Detect liquid formulation
    if re.search(r'solution\s+for\s+injection|injection.*solution|sterile\s+solution', desc_text, re.IGNORECASE):
        if not result.get("lyophilization"):
            result["dosageForm"] = result.get("dosageForm") or "注射液"

    # Extract storage condition
    storage_match = re.search(
        r'store\s+(?:at|between)\s*((?:\d+(?:\.\d+)?\s*(?:°C|°|C|to|-)[^,;.]*))',
        desc_text, re.IGNORECASE
    )
    if storage_match:
        result["storageCondition"] = storage_match.group(1).strip()

    # Extract reconstitution media
    recon_match = re.search(
        r'(?:reconstitut(?:e|ed|ion)\s*(?:with|in|using)?\s*)([^,;.]*?(?:water|WFI|WFI|saline|NaCl|dextrose|SWFI)[^,;.]*?)',
        desc_text, re.IGNORECASE
    )
    if recon_match:
        result["reconstitutionMedia"] = recon_match.group(1).strip()

    return result


def enrich_from_fda(products, full_mode=False):
    """For each product with a brand name, try to get FDA label formulation data."""
    updated = 0
    tried = 0

    for p in products:
        brand = p.get("brandName", "").strip()
        if not brand or "/" in brand:
            # skip entries with multiple brand names or no brand name
            continue

        # Skip if already has formulation data (unless full mode)
        if not full_mode and p.get("lyoExcipientsBuffer"):
            continue

        # Only try approved or NDA-stage drugs
        stage = p.get("stage", "")
        if not full_mode and stage not in ("已上市", "NDA", "临床III期"):
            continue

        tried += 1
        print(f"  [{tried}] {brand} ({p['antibody'][:40]}...) ...", end=" ")

        label = fetch_fda_label(brand)
        if not label:
            print("no FDA label found")
            time.sleep(REQUEST_DELAY)
            continue

        desc = label.get("description", [""])[0]
        if not desc:
            # some labels store description differently
            for elem in label.get("spl_product_data_elements", []):
                if isinstance(elem, str) and "DESCRIPTION" in elem:
                    desc = elem
                    break

        if not desc:
            print("no description field")
            time.sleep(REQUEST_DELAY)
            continue

        formulation = extract_formulation_from_description(desc)

        if formulation.get("lyoExcipientsBuffer") or formulation.get("lyoPh"):
            changed = []
            for key, val in formulation.items():
                if val and not p.get(key):
                    p[key] = val
                    changed.append(key)
            if changed:
                updated += 1
                print(f"✓ enriched: {', '.join(changed)}")
            else:
                print("(already had data)")
        else:
            # still fill dosage form and lyophilization if detected
            if formulation.get("lyophilization") and not p.get("lyophilization"):
                p["lyophilization"] = True
                p["dosageForm"] = p.get("dosageForm") or "冻干粉针"
                updated += 1
                print("✓ lyophilization flag set")
            elif formulation.get("dosageForm") and not p.get("dosageForm"):
                p["dosageForm"] = formulation["dosageForm"]
                updated += 1
                print("✓ dosageForm set")
            else:
                print("no formulation info extracted")

        time.sleep(REQUEST_DELAY)

    return updated


def main():
    import sys
    full_mode = "--full" in sys.argv

    print("=== ADC Formulation Enrichment ===")
    print(f"Mode: {'full re-scrape' if full_mode else 'fill missing only'}")
    print()

    products = load_products()
    print(f"Loaded {len(products)} products")

    # Count current formulation coverage
    has_buf = sum(1 for p in products if p.get("lyoExcipientsBuffer"))
    has_ph = sum(1 for p in products if p.get("lyoPh"))
    has_stab = sum(1 for p in products if p.get("lyoExcipientsStabilizer"))
    print(f"Current: buffer={has_buf}, pH={has_ph}, stabilizer={has_stab}")
    print()

    print("--- FDA Label Formulation Extraction ---")
    n = enrich_from_fda(products, full_mode)
    print(f"Enriched {n} products from FDA labels")
    print()

    # Re-count
    has_buf2 = sum(1 for p in products if p.get("lyoExcipientsBuffer"))
    has_ph2 = sum(1 for p in products if p.get("lyoPh"))
    has_stab2 = sum(1 for p in products if p.get("lyoExcipientsStabilizer"))
    print(f"After enrichment: buffer={has_buf2}, pH={has_ph2}, stabilizer={has_stab2}")
    print(f"New: buffer +{has_buf2 - has_buf}, pH +{has_ph2 - has_ph}, stabilizer +{has_stab2 - has_stab}")

    save_products(products)
    log_update(f"formulation_enrich: FDA labels, buffer +{has_buf2 - has_buf}, pH +{has_ph2 - has_ph}")
    print("Saved to adc_products.json")


if __name__ == "__main__":
    main()
