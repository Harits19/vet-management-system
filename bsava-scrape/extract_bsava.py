import json
import os
import re
from collections import Counter, OrderedDict

import pymupdf

PDF = os.environ.get(
    "BSAVA_PDF",
    "/Users/abdullah.harits/Documents/pribadi/project/vet-management-system/"
    "Fergus Allerton - BSAVA Small Animal Formulary, 10th edition - Part A_ "
    "Canine and Feline. Part A-British Small Animal Veterinary Association (2020).pdf",
)
OUTDIR = os.path.dirname(os.path.abspath(__file__))

LABEL_MAP = {
    "formulations": "formulations", "action": "action", "use": "uses",
    "uses": "uses", "safety and handling": "safety_and_handling",
    "contraindications": "contraindications", "adverse reactions": "adverse_reactions",
    "drug interactions": "drug_interactions", "toxicity": "toxicity", "notes": "notes",
}
CAT_RE = re.compile(
    r"^(?:POM-VPS|POM-V|NFA-VPS|AVM-GSL|GSL|CD|SCHEDULE\s*\d|POM|P|general sale"
    r"|[,;/\s])+$")
BULLET = "\x00BULLET\x00"
DECOR = ("ZapfDingbatsITC", "Symbol")


# --------------------------------------------------------------------------- #
def build_lines(doc, first_page, last_page):
    out = []
    for p in range(first_page - 1, last_page):
        raw = []
        for b in doc[p].get_text("dict")["blocks"]:
            if b["type"] != 0:
                continue
            for ln in b["lines"]:
                txt = "".join(s["text"] for s in ln["spans"]).strip()
                txt = txt.replace("\x07", "").replace("\u00a0", " ")
                if not txt:
                    continue
                sp = ln["spans"][0]
                raw.append({"page": p + 1, "font": sp["font"],
                            "size": round(sp["size"], 1), "text": txt,
                            "y": round(ln["bbox"][1], 1),
                            "x": round(ln["bbox"][0], 1)})
        keep = []
        for i, ln in enumerate(raw):
            t = ln["text"]
            if t.startswith("BSAVA Small Animal Formulary") and ln["size"] < 8:
                continue
            if any(d in ln["font"] for d in ("ZapfDingbatsITC",)):
                continue
            if ln["size"] == 11.0 and "900" in ln["font"]:
                if re.fullmatch(r"[A-Z]", t):
                    continue
                if re.fullmatch(r"\d{1,3}", t) and i < 6:
                    continue
            if ln["size"] == 8.4 and "900" in ln["font"] and t.isupper():
                continue          # sidebar navigation links
            keep.append(ln)
        out.extend(keep)
    return out


def is_name(ln):
    return ln["font"].startswith("MuseoSans-900") and ln["size"] >= 17


def is_nameish(ln):
    return ln["font"].startswith("MuseoSans-900")


def is_trade(ln):
    return ln["font"].startswith("MuseoSans-300") and ln["size"] == 13.0


def is_refs_heading(ln):
    return ln["font"] == "MuseoSans-700" and ln["text"] == "References"


def is_doses_heading(ln):
    return (ln["font"] == "MuseoSans-700" and ln["size"] in (10.5, 11.0)
            and ln["text"].rstrip(":").upper() == "DOSES")


def join_lines(lines):
    buf = ""
    for ln in lines:
        if ln == BULLET:
            buf += ("\n" if buf and not buf.endswith("\n") else "") + BULLET + " "
            continue
        if not buf:
            buf = ln
            continue
        if buf.endswith(BULLET + " ") or buf.endswith(("-", "/")):
            buf += ln
        else:
            buf += " " + ln
    return re.sub(r"[ \t]+", " ", buf).strip()


def split_bullets(text):
    if BULLET in text:
        return [p.strip() for p in text.split(BULLET) if p.strip()]
    return [text.strip()] if text.strip() else []


