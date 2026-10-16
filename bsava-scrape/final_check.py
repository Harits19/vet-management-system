import json
import random
import re

raw = open("bsava_part_a_full.json", encoding="utf-8").read()
d = json.loads(raw)
m = d["monographs"]
print("json bytes:", len(raw), "| monographs:", len(m))
print("top-level keys:", list(d.keys()))
# page range sanity
prev_end = 0
issues = []
for x in m:
    s, e = x["pdf_pages"]
    if s < 15 or e > 456 or s > e:
        issues.append((x["name"], x["pdf_pages"]))
    if s < prev_end - 1:
        issues.append(("overlap", x["name"], x["pdf_pages"], prev_end))
    prev_end = e
print("page-range issues:", issues[:5])
# field completeness
req = ["name", "distribution_category", "formulations", "action", "uses",
       "contraindications", "adverse_reactions", "drug_interactions"]
incomplete = [x["name"] for x in m if any(k not in x or not x[k] for k in req)]
print("incomplete records:", len(incomplete), incomplete[:5])
# dose completeness
nodose = [x["name"] for x in m if "doses" not in x]
print("no doses (expected: pheromone products):", nodose)
sp = {}
for x in m:
    for g in x.get("doses", []):
        key = (g["species"] or "unspecified").split(",")[0].strip()
        sp[key] = sp.get(key, 0) + 1
print("dose groups per species label (top):",
      sorted(sp.items(), key=lambda kv: -kv[1])[:8])
# regimen sanity: does regimen contain a number+unit for most
no_unit = [(x["name"], r["regimen"][:60]) for x in m for g in x.get("doses", [])
           for r in g["regimens"] if not re.search(r"\d", r["regimen"])]
print("regimens without digits:", len(no_unit), no_unit[:4])
random.seed(7)
print("\n--- random monograph sample ---")
for x in random.sample(m, 2):
    print(json.dumps(x, ensure_ascii=False, indent=1)[:1200])
print("\n--- IV fluid table ---")
for s in d["appendix"]:
    if s["title"] and "intravenous fluids" in s["title"]:
        for t in s["tables"]:
            for row in t["rows"]:
                print("   ", row)
print("\n--- emergency doses sample ---")
print(json.dumps(d["emergency_doses"]["sections"][2], ensure_ascii=False)[:400])
