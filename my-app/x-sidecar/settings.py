import os

def _env(key: str, default: str = "") -> str:
    return os.environ.get(key, default)

ALLOWED_HANDLES = [h.strip() for h in _env("ALLOWED_HANDLES",
    "citizentvkenya,ntvkenya,NationAfrica,StandardKenya,KBCChannel1,K24Tv,TheStarKenya,KTNNewsKE"
).split(",") if h.strip()]

TTL = int(_env("TTL", "300"))
MAX_PER_USER = int(_env("MAX_PER_USER", "20"))
HOST_ALLOWLIST = [h.strip().lower() for h in _env("HOST_ALLOWLIST",
    "citizen.digital,kbc.co.ke,k24tv.co.ke,standardmedia.co.ke,nation.africa,businessdailyafrica.com,people.co.ke,capitalfm.co.ke,the-star.co.ke,nairobinews.nation.africa"
).split(",") if h.strip()]

HOST = _env("HOST", "127.0.0.1")
PORT = int(_env("PORT", "8910"))
