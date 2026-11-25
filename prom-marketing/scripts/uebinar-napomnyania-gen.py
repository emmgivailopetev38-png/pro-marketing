# -*- coding: utf-8 -*-
# Генерира lib/uebinar/napomnyania-tekstove.ts от 17-НАПОМНЯНИЯ-….md (един източник на истината).
import io, re, json, sys
md=io.open(sys.argv[1],encoding='utf-8').read()
out=[]
for m in re.finditer(r'^### №(\d+) · ([^\n]*)\n\*\*Тема:\*\* ([^\n]*)\n\n(.*?)(?=^### |^---|\Z)', md, re.S|re.M):
    n=int(m.group(1)); subj=m.group(3).strip(); body=m.group(4).strip()
    body=re.sub(r'\s*⚠️\s*', ' ', body)              # знаците за проверка не влизат в писмото
    body=re.sub(r'[ \t]+\n', '\n', body).strip()
    out.append({'n':n,'tema':subj,'tekst':body})
assert [o['n'] for o in out]==list(range(12)), [o['n'] for o in out]
sms={}
for k in ['S1','S2','S3','S4']:
    mm=re.search(r'\*\*'+k+r' ·[^\n]*\*\*\n([^\n]+)', md); sms[k]=mm.group(1).strip()
ts=['/* Генерирано от „17-НАПОМНЯНИЯ-имейли-SMS-Viber-25.11.md“ (папката на уебинара) — не пипай на ръка:',
    '   текстовете се сменят там и този файл се генерира наново. {име}, {календар} се попълват при изпращане. */',
    '', 'export const IMEILI_TEKSTOVE: ReadonlyArray<{ n: number; tema: string; tekst: string }> = '+json.dumps(out,ensure_ascii=False,indent=2)+';',
    '', '/** SMS-ите за Notifier (латиница, до 159 знака; [link] = личният линк към Zoom). */',
    'export const SMS_TEKSTOVE = '+json.dumps(sms,ensure_ascii=False,indent=2)+' as const;', '']
io.open('lib/uebinar/napomnyania-tekstove.ts','w',encoding='utf-8').write('\n'.join(ts))
print(len(out),'имейла ·', {k:len(v) for k,v in sms.items()})