def split_alias(full):
    full = full.strip()
    if not full.endswith(")"):
        return full, None
    depth = 0
    for idx in range(len(full) - 1, -1, -1):
        ch = full[idx]
        if ch == ")":
            depth += 1
        elif ch == "(":
            depth -= 1
            if depth == 0:
                inner = full[idx + 1:-1]
                if "(" in inner or ")" in inner:
                    return full, None
                base = full[:idx].strip()
                return (base, inner.strip()) if base else (full, inner.strip())
    return full, None


def split_category(text):
    text = re.sub(r"\s+", " ", text).strip().strip(",")
    cds = [f"Schedule {n}" for n in re.findall(r"SCHEDULE\s*(\d)", text, re.I)]
    head = re.split(r"\bCD\b|\bSCHEDULE\b", text, flags=re.I)[0]
    cats = [t.strip() for t in re.split(r"[,;/]", head) if t.strip()]
    return cats, cds


# --------------------------------------------------------------------------- #
def parse_monograph(lines, start):
    i = start
    page_start = lines[i]["page"]
    name_lines = [lines[i]["text"]]
    i += 1
    while (i < len(lines) and is_nameish(lines[i])
           and " see " not in lines[i]["text"] and not CAT_RE.match(lines[i]["text"])):
        name_lines.append(lines[i]["text"])
        i += 1
    trade_lines = []
    while i < len(lines) and (is_trade(lines[i])
                              or (is_nameish(lines[i]) and CAT_RE.match(lines[i]["text"]))):
        trade_lines.append(lines[i]["text"])
        i += 1

    fields, order = OrderedDict(), []
    mode, cur = None, None
    doses_lines, refs_lines = [], []
    page_end = lines[max(i - 1, start)]["page"]

    while i < len(lines):
        ln = lines[i]
        if is_name(ln) or (is_nameish(ln) and " see " in ln["text"]):
            break
        if is_doses_heading(ln):
            mode, cur = "doses", None
            i += 1
            continue
        if is_refs_heading(ln):
            mode, cur = "refs", None
            i += 1
            continue
        if not mode and ln["font"] == "MuseoSans-700" and ln["size"] == 10.5:
            m = re.match(r"^([A-Za-z][A-Za-z /'\-]{2,30}):\s*(.*)$", ln["text"])
            if m and m.group(1).lower() in LABEL_MAP:
                key = LABEL_MAP[m.group(1).lower()]
                if key not in fields:
                    fields[key] = []
                    order.append(key)
                cur = key
                if m.group(2):
                    fields[key].append(m.group(2))
                page_end = ln["page"]
                i += 1
                continue
        if mode == "doses":
            doses_lines.append(ln)
        elif mode == "refs":
            refs_lines.append(ln)
        else:
            if cur is None:
                cur = "preamble"
                if cur not in fields:
                    fields[cur] = []
                    order.append(cur)
            fields[cur].append(BULLET if ln["text"] in ("•", "\u2022") else ln["text"])
        page_end = ln["page"]
        i += 1

    return {"name_lines": name_lines, "trade_lines": trade_lines, "fields": fields,
            "order": order, "doses_lines": doses_lines, "refs_lines": refs_lines,
            "page_start": page_start, "page_end": page_end}, i


def parse_doses(lines):
    groups, intro = [], []
    cur_species = cur_reg = None
    for ln in lines:
        txt = ln["text"].strip()
        if not txt or txt in ("•", "\u2022"):
            continue
        font = ln["font"]
        if font == "MuseoSans-700Italic":
            m = re.match(r"^([^:]{2,60}):\s*(.*)$", txt)
            cur_species = {"species": m.group(1).strip() if m else txt, "regimens": []}
            groups.append(cur_species)
            cur_reg = None
            if m and m.group(2).strip():
                cur_reg = {"indication": None, "regimen": m.group(2).strip()}
                cur_species["regimens"].append(cur_reg)
            continue
        if font.startswith("MuseoSans-500"):
            m = re.match(r"^([^:]{2,70}):\s*(.*)$", txt)
            if cur_species is None:
                cur_species = {"species": None, "regimens": []}
                groups.append(cur_species)
            cur_reg = {"indication": m.group(1).strip() if m else None,
                       "regimen": m.group(2).strip() if m else txt}
            cur_species["regimens"].append(cur_reg)
            continue
        if font.startswith("MuseoSans-700") and cur_species is None:
            intro.append(txt)
            continue
        if cur_reg is not None:
            cur_reg["regimen"] += ("" if cur_reg["regimen"].endswith(("-", "/")) else " ") + txt
        elif cur_species is not None:
            cur_reg = {"indication": None, "regimen": txt}
            cur_species["regimens"].append(cur_reg)
        elif groups:
            groups[-1]["regimens"].append({"indication": None, "regimen": txt})
        else:
            intro.append(txt)
    for g in groups:
        for r in g["regimens"]:
            r["regimen"] = re.sub(r"[ \t]+", " ", r["regimen"]).strip()
    return groups, join_lines(intro)


