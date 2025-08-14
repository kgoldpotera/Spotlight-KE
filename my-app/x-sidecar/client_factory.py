import os
from typing import Tuple, Literal, Any

from twikit.guest import GuestClient
from twikit import Client as AuthClient

MODE = os.environ.get("MODE", "").lower()  # "guest" | "auth" | ""
COOKIES_PATH = os.environ.get("COOKIES_PATH", "cookies.json")

def have_cookies() -> bool:
    return os.path.exists(COOKIES_PATH) and os.path.getsize(COOKIES_PATH) > 0

def get_client() -> Tuple[Any, Literal["guest","auth"]]:
    """
    Returns a Twikit client and the mode used.
    - If MODE=auth or cookies.json exists -> authenticated client
    - Else -> guest client
    """
    if MODE == "auth" or have_cookies():
        c = AuthClient("en-US")
        try:
            c.load_cookies(COOKIES_PATH)  # sync
            return c, "auth"
        except Exception:
            # fallback to guest if cookie broken
            return GuestClient(), "guest"
    return GuestClient(), "guest"
