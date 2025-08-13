import type { Cache } from './index';

export class MemoryCache implements Cache {
	private store = new Map<string, { v: unknown; exp: number }>();
	async get<T>(key: string): Promise<T | undefined> {
		const e = this.store.get(key);
		if (!e) return undefined;
		if (Date.now() > e.exp) {
			this.store.delete(key);
			return undefined;
		}
		return e.v as T;
	}
	async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
		this.store.set(key, { v: value, exp: Date.now() + ttlSeconds * 1000 });
	}
}
