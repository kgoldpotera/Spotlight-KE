from __future__ import annotations
from typing import List, Dict, Iterable
from urllib.parse import urlparse
from datetime import datetime, timedelta
import re
import snscrape.modules.twitter as sntwitter

HTTP_RE = re.compile(r"https?://[^\s)]+", re.I)

def _endswith_any(host: str, suffixes: Iterable[str]) -> bool:
    host = (host or "").lower()
    return any(host.endswith(suf.lower()) for suf in suffixes)

def build_query(username: str, host_allowlist: list[str] | None, days: int = 365) -> str:
    # go wide: last year, force links
    since = (datetime.utcnow() - timedelta(days=days)).date().isoformat()
    if host_allowlist:
        parts = " OR ".join(f'url:"{h}"' for h in host_allowlist if h)
        return f'from:{username} ({parts}) since:{since}'
    else:
        # filter:links often works; OR http fallback helps when card-only posts hide links
        return f'from:{username} (filter:links OR "http") since:{since}'

def extract_link_from_tweet(tw, host_allowlist: list[str] | None) -> str | None:
    # 1) snscrape outlinks (best case)
    for u in (getattr(tw, "outlinks", None) or []):
        host = (urlparse(u).hostname or "")
        if not host_allowlist or _endswith_any(host, host_allowlist):
            return u

    # 2) regex from content as a fallback
    for u in HTTP_RE.findall((tw.content or "")):
        host = (urlparse(u).hostname or "")
        if not host: 
            continue
        # skip twitter/x internal links
        if "twitter.com" in host or "x.com" in host or "t.co" in host:
            continue
        if not host_allowlist or _endswith_any(host, host_allowlist):
            return u

    return None

def scrape_user_links_search(username: str, max_results: int, host_allowlist: list[str] | None) -> tuple[list[dict], str, int]:
    """
    Returns (items, query_used, total_scanned)
    """
    items: List[Dict[str, object]] = []
    scanned = 0
    q = build_query(username, host_allowlist)
    try:
        for tw in sntwitter.TwitterSearchScraper(q).get_items():
            scanned += 1
            url = extract_link_from_tweet(tw, host_allowlist)
            if not url:
                continue

            text = (tw.content or "").strip().replace("\n", " ")
            title = text if len(text) <= 140 else text[:137] + "…"
            excerpt = (tw.content or "").strip()
            if len(excerpt) > 280:
                excerpt = excerpt[:277] + "…"

            items.append({
                "id": f"x:{username.lower()}:{tw.id}",
                "source": f"x:{username.lower()}",
                "sourceName": f"{username} (X)",
                "title": title or f"Post by @{username}",
                "url": url,
                "image": None,
                "excerpt": excerpt or None,
                "category": None,
                "publishedAt": (tw.date.isoformat() if getattr(tw, "date", None) else None),
                "author": f"@{username}",
            })
            if len(items) >= max_results:
                break
    except Exception:
        # leave empty; caller logs
        pass
    return items, q, scanned
