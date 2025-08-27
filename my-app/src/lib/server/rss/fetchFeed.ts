// src/lib/server/rss/fetchFeed.ts
import { parseFeed } from './parse';

const UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const COMMON_HEADERS = {
	'User-Agent': UA,
	Accept:
		'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7',
	'Accept-Language': 'en,en-GB;q=0.9'
};

export async function fetchFeed(url: string, retries = 1) {
	let lastErr: unknown;
	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const res = await fetch(url, {
				redirect: 'follow',
				signal: AbortSignal.timeout(12000),
				headers: COMMON_HEADERS
			});
			if (!res.ok) {
				throw new Error(`Feed fetch failed ${res.status} for ${url}`);
			}
			const xml = await res.text();
			return parseFeed(xml, url);
		} catch (err) {
			lastErr = err;
			// small backoff then retry
			await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
		}
	}
	throw lastErr;
}

// Run tasks with simple concurrency control
export async function runLimited<T>(n: number, items: T[], fn: (item: T) => Promise<unknown>) {
	const queue = [...items];
	const workers: Promise<void>[] = [];
	const results: unknown[] = [];
	for (let i = 0; i < Math.min(n, queue.length); i++) {
		workers.push(
			(async function worker() {
				while (queue.length) {
					const item = queue.shift()!;
					const out = await fn(item).catch(() => undefined);
					results.push(out);
				}
			})()
		);
	}
	await Promise.all(workers);
	return results;
}
