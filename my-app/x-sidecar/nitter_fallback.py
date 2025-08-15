from __future__ import annotations
from typing import List, Dict
from urllib.parse import urlparse
import re, httpx, feedparser

A_RE = re.compile(r'href=["\'](https?://[^"\']+)["\']', re.I)
HTTP_RE = re.compile(r'https?://[^\s)]+', re.I)

def _ext_link_from_html(html: str, host_allowlist: list[str] | None) -> str | None:
    # Try anchor tags first
    for u in A_RE.findall(html or ""):
        if _accept(u, host_allowlist): return u
    # Fallback: any http-looking token
    for u in HTTP_RE.findall(html or ""):
        if _accept(u, host_allowlist): return u
    return None

def _accept(u: str, host_allowlist: list[str] | None) -> bool:
    host = (urlparse(u).hostname or "").lower()
    if not host: return False
    if any(x in host for x in ("twitter.com", "x.com", "t.co", "nitter")):
        return False
    return (not host_allowlist) or any(host.endswith(suf.lower()) for suf in host_allowlist)

async def fetch_nitter_user(username: str, max_results: int, host_allowlist: list[str] | None, bases: list[str]) -> Dict[str, object]:
    """
    Try:
      1) direct Nitter RSS
      2) Nitter RSS via reader proxy (r.jina.ai/http://<nitter>/<user>/rss)
      3) Nitter HTML via reader proxy then regex links
    Returns { items, base, scanned }
    """
    scanned_total = 0
    async with httpx.AsyncClient(timeout=12, headers={"User-Agent":"Mozilla/5.0"}) as client:
        for base in bases:
            b = base.rstrip("/")
            # candidates we’ll try in order
            paths = [
                f"{b}/{username}/rss",
                f"https://r.jina.ai/http://{b.replace('https://','').replace('http://','')}/{username}/rss",
                f"https://r.jina.ai/http://{b.replace('https://','').replace('http://','')}/{username}",
            ]
            for url in paths:
                try:
                    r = await client.get(url)
                    if r.status_code != 200 or not r.content:
                        continue

                    # If looks like RSS/XML, use feedparser
                    content = r.content
                    text = r.text

                    if text.strip().startswith("<"):
                        feed = feedparser.parse(content)
                        items: List[Dict[str, object]] = []
                        for e in feed.entries:
                            scanned_total += 1
                            html = getattr(e, "summary", "") or getattr(e, "description", "")
                            link = _ext_link_from_html(html, host_allowlist)
                            if not link: continue
                            title_txt = (getattr(e, "title", "") or "").replace("\n"," ").strip()
                            if len(title_txt) > 140: title_txt = title_txt[:137] + "…"
                            excerpt = (getattr(e, "summary", "") or getattr(e, "description", "") or "")
                            if len(excerpt) > 280: excerpt = excerpt[:277] + "…"
                            pub = getattr(e, "published", None)
                            items.append({
                                "id": f"x:{username.lower()}:{getattr(e,'id', getattr(e,'link',''))}",
                                "source": f"x:{username.lower()}",
                                "sourceName": f"{username} (X via Nitter)",
                                "title": title_txt or f"Post by @{username}",
                                "url": link,
                                "image": None,
                                "excerpt": excerpt or None,
                                "category": None,
                                "publishedAt": pub,
                                "author": f"@{username}"
                            })
                            if len(items) >= max_results: break
                        if items: return {"items": items, "base": url, "scanned": scanned_total}
                    else:
                        # Plain text from the reader proxy → extract first acceptable link per "tweet block"
                        # Split crudely by newlines; look for external link candidates
                        lines = text.splitlines()
                        items: List[Dict[str, object]] = []
                        buf: List[str] = []
                        def flush():
                            nonlocal items, buf, scanned_total
                            if not buf: return
                            scanned_total += 1
                            htmlish = "\n".join(buf)
                            link = _ext_link_from_html(htmlish, host_allowlist)
                            if not link: 
                                buf.clear()
                                return
                            title_txt = " ".join([l.strip() for l in buf])[:140]
                            items.append({
                                "id": f"x:{username.lower()}:{scanned_total}",
                                "source": f"x:{username.lower()}",
                                "sourceName": f"{username} (X via Reader)",
                                "title": title_txt,
                                "url": link,
                                "image": None,
                                "excerpt": title_txt,
                                "category": None,
                                "publishedAt": None,
                                "author": f"@{username}"
                            })
                            buf.clear()

                        for ln in lines:
                            if ln.strip() == "": 
                                flush()
                            else:
                                buf.append(ln)
                        flush()
                        if items: return {"items": items[:max_results], "base": url, "scanned": scanned_total}
                except Exception:
                    continue
    return {"items": [], "base": None, "scanned": scanned_total}
