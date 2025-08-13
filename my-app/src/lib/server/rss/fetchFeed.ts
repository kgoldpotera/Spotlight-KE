import { getCache } from '$lib/server/cache';

const UA = 'SPOTLIGHT-KE/0.1 (+https://spotlight-ke.local)';

export async function fetchFeed(url: string, ttlMs = 300_000): Promise<string> {
	const cache = getCache();
	const bodyKey = `feed:body:${url}`;
	const metaKey = `feed:meta:${url}`;

	const cachedBody = await cache.get<string>(bodyKey);
	const meta = (await cache.get<{ etag?: string; lastModified?: string }>(metaKey)) ?? {};

	try {
		const res = await fetch(url, {
			headers: {
				'user-agent': UA,
				...(meta.etag ? { 'if-none-match': meta.etag } : {}),
				...(meta.lastModified ? { 'if-modified-since': meta.lastModified } : {})
			},
			redirect: 'follow'
		});

		if (res.status === 304 && cachedBody) {
			return cachedBody;
		}
		if (!res.ok) {
			if (cachedBody) return cachedBody;
			throw new Error(`Feed fetch failed ${res.status} for ${url}`);
		}

		const ct = res.headers.get('content-type') || '';
		if (!/xml|rss|atom|application\/.*xml|text\/xml/i.test(ct)) {
			// Some feeds lie; still try to read text
		}
		const text = await res.text();

		const etag = res.headers.get('etag') || undefined;
		const lastModified = res.headers.get('last-modified') || undefined;

		await cache.set(bodyKey, text, Math.max(5, Math.floor(ttlMs / 1000)));
		await cache.set(metaKey, { etag, lastModified }, 24 * 60 * 60); // keep meta for a day

		return text;
	} catch (err) {
		if (cachedBody) return cachedBody;
		throw err;
	}
}
