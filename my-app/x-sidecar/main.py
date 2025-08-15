import asyncio, os, time, logging, traceback
from typing import List, Dict, Any
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from urllib.parse import urlparse

from cache import TTLCache
from settings import ALLOWED_HANDLES, TTL, MAX_PER_USER, HOST_ALLOWLIST, HOST, PORT
from normalizer import extract_external_url_from_tweet, article_from_tweet
from client_factory import get_client
from fallback_snscrape import scrape_user_links_search
from nitter_fallback import fetch_nitter_user

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("x-sidecar")

app = FastAPI(title="SPOTLIGHT-KE X Sidecar", version="1.4")
CACHE = TTLCache()

NITTER_BASES = [b.strip() for b in os.environ.get("NITTER_BASES","").split(",") if b.strip()] or \
               ["https://nitter.net","https://ntrqq.com","https://nitter.poast.org","https://nitter.fdn.fr"]

def host_allowed(u: str) -> bool:
    host = (urlparse(u).hostname or "").lower()
    return (not HOST_ALLOWLIST) or any(host.endswith(suf) for suf in HOST_ALLOWLIST)

async def fetch_user_twikit(client, handle: str) -> List[Dict[str, Any]]:
    key = f"user:{handle.lower()}:twikit"
    cached = CACHE.get(key)
    if cached is not None:
        return cached
    try:
        user = await client.get_user_by_screen_name(handle)
        tweets = await client.get_user_tweets(user.id, count=MAX_PER_USER)
    except Exception as e:
        log.info("twikit failed @%s: %s", handle, e)
        return []
    out: List[Dict[str, Any]] = []
    for tw in tweets:
        try:
            url = await extract_external_url_from_tweet(tw)
            if not url or not host_allowed(url):
                continue
            out.append(article_from_tweet(tw, handle, url))
        except Exception:
            pass
    CACHE.set(key, out, TTL)
    log.info("twikit @%s -> %d", handle, len(out))
    return out

def fetch_user_snscrape(handle: str) -> Dict[str, Any]:
    key = f"user:{handle.lower()}:snscrape2"
    cached = CACHE.get(key)
    if cached is not None:
        return cached
    items, q, scanned = scrape_user_links_search(handle, MAX_PER_USER, HOST_ALLOWLIST)
    payload = {"items": items, "query": q, "scanned": scanned}
    CACHE.set(key, payload, TTL)
    log.info("snscrape @%s scanned=%d found=%d", handle, scanned, len(items))
    return payload

async def fetch_user_nitter(handle: str) -> Dict[str, Any]:
    key = f"user:{handle.lower()}:nitter"
    cached = CACHE.get(key)
    if cached is not None:
        return cached
    payload = await fetch_nitter_user(handle, MAX_PER_USER, HOST_ALLOWLIST, NITTER_BASES)
    CACHE.set(key, payload, TTL)
    log.info("nitter  @%s base=%s scanned=%d found=%d", handle, payload.get("base"), payload.get("scanned"), len(payload.get("items",[])))
    return payload

@app.get("/api/health")
async def health(): return {"ok": True}

@app.get("/api/x-news")
async def x_news(
    usernames: List[str] = Query(default=ALLOWED_HANDLES),
    limit: int = 40
):
    try:
        client, mode = get_client()
        items_map: Dict[str, Dict[str, Any]] = {}
        meta = {"twikit": [], "snscrape": [], "nitter": []}

        # 1) Twikit
        twikit_results = await asyncio.gather(*[fetch_user_twikit(client, u) for u in usernames], return_exceptions=True)
        twikit_count = 0
        for u, r in zip(usernames, twikit_results):
            if isinstance(r, Exception):
                meta["twikit"].append({"user": u, "error": str(r)})
                continue
            meta["twikit"].append({"user": u, "found": len(r)})
            for it in r:
                twikit_count += 1
                items_map.setdefault(it["url"], it)

        # 2) snscrape fallback
        if twikit_count == 0:
            mode = f"{mode}+snscrape"
            for u in usernames:
                payload = fetch_user_snscrape(u)
                meta["snscrape"].append({"user": u, "scanned": payload["scanned"], "found": len(payload["items"]), "query": payload["query"]})
                for it in payload["items"]:
                    items_map.setdefault(it["url"], it)

        # 3) Nitter fallback (only if still empty)
        if not items_map:
            mode = f"{mode}+nitter"
            nitter_results = await asyncio.gather(*[fetch_user_nitter(u) for u in usernames], return_exceptions=True)
            for u, p in zip(usernames, nitter_results):
                if isinstance(p, Exception):
                    meta["nitter"].append({"user": u, "error": str(p)})
                    continue
                meta["nitter"].append({"user": u, "base": p.get("base"), "scanned": p.get("scanned"), "found": len(p.get("items", []))})
                for it in p.get("items", []):
                    items_map.setdefault(it["url"], it)

        items = list(items_map.values())
        items.sort(key=lambda x: (x.get("publishedAt") or ""), reverse=True)
        return JSONResponse({"items": items[:limit], "fetchedAt": int(time.time()), "mode": mode, "count": len(items), "meta": meta})
    except Exception as e:
        logging.error("unhandled: %s\n%s", e, traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": str(e)})
