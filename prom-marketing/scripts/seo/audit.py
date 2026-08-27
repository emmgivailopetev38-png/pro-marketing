#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Пълен SEO одит на promarketing.pw.

Пуска се СЛЕД `npm run build` — чете реалния HTML, който Vercel ще
отдаде, плюс изворите на sitemap и robots. Не иска пуснат сървър, за да
може да се върти и от планирана задача.

    npm run build && python3 scripts/seo/audit.py

Излиза с код 1, ако има КРИТИЧНО или високо — така задачата вижда, че
нещо се е счупило, без да чете изхода.

Какво проверява: заглавия и описания (дължина и повторения), каноничен
адрес на всяка страница, брой H1, обем текст, sitemap срещу реалните
страници, robots.txt и достъпа за AI роботите, счупени и липсващи
вътрешни връзки, структурираните данни и alt текстовете.
"""
import json, os, re, sys, html, glob, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP  = os.path.join(ROOT, ".next/server/app")
SITE = "https://promarketing.pw"

problems = []   # (тежест, тема, съобщение)
def bad(sev, topic, msg): problems.append((sev, topic, msg))

def text_of(h):
    t = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', h, flags=re.S)
    t = re.sub(r'<[^>]+>', ' ', t)
    return re.sub(r'\s+', ' ', html.unescape(t)).strip()

REDIRECTS = set()
for f in glob.glob(os.path.join(ROOT, "app/**/page.tsx"), recursive=True):
    src = open(f, encoding="utf-8", errors="replace").read()
    if re.search(r'redirect\("/"\)', src):
        rel = os.path.relpath(f, os.path.join(ROOT, "app"))[:-len("/page.tsx")]
        rel = re.sub(r"\([^)]*\)/?", "", rel).strip("/")
        REDIRECTS.add("/" + rel if rel else "/")

pages = {}
for f in glob.glob(os.path.join(APP, "**/*.html"), recursive=True):
    rel = os.path.relpath(f, APP)[:-5]
    if rel.startswith("_") or rel.startswith("admin") or "[" in rel: continue
    route = "/" if rel == "index" else "/" + rel
    if route in REDIRECTS: continue          # 307 към „/" — не е страница
    pages[route] = open(f, encoding="utf-8", errors="replace").read()

print("Проверени страници:", len(pages))
print()

# ── 1. Заглавия, описания, канонични адреси ───────────────────────────
titles, descs, canons = {}, {}, {}
rows = []
for r, h in sorted(pages.items()):
    t  = re.search(r'<title>(.*?)</title>', h, re.S)
    d  = re.search(r'<meta name="description" content="([^"]*)"', h)
    c  = re.search(r'<link rel="canonical" href="([^"]+)"', h)
    ri = re.search(r'<meta name="robots" content="([^"]*)"', h)
    h1 = re.findall(r'<h1[^>]*>(.*?)</h1>', h, re.S)
    t  = html.unescape(t.group(1)).strip() if t else None
    d  = html.unescape(d.group(1)).strip() if d else None
    c  = c.group(1) if c else None
    noidx = bool(ri and "noindex" in ri.group(1))
    words = len(text_of(h).split())
    ld = re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S)
    types = []
    for b in ld:
        try:
            g = json.loads(b)
            for n in g.get("@graph", [g]):
                ty = n.get("@type"); types.append(ty if isinstance(ty,str) else "/".join(ty))
        except Exception as e:
            bad("КРИТИЧНО","структурирани данни", f"{r}: невалиден JSON-LD ({e})")
    rows.append((r, t, d, c, noidx, len(h1), words, types))

    if not noidx:
        if not t: bad("КРИТИЧНО","заглавие", f"{r}: няма <title>")
        else:
            titles.setdefault(t, []).append(r)
            if len(t) > 65: bad("средно","заглавие", f"{r}: заглавието е {len(t)} знака (реже се към 60)")
        if not d: bad("високо","описание", f"{r}: няма meta description")
        else:
            descs.setdefault(d, []).append(r)
            if len(d) > 165: bad("ниско","описание", f"{r}: описанието е {len(d)} знака")
        if not c: bad("КРИТИЧНО","каноничен", f"{r}: няма canonical")
        else:
            canons.setdefault(c, []).append(r)
            exp = SITE if r == "/" else SITE + r
            if c.rstrip("/") != exp.rstrip("/"):
                bad("КРИТИЧНО","каноничен", f"{r}: canonical сочи към {c}")
        if len(h1) == 0: bad("високо","H1", f"{r}: няма H1")
        if len(h1) > 1:  bad("високо","H1", f"{r}: {len(h1)} броя H1 на една страница")
        if words < 250:  bad("средно","съдържание", f"{r}: само {words} думи текст")

for t, rs in titles.items():
    if len(rs) > 1: bad("високо","заглавие", f"еднакво заглавие на {len(rs)} страници: {', '.join(rs)}")
for d, rs in descs.items():
    if len(rs) > 1: bad("средно","описание", f"еднакво описание на {len(rs)} страници: {', '.join(rs)}")
for c, rs in canons.items():
    if len(rs) > 1: bad("КРИТИЧНО","каноничен", f"един canonical за {len(rs)} страници: {', '.join(rs)}")

# ── 2. Карта на сайта срещу реалните страници ─────────────────────────
# Картата и robots.txt се четат от ИЗВОРА, не по HTTP — така одитът
# работи и без пуснат сървър, а това е условие да го върти и cron.
src_site   = open(os.path.join(ROOT, "lib/seo/site.ts"),   encoding="utf-8").read()
src_guides = open(os.path.join(ROOT, "lib/seo/guides.ts"), encoding="utf-8").read()
src_robots = open(os.path.join(ROOT, "app/robots.ts"),     encoding="utf-8").read()
src_smap   = open(os.path.join(ROOT, "app/sitemap.ts"),    encoding="utf-8").read()

sitemap_paths = {"/"}
sitemap_paths |= set(re.findall(r'path:\s*"([^"]+)"', src_site))
sitemap_paths |= {f"/rakovodstva/{sl}" for sl in re.findall(r'^    slug: "([^"]+)"', src_guides, re.M)}
if "/rakovodstva" in src_smap: sitemap_paths.add("/rakovodstva")
if not sitemap_paths: bad("КРИТИЧНО","sitemap","картата на сайта е празна")

indexable = {r for r,t,d,c,n,h1,w,ty in rows if not n}
for pth in sorted(sitemap_paths - indexable):
    if pth not in pages: bad("високо","sitemap", f"{pth} е в картата, но не е генерирана страница")
    else: bad("КРИТИЧНО","sitemap", f"{pth} е в картата, но е noindex")
for pth in sorted(indexable - sitemap_paths):
    bad("средно","sitemap", f"{pth} се индексира, но липсва в картата")

# ── 3. robots.txt ─────────────────────────────────────────────────────
rtxt = src_robots
if "sitemap:" not in rtxt and "Sitemap" not in rtxt:
    bad("високо","robots","robots.txt не сочи към sitemap")
for bot in ["GPTBot","ClaudeBot","PerplexityBot","Google-Extended"]:
    if bot not in rtxt: bad("средно","robots", f"robots.txt не допуска {bot}")

# ── 4. Вътрешни връзки: счупени и сираци ──────────────────────────────
links = collections.Counter()
targets = collections.defaultdict(set)
for r, h in pages.items():
    for href in set(re.findall(r'href="(/[^"#?]*)"', h)):
        p = href.rstrip("/") or "/"
        links[p] += 1
        targets[p].add(r)
known = set(pages) | {"/velko"}
dynamic_ok = re.compile(r'^/(razgovorat|oferta|prezentacia|api|admin)(/|$)')
for p, n in sorted(links.items()):
    if p in known or dynamic_ok.match(p): continue
    if p.startswith("/_next") or p.startswith("/videa") or p.startswith("/images"): continue
    if p in ("/manifest.webmanifest","/sitemap.xml","/robots.txt","/llms.txt"): continue
    if p in REDIRECTS: continue
    if os.path.exists(os.path.join(ROOT, "public", p.lstrip("/"))): continue
    bad("високо","връзки", f"счупена вътрешна връзка към {p} (от {len(targets[p])} страници)")

for r in sorted(indexable):
    if r == "/": continue
    inbound = sum(1 for src, hh in pages.items() if src != r and f'href="{r}"' in hh)
    if inbound == 0: bad("средно","връзки", f"{r} няма нито една вътрешна връзка към себе си")

# ── 5. Структурирани данни ────────────────────────────────────────────
for r,t,d,c,n,h1,w,ty in rows:
    if n: continue
    if not ty: bad("високо","структурирани данни", f"{r}: няма JSON-LD")
    else:
        if not any(x.startswith("Organization") for x in ty):
            bad("средно","структурирани данни", f"{r}: липсва Organization")
        if "WebPage" not in ty:
            bad("ниско","структурирани данни", f"{r}: липсва WebPage")
    dup = [k for k,v in collections.Counter(ty).items() if v > 1 and k in ("Organization/ProfessionalService","WebSite","Person")]
    if dup: bad("средно","структурирани данни", f"{r}: дублирани възли {dup}")

# ── 6. Изображения без alt ────────────────────────────────────────────
for r, h in pages.items():
    for tag in re.findall(r'<img\b[^>]*>', h):
        if 'alt=' not in tag: bad("средно","картинки", f"{r}: <img> без alt")

# ── Резултат ──────────────────────────────────────────────────────────
order = {"КРИТИЧНО":0,"високо":1,"средно":2,"ниско":3}
problems.sort(key=lambda x: (order.get(x[0],9), x[1]))
cnt = collections.Counter(s for s,_,_ in problems)
print("═"*78)
print("РЕЗУЛТАТ:", " · ".join(f"{k}: {cnt.get(k,0)}" for k in ["КРИТИЧНО","високо","средно","ниско"]) or "чисто")
print("═"*78)
last = None
for sev, topic, msg in problems:
    if (sev,topic) != last: print(f"\n[{sev}] {topic}"); last=(sev,topic)
    print("   •", msg)
if not problems: print("\n✅ Нито един проблем.")
print()
print("Индексируеми страници:", len(indexable), "| в картата:", len(sitemap_paths))

sys.exit(1 if (cnt.get("КРИТИЧНО") or cnt.get("високо")) else 0)
