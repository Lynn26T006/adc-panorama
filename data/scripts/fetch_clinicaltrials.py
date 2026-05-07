#!/usr/bin/env python3
"""
ClinicalTrials.gov API v2 fetcher for ADC pipeline data.
Public domain (US government data) — safe for commercial use.
"""

import requests
import time
import json
import os

BASE = "https://clinicaltrials.gov/api/v2"
HEADERS = {"Accept": "application/json"}

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_PATH = os.path.join(DATA_DIR, "../ctgov_cache.json")


def _load_cache():
    if os.path.exists(CACHE_PATH):
        with open(CACHE_PATH) as f:
            return json.load(f)
    return {}


def _save_cache(cache):
    with open(CACHE_PATH, "w") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def search_studies(query_term, max_pages=3):
    """Search ClinicalTrials.gov for studies matching a term. Returns list of study dicts."""
    studies = []
    next_token = None
    for page in range(max_pages):
        url = f"{BASE}/studies?query.term={query_term}&pageSize=50&format=json"
        if next_token:
            url += f"&pageToken={next_token}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            if resp.status_code != 200:
                break
            data = resp.json()
            studies.extend(data.get("studies", []))
            next_token = data.get("nextPageToken")
            if not next_token:
                break
        except Exception as e:
            print(f"    CT.gov search error: {e}")
            break
        time.sleep(0.8)
    return studies


def extract_trial_info(studies):
    """Extract relevant fields from CT.gov study list."""
    results = []
    for s in studies:
        protocol = s.get("protocolSection", {})
        ident = protocol.get("identificationModule", {})
        status = protocol.get("statusModule", {})
        design = protocol.get("designModule", {})
        sponsor = protocol.get("sponsorCollaboratorsModule", {})
        conditions = protocol.get("conditionsModule", {})
        arms = protocol.get("armsInterventionsModule", {})

        phases = design.get("phases", [])
        results.append({
            "nctId": ident.get("nctId"),
            "title": ident.get("briefTitle", ""),
            "status": status.get("overallStatus", ""),
            "phases": [p for p in phases if p != "NA"],
            "phase": phases[0] if phases else "Not Provided",
            "enrollment": design.get("enrollmentInfo", [{}])[0].get("count", 0) if design.get("enrollmentInfo") else 0,
            "conditions": conditions.get("conditions", []),
            "sponsor": sponsor.get("leadSponsor", {}).get("name", ""),
            "interventions": [
                arm.get("name", "") for arm in arms.get("interventions", [])
                if "ADC" in (arm.get("name", "") + arm.get("type", "")) or
                   "antibody" in arm.get("name", "").lower()
            ],
        })
    return results


def get_drug_trials(brand_name, antibody_name="", target=""):
    """Fetch CT.gov trials for an ADC drug. Returns enriched data dict."""
    cache = _load_cache()
    cache_key = brand_name or antibody_name
    if cache_key in cache:
        return cache[cache_key]

    queries = []
    if brand_name:
        queries.append(brand_name.replace(" ", "+"))
    if antibody_name:
        queries.append(antibody_name.replace(" ", "+"))
    if target:
        queries.append(f"{target}+ADC")

    all_trials = []
    for q in queries[:2]:  # max 2 queries to stay within rate limits
        trials = search_studies(q, max_pages=1)
        all_trials.extend(trials)
        time.sleep(0.5)

    result = {
        "trials": extract_trial_info(all_trials),
        "totalStudies": len(all_trials),
        "highestPhase": "Not Provided",
        "totalEnrollment": 0,
    }

    if result["trials"]:
        phases_seen = set()
        for t in result["trials"]:
            for p in t.get("phases", []):
                phases_seen.add(p)
            result["totalEnrollment"] += t.get("enrollment", 0)

        phase_rank = {"Phase 4": 5, "Phase 3": 4, "Phase 2": 3, "Phase 1": 2, "Early Phase 1": 1}
        result["highestPhase"] = max(phases_seen, key=lambda p: phase_rank.get(p, 0), default="Not Provided")

    cache[cache_key] = result
    _save_cache(cache)
    return result


if __name__ == "__main__":
    # Quick test
    info = get_drug_trials("Kadcyla", "trastuzumab emtansine", "HER2")
    print(f"Trials: {len(info['trials'])}, Phase: {info['highestPhase']}, Enrollment: {info['totalEnrollment']}")
