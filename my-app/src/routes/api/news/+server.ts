// src/routes/api/news/+server.ts
import type { RequestHandler } from './$types';
import type { Scope, Category, Article, NewsResponse } from '$lib/types';

import { getFeedUrls } from '$lib/server/rss/catalog';
import { fetchFeed, runLimited } from '$lib/server/rss/fetchFeed';
import { resolveOgImage } from '$lib/server/enrich/ogImage';

// ---- helpers ---------------------------------------------------------------

function hostOf(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}

type ParsedItem = {
	title: string;
	link: string;
	publishedAt?: string | null;
	excerpt?: string | null;
	image?: string | null;
	source?: string | null;
};

function toArticle(it: ParsedItem, originFeedUrl: string): Article {
	const url = it.link;
	const srcName = it.source ?? hostOf(originFeedUrl);
	// Cast to Article to satisfy stricter SourceId typing without touching your types.
	return {
		id: `rss:${url}`,
		source: 'rss' as unknown as Article['source'],
		sourceName: srcName,
		title: it.title || 'Untitled',
		url,
		image: it.image ?? null,
		excerpt: it.excerpt ?? null,
		category: null,
		publishedAt: it.publishedAt ?? null,
		author: null
	} as unknown as Article;
}

/** images we should treat as placeholders and replace via OG image */
function isBadOrGoogleThumb(u?: string | null): boolean {
	if (!u) return true;
	try {
		const { hostname, pathname } = new URL(u);
		if (
			hostname.endsWith('news.google.com') ||
			hostname.endsWith('googleusercontent.com') ||
			hostname.endsWith('gstatic.com') ||
			hostname.endsWith('google.com')
		)
			return true;

		const p = pathname.toLowerCase();
		if (
			p.includes('/favicon') ||
			p.includes('/news_') ||
			p.includes('/branding') ||
			p.includes('/static')
		)
			return true;

		return false;
	} catch {
		return true;
	}
}

/** filter out login/subscribe/epaper non-stories */
function looksLikeLoginOrEpaper(url: string, title?: string | null): boolean {
	const t = (title || '').toLowerCase();
	if (/\b(login|sign[\s-]?in|subscribe|e-?paper|user\s*login)\b/i.test(t)) return true;

	try {
		const u = new URL(url);
		const path = u.pathname.toLowerCase();
		const qs = u.search.toLowerCase();
		if (
			/(\/login|\/signin|\/account|\/subscribe|\/e-?paper|\/epaper|\/paywall)/.test(path) ||
			qs.includes('login') ||
			qs.includes('subscribe')
		)
			return true;

		if (u.hostname.includes('accounts.google.com')) return true;
	} catch {
		/* ignore */
	}
	return false;
}

// ---------------------------------------------------------------------------

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const scope = (url.searchParams.get('scope') as Scope) ?? 'all';
	const category = url.searchParams.get('category') as Category | null;
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
	const size = Math.min(60, Math.max(1, Number(url.searchParams.get('size') ?? '24')));

	const kenyaFeeds = getFeedUrls('kenya');
	const globalFeeds = getFeedUrls('global');

	const feedUrls =
		scope === 'kenya'
			? kenyaFeeds
			: scope === 'global'
				? globalFeeds
				: [...kenyaFeeds, ...globalFeeds];

	// Fetch feeds with limited concurrency; skip broken ones
	const allArticles: Article[] = [];

	await runLimited(6, feedUrls, async (feedUrl) => {
		try {
			const items = (await fetchFeed(feedUrl, 1)) as ParsedItem[]; // 1 retry inside fetcher
			for (const it of items) {
				if (!it?.link) continue;

				// drop obvious non-stories (login/epaper)
				if (looksLikeLoginOrEpaper(it.link, it.title)) continue;

				allArticles.push(toArticle(it, feedUrl));
			}
		} catch {
			// skip bad feeds quietly
		}
	});

	// Dedupe by URL
	const byUrl = new Map<string, Article>();
	for (const a of allArticles) {
		if (!a.url) continue;
		if (!byUrl.has(a.url)) byUrl.set(a.url, a);
	}
	let items = Array.from(byUrl.values());

	if (category) items = items.filter((i) => i.category === category);

	// Sort newest → oldest (missing dates last)
	items.sort((a, b) => {
		const da = a.publishedAt ? Date.parse(a.publishedAt) : 0;
		const db = b.publishedAt ? Date.parse(b.publishedAt) : 0;
		return db - da;
	});

	// Replace GN/placeholder thumbs (and missing ones) with OG image for the first N items
	const toEnrich = items.filter((i) => !i.image || isBadOrGoogleThumb(i.image)).slice(0, 40);
	await runLimited(8, toEnrich, async (it) => {
		const img = await resolveOgImage(it.url);
		if (img) it.image = img;
	});

	// For Kenyan scope, prefer items with images first, and nudge Capital FM
	if (scope === 'kenya') {
		const score = (a: Article): number => {
			let s = 0;
			if (a.image) s += 100; // image first
			try {
				const h = new URL(a.url).hostname.replace(/^www\./, '');
				if (h.endsWith('capitalfm.co.ke')) s += 20;
			} catch {
				/* ignore */
			}
			const ts = a.publishedAt ? Date.parse(a.publishedAt) : 0;
			// combine: high score dominates, timestamp keeps it recent
			return s * 1_000_000_000 + ts;
		};
		items.sort((a, b) => score(b) - score(a));
	}

	// Pagination
	const total = items.length;
	const start = (page - 1) * size;
	const paged = items.slice(start, start + size);

	const res: NewsResponse = {
		items: paged,
		total,
		fetchedAt: Date.now()
	};

	setHeaders({
		'content-type': 'application/json; charset=utf-8',
		'cache-control':
			scope === 'global'
				? 'public, s-maxage=60, stale-while-revalidate=120'
				: 'public, s-maxage=30, stale-while-revalidate=60'
	});

	return new Response(JSON.stringify(res));
};
