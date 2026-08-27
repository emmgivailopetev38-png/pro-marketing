#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Разчистване, не трупане.

    npm run build && python3 scripts/seo/decay.py

Повечето сайтове умират не от липса на съдържание, а от натрупано
съдържание, за което никой не се грижи. Google има отделна система за
това: сайт с голям дял безполезни страници се сваля ЦЯЛ, не само
слабите страници. Тоест десет забравени текста могат да свалят десетте
добри.

Скриптът търси четирите начина, по които сайтът гние:

1. **Канибализация** — две страници се бият за една и съща заявка. И
   двете губят, защото Google не знае коя да покаже, и разделя сигналите.
2. **Остаряване** — текст с година в заглавието или с числа, който не е
   пипан отдавна. „Цени 2026", четено през 2027, вреди повече от нищо.
3. **Тънки страници** — под 300 думи. Всяка такава сваля средното
   качество на домейна.
4. **Сираци и задънени улици** — страници без входящи връзки и страници,
   които не водят наникъде.

Скриптът НЕ трие нищо. Само показва и предлага; решението е човешко,
защото „слаба страница" и „страница, която още не е получила шанс" си
приличат отвън.
"""
import collections
import glob
import html
import json
import os
import re
import sys
from datetime import date, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP = os.path.join(ROOT, ".next/server/app")

TODAY = date.today()
findings = []


def note(sev, topic, msg, fix=""):
    findings.append((sev, topic, msg, fix))


def text_of(h):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", " ", h, flags=re.S)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t))).strip()


# Страници, които пренасочват, не са страници — но Next пак им прави HTML.
REDIRECTS = set()
for f in glob.glob(os.path.join(ROOT, "app/**/page.tsx"), recursive=True):
    src = open(f, encoding="utf-8", errors="replace").read()
    if re.search(r'redirect\("/"\)', src):
        rel = os.path.relpath(f, os.path.join(ROOT, "app"))[:-len("/page.tsx")]
        rel = re.sub(r"\([^)]*\)/?", "", rel).strip("/")
        REDIRECTS.add("/" + rel if rel else "/")

# Правните страници се пишат по закон, не за търсене — извън сравнението.
LEGAL = {"/privacy", "/terms", "/cookies", "/usloviya-kursove"}

# ── събираме страниците от билда ──────────────────────────────────────
pages = {}
for f in glob.glob(os.path.join(APP, "**/*.html"), recursive=True):
    rel = os.path.relpath(f, APP)[:-5]
    if rel.startswith("_") or rel.startswith("admin") or "[" in rel:
        continue
    h = open(f, encoding="utf-8", errors="replace").read()
    if re.search(r'<meta name="robots" content="[^"]*noindex', h):
        continue
    route = "/" if rel == "index" else "/" + rel
    if route in REDIRECTS:
        continue
    pages[route] = h

print(f"Проверени индексируеми страници: {len(pages)}\n")

# ── 1. Канибализация ──────────────────────────────────────────────────
# Мери се по припокриване на думите в <title> и в H1 — това са двата
# сигнала, по които Google решава за какво е страницата.
STOP = {"и", "на", "за", "с", "в", "от", "който", "която", "което", "как",
        "да", "е", "по", "не", "или", "ли", "си", "то", "те", "ти", "ги",
        "промаркетинг", "promarketing", "—", "·", "|", "-"}


def keyify(s):
    words = re.findall(r"[a-zA-Zа-яА-Я0-9]+", s.lower())
    return {w for w in words if w not in STOP and len(w) > 2}


sig = {}
for r, h in pages.items():
    t = re.search(r"<title>(.*?)</title>", h, re.S)
    h1 = re.findall(r"<h1[^>]*>(.*?)</h1>", h, re.S)
    title = html.unescape(t.group(1)) if t else ""
    head = " ".join(html.unescape(re.sub(r"<[^>]+>", " ", x)) for x in h1)
    sig[r] = keyify(title + " " + head)

routes = sorted(r for r in pages if r not in LEGAL)
for i, a in enumerate(routes):
    for b in routes[i + 1:]:
        ka, kb = sig[a], sig[b]
        # Под четири значещи думи сравнението лъже: две страници с по три
        # думи в заглавието се припокриват „на 100%" от една обща дума.
        if len(ka) < 4 or len(kb) < 4:
            continue
        overlap = len(ka & kb) / max(1, min(len(ka), len(kb)))
        if overlap >= 0.7:
            note("високо", "канибализация",
                 f"{a} и {b} се припокриват на {int(overlap * 100)}% "
                 f"({', '.join(sorted(ka & kb))})",
                 "слей ги в една или разграничи заглавието и H1 на едната")

# ── 2. Остаряване ─────────────────────────────────────────────────────
guides_src = os.path.join(ROOT, "lib/seo/guides.ts")
if os.path.exists(guides_src):
    src = open(guides_src, encoding="utf-8").read()
    blocks = re.findall(
        r'slug: "([^"]+)"[\s\S]*?metaTitle: "([^"]*)"[\s\S]*?updated: "(\d{4}-\d{2}-\d{2})"',
        src)
    for slug, mtitle, updated in blocks:
        try:
            u = datetime.strptime(updated, "%Y-%m-%d").date()
        except ValueError:
            continue
        age = (TODAY - u).days
        years = re.findall(r"(20\d{2})", mtitle)
        if years and int(years[-1]) < TODAY.year:
            note("КРИТИЧНО", "остаряло",
                 f"/rakovodstva/{slug}: заглавието обещава {years[-1]}, а сме {TODAY.year}",
                 "обнови числата и годината, или махни годината от заглавието")
        elif age > 270:
            note("средно", "остаряло",
                 f"/rakovodstva/{slug}: не е пипано от {age} дни",
                 "прегледай числата; вдигни `updated` само ако промяната е съществена")

# ── 3. Тънки страници ─────────────────────────────────────────────────
for r, h in pages.items():
    w = len(text_of(h).split())
    if w < 300:
        note("високо", "тънко", f"{r}: {w} думи",
             "или се дописва до нещо полезно, или се обединява с друга, или излиза от индекса")

# ── 4. Сираци и задънени улици ────────────────────────────────────────
inbound = collections.Counter()
outbound = {}
for r, h in pages.items():
    links = {href.rstrip("/") or "/" for href in re.findall(r'href="(/[^"#?]*)"', h)}
    outbound[r] = {l for l in links if l in pages and l != r}
    for l in outbound[r]:
        inbound[l] += 1

for r in pages:
    if r == "/" or r in LEGAL:
        continue
    if inbound[r] == 0:
        note("високо", "сирак", f"{r}: нула вътрешни връзки към нея",
             "линкни я от свързана страница — иначе авторитетът не стига дотам")
    elif inbound[r] == 1:
        note("ниско", "слаба връзка", f"{r}: само една входяща връзка", "")
    if not outbound[r]:
        note("средно", "задънена улица", f"{r}: не води към нито една друга страница",
             "добави две-три връзки към свързаното съдържание")

# ── 5. Опашката с теми — има ли какво да се пише ─────────────────────
backlog_src = os.path.join(ROOT, "lib/seo/keyword-backlog.ts")
if os.path.exists(backlog_src):
    src = open(backlog_src, encoding="utf-8").read()
    slugs = re.findall(r'slug: "([^"]+)"', src)
    existing = {re.sub(r"^/rakovodstva/", "", r) for r in pages if r.startswith("/rakovodstva/")}
    left = [s for s in slugs if s not in existing]
    if len(left) <= 2:
        note("средно", "опашка", f"остават само {len(left)} ненаписани теми",
             "напълни `lib/seo/keyword-backlog.ts`, преди да свърши")
    print(f"Опашка с теми: {len(left)} ненаписани от {len(slugs)}\n")

# ── Резултат ──────────────────────────────────────────────────────────
order = {"КРИТИЧНО": 0, "високо": 1, "средно": 2, "ниско": 3}
findings.sort(key=lambda x: (order.get(x[0], 9), x[1]))
cnt = collections.Counter(s for s, _, _, _ in findings)

print("═" * 78)
print("РАЗЧИСТВАНЕ:", " · ".join(f"{k}: {cnt.get(k, 0)}" for k in order) or "чисто")
print("═" * 78)

last = None
for sev, topic, msg, fix in findings:
    if (sev, topic) != last:
        print(f"\n[{sev}] {topic}")
        last = (sev, topic)
    print("   •", msg)
    if fix:
        print("     →", fix)

if not findings:
    print("\n✅ Няма какво да се разчиства.")

sys.exit(1 if (cnt.get("КРИТИЧНО") or cnt.get("високо")) else 0)
