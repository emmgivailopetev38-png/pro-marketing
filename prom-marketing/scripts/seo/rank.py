#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Проследяване на позициите по целевите заявки.

    python3 scripts/seo/rank.py

ЗАЩО НЕ Е ПРЕЗ GOOGLE: Google връща CAPTCHA на автоматични заявки, а
решаването ѝ е извън правилата. DuckDuckGo ползва индекса на Bing и е
достатъчен за посоката — важното е дали се движим, не абсолютната
позиция. Точните числа за Google идват от Search Console, щом бъде
свързан.

Историята се пази в `scripts/seo/rank-history.json` — един запис на
пускане, за да се вижда движението, а не само днешното състояние.

⚠️ Резултатът е ориентир, не измерване. При нула резултати за заявка
причината обикновено е ограничение на честотата, не липса на класиране.
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
HISTORY = os.path.join(HERE, "rank-history.json")
OUR_HOSTS = ("promarketing.pw",)

UA = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
    "Accept-Language": "bg-BG,bg;q=0.9",
}

# Заявките, по които искаме да излизаме. Първите шест са стълбовете;
# останалите идват от ръководствата.
QUERIES = [
    "AI автоматизация",
    "бизнес автоматизация",
    "автоматизация на бизнес процеси",
    "AI агенти за бизнес",
    "AI чатбот за сайт на български",
    "CRM система България",
    "гласов AI агент",
    "AI автоматизация Пловдив",
    "колко струва AI автоматизация",
    "AI за счетоводна кантора",
    "AI агенция България",
    "AI за хотел",
    "AI маркетинг",
    "AI видео реклама",
]


def ddg(query, tries=3):
    """Връща списък от домейни в реда на класирането, или None."""
    for attempt in range(tries):
        data = urllib.parse.urlencode({"q": query, "kl": "bg-bg"}).encode()
        req = urllib.request.Request("https://html.duckduckgo.com/html/", data=data, headers=UA)
        try:
            with urllib.request.urlopen(req, timeout=25) as r:
                html = r.read().decode("utf-8", "replace")
        except Exception:
            html = ""
        hits = re.findall(r'class="result__a"[^>]*href="([^"]+)"', html)
        if hits:
            out = []
            for u in hits:
                if "uddg=" in u:
                    m = re.search(r"uddg=([^&]+)", u)
                    if m:
                        u = urllib.parse.unquote(m.group(1))
                out.append(urllib.parse.urlparse(u).netloc.replace("www.", ""))
            return out
        time.sleep(20 + attempt * 15)
    return None


def position(domains):
    for i, d in enumerate(domains, 1):
        if any(h in d for h in OUR_HOSTS):
            return i
    return None


history = []
if os.path.exists(HISTORY):
    try:
        history = json.load(open(HISTORY, encoding="utf-8"))
    except Exception:
        history = []

prev = history[-1]["results"] if history else {}
run = {}

print(f"{'заявка':<38}{'позиция':>9}{'преди':>8}   топ 3")
print("─" * 96)

for q in QUERIES:
    doms = ddg(q)
    if doms is None:
        run[q] = None
        print(f"{q[:37]:<38}{'—':>9}{'':>8}   (без отговор)")
        time.sleep(8)
        continue
    pos = position(doms)
    run[q] = pos
    before = prev.get(q)
    arrow = ""
    if isinstance(pos, int) and isinstance(before, int):
        arrow = " ↑" if pos < before else (" ↓" if pos > before else " =")
    elif isinstance(pos, int) and before is None and q in prev:
        arrow = " ★нов"
    print(f"{q[:37]:<38}{(str(pos) if pos else 'няма'):>9}"
          f"{(str(before) if before else '—'):>8}{arrow:<4} {', '.join(doms[:3])[:44]}")
    time.sleep(10)

history.append({"at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "results": run})
history = history[-60:]          # два месеца при дневно пускане
json.dump(history, open(HISTORY, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

ranked = [q for q, p in run.items() if p]
print("─" * 96)
print(f"Класираме се по {len(ranked)} от {len(QUERIES)} заявки. Записът е {len(history)}-ти в историята.")
if ranked:
    print("Най-добра позиция:", min(run[q] for q in ranked), "—",
          min(ranked, key=lambda q: run[q]))

sys.exit(0)