def finalise(raw):
    name, alias = split_alias(join_lines(raw["name_lines"]))
    trade_text = join_lines(raw["trade_lines"])
    m = re.match(r"^\((?P<t>.*)\)\s*(?P<c>.*)$", trade_text)
    if m:
        trade_names = [t.strip() for t in m.group("t").split(",") if t.strip()]
        cat_text = m.group("c")
    else:
        trade_names, cat_text = [], trade_text
    cats, cds = split_category(cat_text)

    rec = OrderedDict()
    rec["name"] = name
    if alias:
        rec["aliases"] = [alias]
    if trade_names:
        rec["trade_names"] = trade_names
    rec["distribution_category"] = cats
    if cds:
        rec["controlled_drug_schedule"] = cds
    for key in raw["order"]:
        if key == "preamble":
            continue
        text = join_lines(raw["fields"][key])
        if key == "uses":
            items = split_bullets(text)
            if items:
                rec["uses"] = items
        else:
            rec[key] = text
    if raw["doses_lines"]:
        groups, intro = parse_doses(raw["doses_lines"])
        if groups:
            rec["doses"] = groups
        if intro:
            rec["doses_guidance"] = intro
    if raw["refs_lines"]:
        rec["references_text"] = join_lines([l["text"] for l in raw["refs_lines"]])
    pre = raw["fields"].get("preamble")
    if pre:
        joined = join_lines(pre)
        if joined:
            rec["preamble"] = joined
    rec["pdf_pages"] = [raw["page_start"], raw["page_end"]]
    return rec


# --------------------------------------------------------------------------- #
def extract_emergency_doses(doc, toc):
    page = next(p for lvl, t, p in toc if t == "Emergency doses")
    sections, cur_sec, cur_item = [], None, None
    for ln in build_lines(doc, page, page):
        txt, font, size = ln["text"], ln["font"], ln["size"]
        if size == 12.0 and "900" in font:
            continue
        if font == "MuseoSans-700" and size == 10.0:
            continue
        if font == "MuseoSans-700" and size == 9.5:
            cur_sec = {"section": txt, "items": []}
            sections.append(cur_sec)
            cur_item = None
            continue
        if font == "MuseoSans-700" and size == 8.0:
            if cur_sec is None:
                cur_sec = {"section": None, "items": []}
                sections.append(cur_sec)
            cur_item = {"condition": txt, "text": ""}
            cur_sec["items"].append(cur_item)
            continue
        if cur_item is None:
            continue
        if cur_item["text"] and not cur_item["text"].endswith(("-", "/")):
            cur_item["text"] += " " + txt
        else:
            cur_item["text"] += txt
        cur_item["text"] = re.sub(r"[ \t]+", " ", cur_item["text"]).strip()
    return {"pdf_page": page, "sections": sections}


def extract_front_matter(doc, toc, skip_pages):
    start = next(p for lvl, t, p in toc if t == "Prelims")
    end = next(p for lvl, t, p in toc if t == "Aa") - 1
    out = []
    for p in range(start, end + 1):
        if p in skip_pages:
            continue
        lines = build_lines(doc, p, p)
        if lines:
            out.append({"pdf_page": p, "text": join_lines([l["text"] for l in lines])})
    return out


