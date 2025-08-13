import { getCache } from '$lib/server/cache';

const UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
	'Chrome/124.0 Safari/537.36 SPOTLIGHT-KE/0.1';

export async function fetchFeed(url: string, ttlMs = 300_000): Promise<string> {
	const cache = getCache();
	const bodyKey = `feed:body:${url}`;
	const metaKey = `feed:meta:${url}`;

	const cachedBody = await cache.get<string>(bodyKey);
	const meta = (await cache.get<{ etag?: string; lastModified?: string }>(metaKey)) ?? {};

	const headers: Record<string, string> = {
		'user-agent': UA,
		accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
		'accept-language': 'en-KE,en;q=0.9'
	};
	if (meta.etag) headers['if-none-match'] = meta.etag;
	if (meta.lastModified) headers['if-modified-since'] = meta.lastModified;

	// hard timeout (10s)
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 10_000);

	try {
		const res = await fetch(url, {
			headers,
			redirect: 'follow',
			signal: controller.signal
		});

		clearTimeout(timer);

		if (res.status === 304 && cachedBody) return cachedBody;
		if (!res.ok) {
			if (cachedBody) return cachedBody;
			throw new Error(`Feed fetch failed ${res.status} for ${url}`);
		}

		const text = await res.text();
		const etag = res.headers.get('etag') || undefined;
		const lastModified = res.headers.get('last-modified') || undefined;

		await cache.set(bodyKey, text, Math.max(5, Math.floor(ttlMs / 1000)));
		await cache.set(metaKey, { etag, lastModified }, 24 * 60 * 60);

		return text;
	} catch (err) {
		clearTimeout(timer);
		if (cachedBody) return cachedBody;
		throw err;
	}
}
