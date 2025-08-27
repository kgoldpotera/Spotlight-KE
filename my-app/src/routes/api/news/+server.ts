import type { RequestHandler } from './$types';
import type { Scope, Category, Article, NewsResponse } from '$lib/types';
import { KENYA_SOURCES } from '$lib/server/sources/kenya';
import { GLOBAL_SOURCES } from '$lib/server/sources/global';
import { fetchFeed } from '$lib/server/rss/fetchFeed';
import { parseFeed } from '$lib/server/rss/parse';
import { itemsToArticles } from '$lib/server/rss/normalize';
import { resolveOgImage } from '$lib/server/enrich/ogImage';

function limitConcurrency<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>) {
	const queue = [...items];
	const running: Promise<void>[] = [];
	const results: R[] = [];

	const run = async () => {
		const x = queue.shift();
		if (x == null) return;
		try {
			const r = await fn(x);
			results.push(r as any);
		} finally {
			await run();
		}
	};

	for (let i = 0; i < Math.min(n, items.length); i++) running.push(run());
	return Promise.all(running).then(() => results);
}

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const scope = (url.searchParams.get('scope') as Scope) ?? 'all';
	const category = url.searchParams.get('category') as Category | null;
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
	const size = Math.min(60, Math.max(1, Number(url.searchParams.get('size') ?? '24')));

	const sources = [...KENYA_SOURCES, ...GLOBAL_SOURCES]
		.filter((s) => s.active)
		.filter((s) => (scope === 'all' ? true : s.scope === scope));

	const batches = await limitConcurrency(sources, 5, async (s) => {
		try {
			const xml = await fetchFeed(s.url, s.ttlMs ?? 300_000);
			const parsed = parseFeed(xml);
			const arts = itemsToArticles({ sourceId: s.id, sourceLabel: s.label, parsed });
			return arts;
		} catch (e) {
			console.error('[rss]', s.label, s.url, e);
			return [] as Article[];
		}
	});

	const all = ([] as Article[]).concat(...batches);

	// dedupe by URL
	const byUrl = new Map<string, Article>();
	for (const a of all) if (a.url && !byUrl.has(a.url)) byUrl.set(a.url, a);

	let items = Array.from(byUrl.values());

	if (category) items = items.filter((i) => i.category === category);

	// sort newest → oldest
	items.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

	// 🔎 enrich top N items that are missing image
	const toEnrich = items.filter((i) => !i.image).slice(0, 32);
	await limitConcurrency(toEnrich, 6, async (it) => {
		const img = await resolveOgImage(it.url);
		if (img) it.image = img;
	});

	const total = items.length;
	const start = (page - 1) * size;
	const paged = items.slice(start, start + size);

	const res: NewsResponse = {
		items: paged,
		total,
		fetchedAt: Date.now()
	};

	setHeaders({
		'content-type': 'application/json',
		'cache-control':
			scope === 'global'
				? 'public, s-maxage=60, stale-while-revalidate=120'
				: 'public, s-maxage=30, stale-while-revalidate=60'
	});

	return new Response(JSON.stringify(res));
};
