import asyncio, os, time, logging, traceback
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from urllib.parse import urlparse

from cache import TTLCache
from settings import ALLOWED_HANDLES, TTL, MAX_PER_USER, HOST_ALLOWLIST, HOST, PORT
from normalizer import extract_external_url_from_tweet, article_from_tweet

from client_factory import get_client

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("x-sidecar")

app = FastAPI(title="SPOTLIGHT-KE X Sidecar", version="1.1")
CACHE = TTLCache()

def host_allowed(u: str) -> bool:
    host = (urlparse(u).hostname or "").lower()
    return (not HOST_ALLOWLIST) or any(host.endswith(allowed) for allowed in HOST_ALLOWLIST)

async def fetch_user(client, handle: str) -> List[Dict[str, Any]]:
    key = f"user:{handle.lower()}"
    cached = CACHE.get(key)
    if cached is not None:
        return cached
    try:
        user = await client.get_user_by_screen_name(handle)
    except Exception as e:
        log.error("lookup failed for @%s: %s", handle, e)
        return []
    try:
        tweets = await client.get_user_tweets(user.id, count=MAX_PER_USER)
    except Exception as e:
        log.error("timeline failed for @%s: %s", handle, e)
        return []
    out: List[Dict[str, Any]] = []
    for tw in tweets:
        text = (getattr(tw, "full_text", None) or getattr(tw, "text", None) or "")
        url = await extract_external_url_from_tweet(tw)

        if not url: 
            continue
        if not host_allowed(url):
            continue
        out.append(article_from_tweet(tw, handle, url))
    CACHE.set(key, out, TTL)
    return out

@app.get("/api/health")
async def health():
    return {"ok": True}

@app.get("/api/x-news")
async def x_news(
    usernames: List[str] = Query(default=ALLOWED_HANDLES),
    limit: int = 40
):
    try:
        client, mode = get_client()
        tasks = [fetch_user(client, u) for u in usernames]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Flatten + skip failed tasks
        items_map: Dict[str, Dict[str, Any]] = {}
        for r in results:
            if isinstance(r, Exception):
                log.error("task error: %s\n%s", r, traceback.format_exc())
                continue
            for it in r:
                k = it["url"]
                if k not in items_map:
                    items_map[k] = it

        items = list(items_map.values())
        items.sort(key=lambda x: (x.get("publishedAt") or ""), reverse=True)

        return JSONResponse({
            "items": items[:limit],
            "fetchedAt": int(time.time()),
            "mode": mode,
            "count": len(items)
        })
    except Exception as e:
        log.error("unhandled error: %s\n%s", e, traceback.format_exc())
        # Return a JSON error instead of plain text
        return JSONResponse(status_code=500, content={"error": str(e), "trace": traceback.format_exc()})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
