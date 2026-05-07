#!/usr/bin/env python3
"""
openFDA / Drugs@FDA fetcher for ADC product data.
Uses openFDA public API (US government data) — safe for commercial use.
Docs: https://open.fda.gov/apis/drug/
"""

import requests
import time
import os
import json

BASE = "https://api.fda.gov"
HEADERS = {"Accept": "application/json"}

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
FDA_CACHE = os.path.join(DATA_DIR, "../fda_cache.json")


def _load_cache():
    if os.path.exists(FDA_CACHE):
        with open(FDA_CACHE) as f:
            return json.load(f)
    return {}


def _save_cache(cache):
    with open(FDA_CACHE, "w") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def search_drug_label(brand_name):
    """Search openFDA drug labels by brand name."""
    cache = _load_cache()
    if brand_name in cache:
        return cache[brand_name]

    try:
        url = f"{BASE}/drug/label.json?search=brand_name:{brand_name}&limit=1"
        resp = requests.get(url, headers=HEADERS, timeout=20)
        if resp.status_code != 200:
            return None
        data = resp.json()
        results = data.get("results", [])
        if results:
            cache[brand_name] = results[0]
            _save_cache(cache)
            return results[0]
    except Exception as e:
        print(f"    FDA API error: {e}")
    return None


def search_drug_ndc(brand_name):
    """Search openFDA NDC directory for manufacturer info."""
    try:
        url = f"{BASE}/drug/ndc.json?search=brand_name:{brand_name}&limit=1"
        resp = requests.get(url, headers=HEADERS, timeout=20)
        if resp.status_code != 200:
            return None
        data = resp.json()
        results = data.get("results", [])
        if results:
            return results[0]
    except Exception as e:
        print(f"    FDA NDC API error: {e}")
    return None


def extract_label_info(label):
    """Extract relevant fields from an FDA label result."""
    openfda = label.get("openfda", {})
    return {
        "brand_name": openfda.get("brand_name", []),
        "generic_name": openfda.get("generic_name", []),
        "manufacturer_name": openfda.get("manufacturer_name", []),
        "substance_name": openfda.get("substance_name", []),
        "route": openfda.get("route", []),
        "product_type": openfda.get("product_type", []),
        "application_number": openfda.get("application_number", []),
        "spl_id": openfda.get("spl_id", []),
    }


def extract_ndc_info(ndc_result):
    """Extract packaging and manufacturer info from NDC data."""
    if not ndc_result:
        return {}
    return {
        "manufacturer_name": ndc_result.get("manufacturer_name", ""),
        "dosage_form": ndc_result.get("dosage_form", ""),
        "packaging": ndc_result.get("packaging", []),
        "product_type": ndc_result.get("product_type", ""),
    }


def get_drug_fda_info(brand_name):
    """Get comprehensive FDA info for a drug. Returns enriched data dict."""
    label = search_drug_label(brand_name)
    if not label:
        # Try lowercase
        label = search_drug_label(brand_name.lower())

    result = {
        "fda_label_found": False,
        "fda_brand_name": brand_name,
        "fda_generic_name": "",
        "fda_manufacturer": "",
        "fda_application_number": "",
        "fda_dosage_form": "",
    }

    if label and label.get("openfda"):
        info = extract_label_info(label)
        result.update({
            "fda_label_found": True,
            "fda_brand_name": info["brand_name"][0] if info["brand_name"] else brand_name,
            "fda_generic_name": info["generic_name"][0] if info["generic_name"] else "",
            "fda_manufacturer": info["manufacturer_name"][0] if info["manufacturer_name"] else "",
            "fda_application_number": info["application_number"][0] if info["application_number"] else "",
        })
        time.sleep(0.3)

    # Also try NDC for packaging/manufacturer
    ndc = search_drug_ndc(brand_name)
    if ndc:
        ndc_info = extract_ndc_info(ndc)
        if ndc_info.get("dosage_form"):
            result["fda_dosage_form"] = ndc_info["dosage_form"]
        if ndc_info.get("manufacturer_name") and not result["fda_manufacturer"]:
            result["fda_manufacturer"] = ndc_info["manufacturer_name"]
        time.sleep(0.3)

    return result


if __name__ == "__main__":
    # Quick test
    info = get_drug_fda_info("Kadcyla")
    for k, v in info.items():
        print(f"  {k}: {v}")
