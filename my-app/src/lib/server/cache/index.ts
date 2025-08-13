export interface Cache {
	get<T>(key: string): Promise<T | undefined>;
	set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

// simple singleton
import { MemoryCache } from './memory';
let _cache: Cache | null = null;

export function getCache(): Cache {
	if (!_cache) _cache = new MemoryCache();
	return _cache;
}