def extract_appendix(doc, toc):
    app_start = next(p for lvl, t, p in toc if t == "Appendix I: General information")
    app_end = next(p for lvl, t, p in toc if t == "Index") - 1
    sections, cur = [], {"title": None, "pdf_pages": [], "text": [], "tables": []}

    def flush():
        nonlocal cur
        if cur["title"] or cur["text"] or cur["tables"]:
            cur["text"] = join_lines(cur["text"])
            sections.append(cur)
        cur = {"title": None, "pdf_pages": [], "text": [], "tables": []}

    prev_title_line = False
    last_title_y = None
    for pno in range(app_start, app_end + 1):
        page = doc[pno - 1]
        items = []
        for t in page.find_tables(strategy="lines").tables:
            data = [[c.replace("\n", " ").strip() if c else "" for c in row]
                    for row in t.extract()]
            if len(data) >= 2 and len(data[0]) >= 2:
                items.append((round(t.bbox[1], 1), "table",
                              {"pdf_page": pno, "rows": data}))
        for ln in build_lines(doc, pno, pno):
            items.append((ln["y"], "line", ln))
        items.sort(key=lambda it: (it[0], it[1] == "table"))
        prev_title_line = False
        last_title_y = None
        for _, kind, obj in items:
            if kind == "table":
                cur["tables"].append(obj)
                if pno not in cur["pdf_pages"]:
                    cur["pdf_pages"].append(pno)
                continue
            ln = obj
            if ln["font"] == "MuseoSans-700" and ln["size"] >= 12.0:
                wrapped = (prev_title_line and cur["title"] and not cur["text"]
                           and not cur["tables"] and last_title_y is not None
                           and ln["y"] - last_title_y <= 15)
                if wrapped:
                    cur["title"] = cur["title"] + " " + ln["text"]
                else:
                    flush()
                    cur["title"] = ln["text"]
                last_title_y = ln["y"]
                if pno not in cur["pdf_pages"]:
                    cur["pdf_pages"].append(pno)
                prev_title_line = True
                continue
            prev_title_line = False
            if ln["font"] == "MuseoSans-700" and ln["size"] == 9.5:
                cur["text"].append(BULLET)
            cur["text"].append(ln["text"])
    flush()
    return [s for s in sections if not (s["title"] is None and not s["tables"])]


LEGEND_PREFIX = ("Generic names are in plain type", "Trade names are in italics",
                 "denote products not authorized", "for use in veterinary species",
                 "Client Information Leaflets", "available for BSAVA members",
                 "download from the BSAVA website", "(www.bsavalibrary.com)")


def _iter_index_lines(doc, first, last):
    for ln in build_lines(doc, first, last):
        if ln["size"] in (7.5, 7.4):
            continue
        if ln["size"] == 8.4 and "900" in ln["font"]:
            continue
        yield ln


def _entry(name, pages, font):
    e = OrderedDict()
    e["name"] = name.strip()
    m = re.match(r"^(.+?)\s+see\s+(.+)$", e["name"])
    if m:
        e["name"], e["see"] = m.group(1).strip(), m.group(2).strip()
    e["trade_name"] = "Italic" in font
    e["page_numbers"] = pages
    return e


