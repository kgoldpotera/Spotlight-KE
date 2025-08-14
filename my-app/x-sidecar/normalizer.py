import re, httpx
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

NEWS_URL = re.compile(r"https?://[^\s]+", re.I)

async def expand_tco(url: str) -> str:
    try:
        async with httpx.AsyncClient(follow_redirects=False, timeout=6) as client:
            r = await client.head(url, headers={"User-Agent":"Mozilla/5.0"})
            loc = r.headers.get("location")
            if loc: return loc
        async with httpx.AsyncClient(follow_redirects=False, timeout=8) as client:
            r = await client.get(url, headers={"User-Agent":"Mozilla/5.0"})
            loc = r.headers.get("location")
            return loc or url
    except Exception:
        return url

def _urls_from_entities(ent: Dict[str, Any]) -> List[str]:
    urls: List[str] = []
    for u in (ent or {}).get('urls', []):
        for k in ('expanded_url', 'url', 'display_url'):
            v = u.get(k)
            if v: urls.append(v)
    # media sometimes includes expanded_url but those are image pages; keep anyway
    for m in (ent or {}).get('media', []):
        for k in ('expanded_url', 'url'):
            v = m.get(k)
            if v: urls.append(v)
    return urls

def _urls_from_card(card: Any) -> List[str]:
    # twikit exposes card.binding_values as a dict of {key: {string_value|image_value{url}|...}}
    urls: List[str] = []
    try:
        bv = getattr(card, 'binding_values', None)
        if isinstance(card, dict):
            bv = card.get('binding_values', bv)
        if isinstance(bv, dict):
            for key in ('card_url','vanity_url','website_url','cta_url','app_url','player_url','url'):
                v = bv.get(key)
                if isinstance(v, dict):
                    v = v.get('string_value') or v.get('url') or (v.get('image_value') or {}).get('url')
                if v: urls.append(v)
    except Exception:
        pass
    return urls

async def extract_external_url_from_tweet(t: Any) -> Optional[str]:
    # 1) Entities
    legacy = getattr(t, 'legacy', {}) or {}
    urls = _urls_from_entities(legacy.get('entities', {}) or {})
    # 2) Card
    card = getattr(t, 'card', None)
    urls += _urls_from_card(card) if card else []
    # 3) Text fallback
    text = (getattr(t, 'full_text', None) or getattr(t, 'text', None) or "")
    urls += NEWS_URL.findall(text)

    # expand t.co and drop internal x/twitter links
    outs: List[str] = []
    for u in urls:
        if not u: continue
        host = (urlparse(u).hostname or "").lower()
        if 'twitter.com' in host or 'x.com' in host:  # skip internal links
            continue
        if 't.co/' in u:
            outs.append(await expand_tco(u))
        else:
            outs.append(u)

    # return first with a real host
    for u in outs:
        if urlparse(u).hostname:
            return u
    return None

def image_from_tweet(t: Any) -> Optional[str]:
    # Try extended media first
    legacy = getattr(t, 'legacy', {}) or {}
    ent = legacy.get('extended_entities') or legacy.get('entities') or {}
    media = ent.get('media') or []
    if media:
        m0 = media[0]
        return m0.get('media_url_https') or m0.get('media_url')

    # Card thumbnails
    card = getattr(t, 'card', None)
    try:
        bv = getattr(card, 'binding_values', None)
        if isinstance(card, dict):
            bv = card.get('binding_values', bv)
        if isinstance(bv, dict):
            for key in ('photo_image_full_size_large','photo_image_full_size','thumbnail_image','summary_photo_image'):
                v = bv.get(key)
                if isinstance(v, dict):
                    url = (v.get('image_value') or {}).get('url') or v.get('string_value')
                    if url: return url
    except Exception:
        pass
    return None

def article_from_tweet(t: Any, handle: str, url: str) -> Dict[str, Any]:
    text = (getattr(t, "full_text", None) or getattr(t, "text", None) or "").strip()
    published = getattr(t, "created_at", None) or getattr(t, "legacy", {}).get("created_at")
    img = image_from_tweet(t)

    title = text.strip().replace("\n"," ")
    if len(title) > 140: title = title[:137] + "…"
    excerpt = text.strip()
    if len(excerpt) > 280: excerpt = excerpt[:277] + "…"

    return {
        "id": f"x:{handle}:{getattr(t,'id', None)}",
        "source": f"x/{handle}",
        "sourceName": f"{handle} (X)",
        "title": title or f"Post by @{handle}",
        "url": url,
        "image": img,
        "excerpt": excerpt or None,
        "category": None,
        "publishedAt": published,
        "author": f"@{handle}"
    }
