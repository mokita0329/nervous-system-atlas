#!/usr/bin/env python3
"""Display names of the structures, cranial nerves and pathways in a language that names them in its own words
(Japanese), as a table content/i18n/<lang>/names.json:

  { "<entry id>": { "name": "内包", "synonyms": ["internal capsule", "…"] }, … }

The content build lands the table on each entry as names.<lang> / synonymsByLang.<lang>; the app shows
names.<lang> with the English name underneath.  (The Turkish edition writes names.tr into the entry files
instead, because its display name is the Latin term; a table keeps a new language out of 400 upstream files.)

  python3 tools/i18n/names.py --lang ja draft     # Wikidata labels + <lang> Wikipedia titles -> reference/i18n-tasks/<lang>/names-draft.json
  python3 tools/i18n/names.py --lang ja check     # every entry has a name, no unknown ids, no empty names
  python3 tools/i18n/names.py --lang ja list      # one line per entry: id, English, Latin, current <lang> name

`draft` starts from content/i18n/review/terms-review.csv (the Wikidata item each entry was matched to by
tools/i18n/terms.py) and asks Wikidata for that item's <lang> label, aliases and Wikipedia sitelink.  The draft
lists every entry, with the candidates it found, so a translator fills in the rest and writes names.json.
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "content" / "data"
REVIEW = ROOT / "content" / "i18n" / "review" / "terms-review.csv"
KINDS = ["structures", "cranial-nerves", "pathways"]


def entries() -> list[dict]:
    out = []
    for kind in KINDS:
        for f in sorted((DATA / kind).glob("*.json")):
            d = json.loads(f.read_text(encoding="utf-8"))
            out.append({"kind": kind, "id": d["id"], "name": d.get("name", ""), "latin": d.get("latin", ""),
                        "synonyms": d.get("synonyms", [])})
    return out


def wikidata(ids: list[str], lang: str) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for i in range(0, len(ids), 50):
        batch = ids[i:i + 50]
        url = ("https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels|aliases|sitelinks"
               f"&languages={lang}&sitefilter={lang}wiki&ids=" + "|".join(batch))
        req = urllib.request.Request(url, headers={"User-Agent": "nervous-system-atlas names.py (github.com/aycibatuhan/nervous-system-atlas)"})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.load(r)
        for qid, e in data.get("entities", {}).items():
            it: dict = {}
            if lang in e.get("labels", {}):
                it["label"] = e["labels"][lang]["value"]
            al = [a["value"] for a in e.get("aliases", {}).get(lang, [])]
            if al:
                it["aliases"] = al
            wiki = f"{lang}wiki"
            if wiki in e.get("sitelinks", {}):
                it["wiki"] = e["sitelinks"][wiki]["title"]
            out[qid] = it
        print(f"wikidata: {min(i + 50, len(ids))}/{len(ids)}", file=sys.stderr)
    return out


def cmd_draft(a) -> None:
    rows = {r["id"]: r for r in csv.DictReader(REVIEW.open(encoding="utf-8"))} if REVIEW.exists() else {}
    ents = entries()
    qids = sorted({rows[e["id"]]["wd"] for e in ents if e["id"] in rows and rows[e["id"]].get("wd")})
    wd = wikidata(qids, a.lang)
    table = ROOT / "content" / "i18n" / a.lang / "names.json"
    have = json.loads(table.read_text(encoding="utf-8")) if table.exists() else {}
    draft = []
    found = 0
    for e in ents:
        qid = rows.get(e["id"], {}).get("wd", "")
        it = wd.get(qid, {}) if qid else {}
        cand = [x for x in [it.get("label"), it.get("wiki")] if x] + it.get("aliases", [])
        seen: list[str] = []
        for c in cand:
            if c not in seen:
                seen.append(c)
        if seen:
            found += 1
        draft.append({"id": e["id"], "kind": e["kind"], "english": e["name"], "latin": e["latin"], "synonyms_en": e["synonyms"],
                      "wikidata": qid, "candidates": seen, "current": have.get(e["id"], {}).get("name", "")})
    out = ROOT / "reference" / "i18n-tasks" / a.lang / "names-draft.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"lang": a.lang, "instructions":
                               f"Write content/i18n/{a.lang}/names.json as {{id: {{name, synonyms}}}} for every entry below: "
                               f"name = the {a.lang} anatomical term (candidates come from Wikidata and {a.lang} Wikipedia and may be "
                               f"wrong or too broad — check against the English and Latin), synonyms = other {a.lang} spellings worth "
                               f"searching for. Every id must get a name.", "entries": draft},
                              ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(draft)} entries, {found} with Wikidata candidates -> {out.relative_to(ROOT)}")


def cmd_check(a) -> None:
    table = ROOT / "content" / "i18n" / a.lang / "names.json"
    if not table.exists():
        print(f"no {table.relative_to(ROOT)}")
        sys.exit(1)
    names = json.loads(table.read_text(encoding="utf-8"))
    ids = {e["id"] for e in entries()}
    errors = 0
    for i in sorted(set(names) - ids):
        print(f"ERROR unknown id {i}")
        errors += 1
    for i in sorted(ids - set(names)):
        print(f"MISSING {i}")
        errors += 1
    for i, row in names.items():
        if not isinstance(row, dict) or not str(row.get("name", "")).strip():
            print(f"ERROR {i}: empty name")
            errors += 1
        elif not isinstance(row.get("synonyms", []), list):
            print(f"ERROR {i}: synonyms must be a list")
            errors += 1
    print(f"check: {len(names)} names, {len(ids)} entries, {errors} problems")
    if errors:
        sys.exit(1)


def cmd_list(a) -> None:
    table = ROOT / "content" / "i18n" / a.lang / "names.json"
    names = json.loads(table.read_text(encoding="utf-8")) if table.exists() else {}
    for e in entries():
        print(f"{e['kind']:15s} {e['id']:40s} {e['name']:45s} {e['latin']:40s} {names.get(e['id'], {}).get('name', '')}")


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--lang", default="ja")
    sub = ap.add_subparsers(dest="cmd")
    sub.add_parser("draft")
    sub.add_parser("check")
    sub.add_parser("list")
    a = ap.parse_args(argv)
    {"draft": cmd_draft, "check": cmd_check, "list": cmd_list}.get(a.cmd, lambda _: ap.print_help())(a)


if __name__ == "__main__":
    main()