def extract_index(doc, toc):
    class_start = next(p for lvl, t, p in toc if t == "sorted by therapeutic class")
    alpha_start = next(p for lvl, t, p in toc if t == "alphabetical by generic trade names")
    alpha_end = next(p for lvl, t, p in toc if t == "Membership Advert") - 1

    # Therapeutic class index: class headings sit at column tops, so a line is
    # attributed to the last heading whose y is <= the line's y; headings stay
    # in force across a page break until the next heading appears.
    classes, cur_class, cur_sub = [], None, None
    by_name = {}
    pending = ""
    headers = []          # (y, class-dict) on the current page
    cur_page = None
    for ln in _iter_index_lines(doc, class_start, alpha_start - 1):
        txt, font, size, y = ln["text"], ln["font"], ln["size"], ln["y"]
        if ln["page"] != cur_page:
            cur_page, headers = ln["page"], []
        if font == "MuseoSans-900" and size == 16.0:
            base = re.sub(r"\s+continued$", "", txt).strip()
            if base not in by_name:
                by_name[base] = {"therapeutic_class": base, "subgroups": []}
                classes.append(by_name[base])
            cur_class = by_name[base]
            cur_sub, pending = None, ""
            headers.append((y, cur_class))
            continue
        if font == "MuseoSans-700" and size in (9.0, 9.5):
            applicable = [h for h in headers if h[0] <= y]
            cur_class = applicable[-1][1] if applicable else cur_class
            if cur_sub is not None and txt[:1].islower():
                cur_sub["subgroup"] += " " + txt
            else:
                cur_sub = {"subgroup": txt, "entries": []}
                if cur_class is None:
                    cur_class = {"therapeutic_class": None, "subgroups": []}
                    classes.append(cur_class)
                cur_class["subgroups"].append(cur_sub)
            pending = ""
            continue
        if font.startswith("MuseoSans-300") and size == 8.0:
            if txt.startswith(LEGEND_PREFIX) or txt == ")":
                continue
            if re.fullmatch(r"[\d,\s\u2013\-]+", txt):
                if cur_sub and cur_sub["entries"]:
                    cur_sub["entries"][-1]["page_numbers"].extend(
                        [n for n in re.split(r",\s*", txt) if n.strip()])
                continue
            m = re.match(r"^(.+?)\s+([\d][\d,\s\u2013\-]*)$", txt)
            name = (pending + " " + (m.group(1) if m else txt)).strip()
            pending = ""
            if m and cur_sub is not None:
                cur_sub["entries"].append(
                    _entry(name, [n for n in re.split(r",\s*", m.group(2)) if n.strip()],
                           font))
            else:
                pending = name

    names, pending, started = [], "", False
    for ln in _iter_index_lines(doc, alpha_start, alpha_end):
        txt, font, size = ln["text"], ln["font"], ln["size"]
        if font == "MuseoSans-900":
            continue
        if not (font.startswith("MuseoSans-300") and size <= 9.5):
            continue
        if re.fullmatch(r"[\d,\s\u2013\-]+", txt):
            if names:
                names[-1]["page_numbers"].extend(
                    [n for n in re.split(r",\s*", txt) if n.strip()])
            continue
        m = re.match(r"^(.+?)\s+([\d][\d,\s\u2013\-]*)$", txt)
        if not started:
            # skip the legend paragraph printed above the first entry
            if not m:
                continue
            started = True
        if m:
            names.append(_entry((pending + " " + m.group(1)).strip(),
                                [n for n in re.split(r",\s*", m.group(2)) if n.strip()],
                                font))
            pending = ""
        elif txt.endswith(".") and len(pending + txt) > 40:
            pending = ""          # stray note/sentence, not an index entry
        else:
            pending = (pending + " " + txt).strip()
    if pending:
        names.append(_entry(pending, [], "MuseoSans-300"))

    return OrderedDict([
        ("pdf_pages", [class_start, alpha_end]),
        ("therapeutic_class_index", {
            "pdf_pages": [class_start, alpha_start - 1],
            "class_count": len(classes),
            "entries": classes}),
        ("generic_and_trade_names_index", {
            "pdf_pages": [alpha_start, alpha_end],
            "entry_count": len(names),
            "entries": names}),
    ])


