import json

d = json.load(open("bsava_part_a_full.json"))
m = d["monographs"]
idx = d["index"]
cls = idx["therapeutic_class_index"]["entries"]
gen = idx["generic_and_trade_names_index"]["entries"]
print("monographs:", len(m), "| classes:", len(cls), "| generic/trade:", len(gen))
for c in cls:
    print(f"  {c['therapeutic_class']}: {len(c['subgroups'])} subgroups, "
          f"{sum(len(s['entries']) for s in c['subgroups'])} entries")
print("see-entries:", sum(1 for e in gen if "see" in e),
      "| no-pages:", [e["name"] for e in gen if not e["page_numbers"]][:8])
print("sample:", json.dumps(gen[:3], ensure_ascii=False))
print("special:", [e["name"] for e in gen if e["name"].startswith(("a-Casoz", "l-Thea"))])
app = d["appendix"]
print("appendix titles:")
for s in app:
    print("   ", repr(s["title"]), s["pdf_pages"], "tables:", len(s["tables"]))
tbl = [t for s in app for t in s["tables"]]
print("total tables:", len(tbl), "rows:", sum(len(t["rows"]) for t in tbl))
for t in tbl[:2]:
    print("  table page", t["pdf_page"], t["rows"][0], "| rows:", len(t["rows"]))
print("emergency sections:", [(s["section"], len(s["items"]))
                              for s in d["emergency_doses"]["sections"]])
print("front matter pages:", len(d["front_matter"]))
print("redirects sample:", json.dumps(d["redirects"][:3], ensure_ascii=False))
