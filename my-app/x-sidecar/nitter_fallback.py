from __future__ import annotations
from typing import List, Dict
from urllib.parse import urlparse
import os, re, httpx, feedparser

USE_READER = os.environ.get("READER_PROXY","1") == "1"
A_RE = re.compile(r'href=["\'](https?://[^"\']+)["\']', re.I)
HTTP_RE = re.compile(r'https?://[^\s)]+', re.I)

def _ok(u: str, allow: List[str] | None) -> bool:
    host = (urlparse(u).hostname or "").lower()
    if not host: return False
    if any(x in host for x in ("twitter.com","x.com","t.co","nitter")): return False
    return not allow or any(host.endswith(s.lower()) for s in allow)

def _first_link(html: str, allow: List[str] | None) -> str | None:
    for u in A_RE.findall(html or ""):
        if _ok(u, allow): return u
    for u in HTTP_RE.findall(html or ""):
        if _ok(u, allow): return u
    return None

async def fetch_nitter_user(username: str, max_results: int, host_allow: List[str] | None, bases: List[str]) -> Dict[str, object]:
    scanned = 0
    async with httpx.AsyncClient(timeout=12, headers={"User-Agent":"Mozilla/5.0"}) as client:
        for base in bases:
            base = base.rstrip("/")
            paths = [f"{base}/{username}/rss"]
            if USE_READER:
                host = base.replace("https://","").replace("http://","")
                paths += [
                    f"https://r.jina.ai/http://{host}/{username}/rss",
                    f"https://r.jina.ai/http://{host}/{username}"
                ]
            for url in paths:
                try:
                    r = await client.get(url)
                    if r.status_code != 200 or not r.content: continue
                    text = r.text

                    # RSS?
                    if text[:1] == "<":
                        feed = feedparser.parse(r.content)
                        out: List[Dict] = []
                        for e in feed.entries:
                            scanned += 1
                            link = _first_link(getattr(e,"summary","") or getattr(e,"description",""), host_allow)
                            if not link: continue
                            title = (getattr(e,"title","") or "").replace("\n"," ").strip()[:140]
                            pub = getattr(e,"published",None)
                            out.append({
                                "id": f"x:{username}:{getattr(e,'id', getattr(e,'link',''))}",
                                "source": f"x:{username}",
                                "sourceName": f"{username} (X via Nitter)",
                                "title": title or f"Post by @{username}",
                                "url": link,
                                "image": None,
                                "excerpt": getattr(e,"summary","") or getattr(e,"description",""),
                                "category": None,
                                "publishedAt": pub,
                                "author": f"@{username}"
                            })
                            if len(out) >= max_results: break
                        if out: return {"items": out, "base": url, "scanned": scanned}
                    else:
                        # Reader-plain text → split, grab first acceptable link per block
                        out: List[Dict] = []
                        buf: List[str] = []
                        def flush():
                            nonlocal out, buf, scanned
                            if not buf: return
                            scanned += 1
                            htmlish = "\n".join(buf)
                            link = _first_link(htmlish, host_allow)
                            if link:
                                title = " ".join([l.strip() for l in buf])[:140]
                                out.append({
                                    "id": f"x:{username}:{scanned}",
                                    "source": f"x:{username}",
                                    "sourceName": f"{username} (X via Reader)",
                                    "title": title,
                                    "url": link,
                                    "image": None,
                                    "excerpt": title,
                                    "category": None,
                                    "publishedAt": None,
                                    "author": f"@{username}"
                                })
                            buf.clear()
                        for ln in text.splitlines():
                            if not ln.strip(): flush()
                            else: buf.append(ln)
                        flush()
                        if out: return {"items": out[:max_results], "base": url, "scanned": scanned}
                except Exception:
                    continue
    return {"items": [], "base": None, "scanned": scanned}
