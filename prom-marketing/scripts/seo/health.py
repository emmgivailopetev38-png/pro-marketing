#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Проверка на живия сайт — пази от тихи сривове.

    python3 scripts/seo/health.py

ЗАЩО СЪЩЕСТВУВА: на 27.08.2026 `/demo` върна 404 на живо, защото един
клон преименува `app/demo/page.tsx`, без да остави страница на маршрута.
Нищо не се счупи в билда, нищо не изгърмя — адресът просто изчезна и
щеше да си стои така, докато някой не го отвори ръчно.

Скриптът проверява всеки адрес, който трябва да съществува, плюс
каноничния адрес, sitemap-а и достъпа за AI роботите. Излиза с код 1 при
първия проблем, за да го хване планираната задача.
"""
import json
import re
import sys
import urllib.error
import urllib.request

SITE = "https://promarketing.pw"
UA = {"User-Agent": "ProMarketing-SEO-Health/1.0 (+https://promarketing.pw)"}

# Адресите, чието изчезване боли. Стълбовете и ръководствата се четат от
# картата на сайта — така новите влизат в проверката сами.
CORE = [
    "/", "/robots.txt", "/sitemap.xml", "/llms.txt", "/manifest.webmanifest",
    "/ai-avtomatizacia", "/ai-agenti", "/ai-chatbot", "/ai-crm",
    "/glasov-ai-agent", "/ai-avtomatizacia-plovdiv",
    "/rakovodstva", "/demo", "/booking", "/automation-audit",
    "/magazin", "/en", "/cookies", "/privacy", "/terms",
]

problems = []


def fetch(path, want_text=False):
    try:
        req = urllib.request.Request(SITE + path, headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read().decode("utf-8", "replace") if want_text else b""
            return r.status, body
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:  # мрежата, не сайтът
        return 0, str(e)


print("Проверка на", SITE)
print("─" * 70)

# ── 1. Картата на сайта е източникът за пълния списък ──────────────────
status, body = fetch("/sitemap.xml", want_text=True)
sitemap_paths = []
if status != 200:
    problems.append(f"sitemap.xml връща {status}")
else:
    sitemap_paths = [re.sub(r"^https?://[^/]+", "", u) or "/"
                     for u in re.findall(r"<loc>(.*?)</loc>", body)]
    print(f"  sitemap.xml — {len(sitemap_paths)} адреса")

to_check = list(dict.fromkeys(CORE + sitemap_paths))

# ── 2. Всеки адрес трябва да отговаря с 200 ───────────────────────────
bad = []
for p in to_check:
    st, _ = fetch(p)
    if st != 200:
        bad.append((p, st))
        problems.append(f"{p} връща {st}")
print(f"  адреси: {len(to_check) - len(bad)}/{len(to_check)} отговарят с 200")
for p, st in bad:
    print(f"     ✗ {p} → {st}")

# ── 3. Каноничният адрес сочи към себе си, не към началната ───────────
canon_bad = []
for p in ["/magazin", "/demo", "/kurs", "/booking", "/ai-avtomatizacia", "/rakovodstva"]:
    st, html = fetch(p, want_text=True)
    if st != 200:
        continue
    m = re.search(r'<link rel="canonical" href="([^"]+)"', html)
    want = SITE if p == "/" else SITE + p
    if not m:
        canon_bad.append((p, "липсва"))
    elif m.group(1).rstrip("/") != want.rstrip("/"):
        canon_bad.append((p, m.group(1)))
for p, got in canon_bad:
    problems.append(f"{p}: каноничният адрес е {got}")
print(f"  канонични адреси: {'наред' if not canon_bad else str(len(canon_bad)) + ' сгрешени'}")

# ── 4. robots.txt пуска ли AI роботите ────────────────────────────────
st, rob = fetch("/robots.txt", want_text=True)
if st == 200:
    missing = [b for b in ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"] if b not in rob]
    if missing:
        problems.append("robots.txt не споменава: " + ", ".join(missing))
    if "Sitemap:" not in rob:
        problems.append("robots.txt не сочи към sitemap")
    print(f"  robots.txt: {'наред' if not missing else 'липсват ' + ', '.join(missing)}")

# ── 5. www не бива да отдава съдържание ───────────────────────────────
try:
    req = urllib.request.Request("https://www.promarketing.pw/", headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        if r.status == 200 and "promarketing.pw" in r.geturl() and r.geturl().startswith("https://www."):
            problems.append("www отдава съдържание — трябва 301 към без www")
except Exception:
    pass  # 403 или отказана връзка е приемливо: www просто не съществува

print("─" * 70)
if problems:
    print(f"❌ {len(problems)} проблема:")
    for p in problems:
        print("   •", p)
else:
    print("✅ Живият сайт е наред.")

sys.exit(1 if problems else 0)
