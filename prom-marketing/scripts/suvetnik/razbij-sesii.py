# Разбива извлечените сесии с Георги (Fathom → MVP-izvlecheno-20.10/sesii/*.md):
#   златните реплики към клиент → data/suvetnik/repliki.json (търсенето в съветника),
#   останалите раздели → дайджест за ръчния синтез в lib/suvetnik/sesii.ts.
# Пуск: python3 -I scripts/suvetnik/razbij-sesii.py <папка sesii> data/suvetnik/repliki.json <дайджест.md>
# Партньорските сесии (без Георги) са в BEZ_GEORGI и не влизат.
import json, re, sys, pathlib
SES = pathlib.Path(sys.argv[1]); OUT_JSON = pathlib.Path(sys.argv[2]); OUT_DIG = pathlib.Path(sys.argv[3])
PRINCIP = re.compile(r"^(на ученика|принцип|правило|обяснение|към ученика|към ивайло|към участниците|на ивайло|коментар|урок|метафора|история)", re.I)
repliki, dig = [], []
BEZ_GEORGI = ("185294505","185244367","186636736","186771587","185855047","191005959")
for f in sorted(SES.glob("*.md")):
    if any(x in f.name for x in BEZ_GEORGI): continue
    t = f.read_text(encoding="utf-8")
    rid = re.search(r"(\d{9})\.md$", f.name)
    rid = rid.group(1) if rid else f.stem
    title = t.splitlines()[0].lstrip("# ").strip()
    secs = re.split(r"\n(?=## )", t)
    gold = next((s for s in secs if s.startswith("## Златни")), "")
    for n, blok in enumerate(re.split(r"\n(?=- \*\*\[)", gold)[1:], 1):
        m = re.match(r"- \*\*\[(.+?)\]\*\*", blok)
        if not m: continue
        teh = m.group(1).strip()
        def pole(ime):
            mm = re.search(rf"^\s*- {ime}(?:\s*\(([^)]*)\))?:\s*(.+?)(?=\n\s*- [А-ЯЁ]+(?:\s*\([^)]*\))?:|\Z)", blok, re.S | re.M)
            return (mm.group(1) or "", re.sub(r"\s+", " ", mm.group(2)).strip()) if mm else ("", "")
        q, kazhi = pole("КАЖИ")
        _, koga = pole("КОГА"); _, ton = pole("ТОН"); _, zashto = pole("ЗАЩО")
        if not kazhi: continue
        uchebno = re.search(r"(клиент|ученик|скрипт|ролев|програмата|видеото|\bвие\b|вижте|тествайте|идвайте|направете|запомнете|трябва да питаш|кажи му|кажи ѝ)", kazhi, re.I)
        vid = "princip" if ((q and PRINCIP.match(q.strip())) or re.match(r"(НАГЛАСА|ДРУГО|ИНТОНАЦИЯ)", teh) or uchebno) else "replika"
        kazhi_c = kazhi.strip().strip("„“\"")
        e = {"id": f"s{rid}-{n:02d}", "tehnika": teh, "koga": koga, "kazhi": kazhi_c, "ton": ton, "zashto": zashto,
             "iztochnik": title, "vid": vid}
        if "[реконструирано]" in kazhi: e["nesigurno"] = True
        repliki.append(e)
    rest = [s for s in secs if not s.startswith("## Златни") and not s.startswith("## Най-силните")]
    dig.append(f"\n\n######## {title}\n" + "\n".join(rest))
klient = [r for r in repliki if r["vid"] == "replika" and not r.get("nesigurno") and len(r["kazhi"]) <= 700]
OUT_JSON.write_text(json.dumps([{k: r[k] for k in ("id","tehnika","koga","kazhi","ton","zashto","iztochnik")} for r in klient], ensure_ascii=False, indent=0), encoding="utf-8")
OUT_DIG.write_text("".join(dig), encoding="utf-8")
pr = [r for r in repliki if r["vid"] == "princip"]
(OUT_DIG.parent / "principi.json").write_text(json.dumps(pr, ensure_ascii=False, indent=1), encoding="utf-8")
print("файлове", len(list(SES.glob('*.md'))), "реплики общо", len(repliki), "→ към клиент", len(klient), "принципи", len(pr), "несигурни", sum(1 for r in repliki if r.get('nesigurno')))
print("дайджест знака", sum(len(d) for d in dig))
