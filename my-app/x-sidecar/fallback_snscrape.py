from __future__ import annotations
from typing import List, Dict, Tuple
import subprocess, json, shlex

# Build a query like: from:citizentvkenya (url:"*.co.ke" OR url:"nation.africa" ...)
ALLOW = [
    "citizen.digital", "kbc.co.ke", "k24tv.co.ke", "standardmedia.co.ke",
    "nation.africa", "businessdailyafrica.com", "people.co.ke",
    "capitalfm.co.ke", "the-star.co.ke", "nairobinews.nation.africa"
]

def _build_query(user: str, allow: List[str] | None) -> str:
    if allow:
        ors = " OR ".join([f'url:"{d}"' for d in allow])
        return f'from:{user} ({ors}) since:{_since_days(7)}'
    return f'from:{user} since:{_since_days(7)}'

def _since_days(days: int) -> str:
    # rough “since” date; snscrape understands YYYY-MM-DD
    from datetime import datetime, timedelta
    return (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")

def scrape_user_links_search(user: str, limit: int, host_allow: List[str] | None) -> Tuple[List[Dict], str, int]:
    q = _build_query(user, host_allow)
    cmd = f"snscrape --jsonl --max-results {limit*4} twitter-search {shlex.quote(q)}"
    try:
        p = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        items: List[Dict] = []
        scanned = 0
        seen = set()
        for line in p.stdout:
            scanned += 1
            try:
                obj = json.loads(line)
                url = obj.get("outlinks", [None])[0] or obj.get("url")
                if not url or url in seen: continue
                seen.add(url)
                items.append({
                    "id": f"x:{user}:{obj.get('id')}",
                    "source": f"x:{user}",
                    "sourceName": f"{user} (X via Search)",
                    "title": (obj.get("content") or "").split("\n")[0][:140],
                    "url": url,
                    "image": None,
                    "excerpt": obj.get("content"),
                    "category": None,
                    "publishedAt": obj.get("date"),
                    "author": f"@{user}",
                })
                if len(items) >= limit: break
            except Exception:
                continue
        return (items, q, scanned)
    except Exception:
        return ([], q, 0)