# --------------------------------------------------------------------------- #
def main():
    doc = pymupdf.open(PDF)
    toc = doc.get_toc()
    letter_sections = OrderedDict(
        (t, p) for lvl, t, p in toc if lvl == 1 and re.fullmatch(r"[A-Z][a-z]", t))
    mono_start = next(p for lvl, t, p in toc if t == "Aa")
    mono_end = next(p for lvl, t, p in toc
                    if t == "Appendix I: General information") - 1

    lines = build_lines(doc, mono_start, mono_end)
    records, redirects = [], []
    i = 0
    while i < len(lines):
        ln = lines[i]
        if is_name(ln):
            raw, i = parse_monograph(lines, i)
            records.append(finalise(raw))
            continue
        if is_nameish(ln) and " see " in ln["text"]:
            m = re.match(r"^(.+?)\s+see\s+(.+)$", ln["text"])
            if m:
                redirects.append({"term": m.group(1).strip(),
                                  "target": m.group(2).strip(), "pdf_page": ln["page"]})
        i += 1

    emergency = extract_emergency_doses(doc, toc)
    front = extract_front_matter(doc, toc, skip_pages={emergency["pdf_page"]})
    appendix = extract_appendix(doc, toc)
    index = extract_index(doc, toc)

    counters = Counter()
    for rec in records:
        for k in rec:
            counters[k] += 1

    result = OrderedDict([
        ("metadata", OrderedDict([
            ("title", "BSAVA Small Animal Formulary, Part A: Canine and Feline"),
            ("edition", "10th edition (2020)"),
            ("editor", doc.metadata.get("author")),
            ("publisher", "British Small Animal Veterinary Association"),
            ("pdf_page_count", doc.page_count),
            ("source_file", os.path.basename(PDF)),
            ("sections", OrderedDict([
                ("emergency_doses", emergency["pdf_page"]),
                ("monographs", [mono_start, mono_end]),
                ("appendix_i_and_ii",
                 [next(p for lvl, t, p in toc
                       if t == "Appendix I: General information"),
                  next(p for lvl, t, p in toc if t == "Index") - 1]),
                ("index", index["pdf_pages"]),
            ])),
            ("letter_sections", letter_sections),
            ("monograph_count", len(records)),
            ("redirect_count", len(redirects)),
            ("controlled_drug_monographs",
             sum(1 for r in records if "controlled_drug_schedule" in r)),
            ("field_presence", OrderedDict(sorted(counters.items()))),
            ("extraction_note",
             "Structured factual extraction keyed to PDF page numbers: name, "
             "aliases, trade names, distribution category, formulations, action, "
             "uses, safety and handling, contraindications, adverse reactions, "
             "drug interactions, dose regimens (per species and indication), "
             "references. Field text is condensed to the field it belongs to; "
             "the printed book remains the authoritative source."),
        ])),
        ("emergency_doses", emergency),
        ("redirects", redirects),
        ("monographs", records),
        ("appendix", appendix),
        ("front_matter", front),
        ("index", index),
    ])
    out = os.path.join(OUTDIR, "bsava_part_a_full.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(result, fh, ensure_ascii=False, indent=1)

    # compact companion file: drug -> dose regimens + category, for app use
    compact = OrderedDict([
        ("metadata", OrderedDict([
            ("source", "BSAVA Small Animal Formulary, Part A, 10th ed. (2020)"),
            ("derived_from", "bsava_part_a_full.json"),
            ("note", "The printed BSAVA formulary remains the authoritative "
                     "source; doses are guidelines, not prescribing advice."),
        ])),
        ("drugs", [
            OrderedDict(
                [("name", r["name"]),
                 ("aliases", r.get("aliases", [])),
                 ("distribution_category", r["distribution_category"]),
                 ("controlled_drug_schedule", r.get("controlled_drug_schedule", [])),
                 ("doses", r.get("doses", [])),
                 ("pdf_pages", r["pdf_pages"])])
            for r in records
        ]),
    ])
    out2 = os.path.join(OUTDIR, "bsava_part_a_doses.json")
    with open(out2, "w", encoding="utf-8") as fh:
        json.dump(compact, fh, ensure_ascii=False, indent=1)
    print("wrote", out2)
    print("wrote", out)
    print("monographs:", len(records), "| redirects:", len(redirects),
          "| index entries:", index["generic_and_trade_names_index"]["entry_count"],
          "| class groups:", index["therapeutic_class_index"]["class_count"],
          "| appendix sections:", len(appendix))
    print("fields:", dict(counters))


if __name__ == "__main__":
    main()
