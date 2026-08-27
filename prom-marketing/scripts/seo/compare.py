# -*- coding: utf-8 -*-
"""Сравнение на promarketing.pw срещу българските конкуренти."""
import json, os, re, glob, html, urllib.request, gzip

ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP=os.path.join(ROOT,".next/server/app")
UA={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36",
    "Accept-Language":"bg-BG,bg;q=0.9","Accept-Encoding":"gzip"}

def txt(h):
    t=re.sub(r'<script.*?</script>|<style.*?</style>',' ',h,flags=re.S)
    return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',t))).strip()

def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=20) as r:
            b=r.read()
            if r.headers.get("Content-Encoding")=="gzip": b=gzip.decompress(b)
            return b.decode("utf-8","replace")
    except Exception: return None

def profile(name, home_html, urls):
    ld=len(re.findall(r'application/ld\+json', home_html or ""))
    types=set()
    for blk in re.findall(r'<script type="application/ld\+json">(.*?)</script>', home_html or "", re.S):
        try:
            g=json.loads(blk)
            for n in g.get("@graph",[g]):
                t=n.get("@type")
                types.add(t if isinstance(t,str) else "/".join(t))
        except Exception: pass
    return {
      "име": name,
      "страници": urls,
      "думи (начална)": len(txt(home_html or "").split()),
      "JSON-LD блока": ld,
      "видове": sorted(types)[:8],
      "FAQ маркиране": "FAQPage" in types,
      "локален бизнес": any("LocalBusiness" in t or "ProfessionalService" in t for t in types),
    }

# ── нашият сайт ────────────────────────────────────────────────────────
ours_home=open(os.path.join(APP,"index.html"),encoding="utf-8",errors="replace").read()
ours_pages=[f for f in glob.glob(os.path.join(APP,"**/*.html"),recursive=True)
            if "admin" not in f and "_" not in os.path.basename(f)]
src=open(os.path.join(ROOT,"lib/seo/site.ts"),encoding="utf-8").read()
src_g=open(os.path.join(ROOT,"lib/seo/guides.ts"),encoding="utf-8").read()
n_indexed=len(set(re.findall(r'path:\s*"([^"]+)"',src)))+len(re.findall(r'^    slug: "',src_g,re.M))+2
words_total=sum(len(txt(open(f,encoding="utf-8",errors="replace").read()).split()) for f in ours_pages)

rows=[profile("promarketing.pw (НИЕ)", ours_home, n_indexed)]

# ── конкурентите ──────────────────────────────────────────────────────
COMP=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"competitors.json")))
for host,rec in COMP.items():
    if rec.get("error"): continue
    h=get("https://"+host+"/")
    n=rec.get("sitemap_urls")
    n=n if isinstance(n,int) else "?"
    rows.append(profile(host, h, n))

# ── таблица ───────────────────────────────────────────────────────────
print(f"{'сайт':<28}{'стр.':>6}{'думи':>8}{'LD':>4}  FAQ  локален  видове")
print("─"*108)
for r in sorted(rows, key=lambda x: -(x["страници"] if isinstance(x["страници"],int) else 0)):
    star = " ◀" if "НИЕ" in r["име"] else ""
    print(f"{r['име'][:27]:<28}{str(r['страници']):>6}{r['думи (начална)']:>8}{r['JSON-LD блока']:>4}"
          f"  {'да ' if r['FAQ маркиране'] else 'не '} {'да    ' if r['локален бизнес'] else 'не    '}"
          f" {', '.join(r['видове'])[:44]}{star}")
print()
print("Общо думи в целия наш сайт:", f"{words_total:,}".replace(",", " "))
json.dump(rows, open("compare.json","w"), ensure_ascii=False, indent=1)
