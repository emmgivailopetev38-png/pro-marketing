"""Пренасочванията, както са обявени в next.config.ts.

Съществува, защото и одитът, и проверката на живо преди това пазеха свои
списъци. На 31.08.2026 менюто получи „Работа при нас" към /rabota — редирект
към играта „ЛОСТ" в отделен Vercel проект. Одитът не знаеше за него и го
обяви за счупена връзка от 23 страници; проверката на живо пък изобщо не го
проверяваше, защото ръчният ѝ списък беше от шест адреса, а в конфигурацията
вече бяха десет.

Затова източникът е един и е самата конфигурация: нов редирект се хваща сам.
"""
import os
import re

_CONFIG = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "next.config.ts",
)


def redirects(path=_CONFIG):
    """{източник: {"to": цел, "permanent": bool}} само за буквалните адреси.

    Пропуска шаблонните източници (/:path*) и тези с условие `has` — те зависят
    от домейна на заявката и не се проверяват с прост GET.
    """
    try:
        src = open(path, encoding="utf-8").read()
    except OSError:
        return {}

    start = src.find("async redirects()")
    if start == -1:
        return {}
    end = src.find("async rewrites()", start)
    if end == -1:
        end = src.find("async headers()", start)
    body = src[start:end if end != -1 else len(src)]

    out = {}
    source = dest = None
    skip = False
    pattern = r'\b(source|destination|has|permanent)\s*:\s*(?:"([^"]*)"|(true|false))?'
    for kind, text, flag in re.findall(pattern, body):
        if kind == "has":
            skip = True
        elif kind == "source":
            source, dest, skip = text, None, False
        elif kind == "destination":
            dest = text
        elif kind == "permanent" and source is not None and dest is not None:
            usable = not skip and ":" not in source and "*" not in source
            if usable:
                out[source.rstrip("/") or "/"] = {
                    "to": dest,
                    "permanent": flag == "true",
                }
            source = dest = None
            skip = False
    return out


if __name__ == "__main__":
    for s, r in redirects().items():
        print(f"{s} -> {r['to']}  ({301 if r['permanent'] else 307})")
