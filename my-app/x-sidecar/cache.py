import time
from typing import Any, Dict, Tuple

class TTLCache:
    def __init__(self):
        self.store: Dict[str, Tuple[float, Any]] = {}

    def get(self, key: str):
        v = self.store.get(key)
        if not v: return None
        exp, val = v
        if time.time() > exp:
            self.store.pop(key, None)
            return None
        return val

    def set(self, key: str, val: Any, ttl_seconds: int):
        self.store[key] = (time.time() + ttl_seconds, val)
