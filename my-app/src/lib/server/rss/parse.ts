// src/lib/server/rss/parse.ts
import { XMLParser } from 'fast-xml-parser';

export type FeedItem = {
	title: string;
	link: string;
	publishedAt?: string | null;
	excerpt?: string | null;
	image?: string | null;
	source?: string | null;
};

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '',
	allowBooleanAttributes: true,
	// tolerate imperfect markup
	parseTagValue: true,
	parseAttributeValue: true,
	trimValues: true
});

export function parseFeed(xml: string): FeedItem[] {
	const doc = parser.parse(xml) as unknown;

	// RSS 2.0
	const rssCh = (doc as Record<string, unknown>)?.rss as
		| { channel?: { title?: unknown; item?: unknown[] | unknown } }
		| undefined;

	if (rssCh?.channel?.item) {
		const ch = rssCh.channel;
		const sourceTitle = getText(ch.title) ?? null;
		const items = Array.isArray(ch.item) ? ch.item : [ch.item];
		return items.map((it) => normalizeRssItem(it as unknown, sourceTitle));
	}

	// Atom
	const feed = (doc as Record<string, unknown>)?.feed as
		| { title?: unknown; entry?: unknown[] | unknown }
		| undefined;

	if (feed?.entry) {
		const sourceTitle = getText(feed.title) ?? null;
		const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
		return entries.map((it) => normalizeAtomEntry(it as unknown, sourceTitle));
	}

	return [];
}

// ------- helpers -------

function getText(x: unknown): string | null {
	if (x == null) return null;
	if (typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean') {
		return String(x);
	}
	if (typeof x === 'object') {
		const rec = x as Record<string, unknown>;
		if ('#text' in rec) return String(rec['#text']);
		if ('_text' in rec) return String(rec['_text']);
		if ('$' in rec) return String(rec['$']);
	}
	// fallback — some feeds dump objects here; stringify but keep it predictable
	return null;
}

function firstNonEmpty(...vals: (string | null | undefined)[]) {
	for (const v of vals) if (v && `${v}`.trim()) return `${v}`.trim();
	return null;
}

function normalizeRssItem(raw: unknown, sourceTitle: string | null): FeedItem {
	const it = (raw ?? {}) as Record<string, unknown>;

	const title = firstNonEmpty(getText(it.title), 'Untitled')!;

	// link via <link> or <guid isPermaLink="true">
	const guid = it.guid as Record<string, unknown> | undefined;
	const guidIsPerma = Boolean((guid?.isPermaLink as boolean) ?? false);
	const link = firstNonEmpty(getText(it.link), guidIsPerma ? getText(guid) : null)!;

	const publishedAt = getText(it.pubDate) ?? getText(it.published) ?? getText(it.updated) ?? null;

	const excerpt = firstNonEmpty(
		stripTags(getText(it.description) ?? ''),
		stripTags(getText(it['content:encoded']) ?? '')
	);

	// images: enclosure, media:content, or content:encoded img
	const enc = it.enclosure as unknown;
	let enclosure: string | null = null;
	if (enc && typeof enc === 'object') {
		enclosure = ((enc as Record<string, unknown>)?.url as string | undefined) ?? null;
	} else if (typeof enc === 'string') {
		enclosure = enc;
	}

	const mediaContent =
		((it['media:content'] as Record<string, unknown> | undefined)?.url as string | undefined) ??
		((it['media:thumbnail'] as Record<string, unknown> | undefined)?.url as string | undefined) ??
		null;

	const imgFromHtml = findImgSrc(getText(it['content:encoded']) ?? getText(it.description) ?? null);

	const image = firstNonEmpty(enclosure, mediaContent, imgFromHtml);

	return { title, link, publishedAt, excerpt, image, source: sourceTitle };
}

function normalizeAtomEntry(raw: unknown, sourceTitle: string | null): FeedItem {
	const it = (raw ?? {}) as Record<string, unknown>;

	const title = firstNonEmpty(getText(it.title), 'Untitled')!;

	// link may be array/object/string
	let link = '';
	const linkVal = it.link as unknown;

	if (Array.isArray(linkVal)) {
		const alt = linkVal.find((l) => (l as Record<string, unknown>)?.rel === 'alternate') as
			| Record<string, unknown>
			| undefined;
		link =
			(alt?.href as string | undefined) ??
			((linkVal[0] as Record<string, unknown>)?.href as string | undefined) ??
			'';
	} else if (typeof linkVal === 'object' && linkVal) {
		link =
			((linkVal as Record<string, unknown>).href as string | undefined) ?? getText(linkVal) ?? '';
	} else {
		link = getText(linkVal) ?? '';
	}

	const publishedAt = getText(it.published) ?? getText(it.updated) ?? null;

	const excerpt = firstNonEmpty(
		stripTags(getText(it.summary) ?? ''),
		stripTags(getText(it.content) ?? '')
	);

	// enclosure can be a link rel="enclosure"
	let enclosure: string | null = null;
	if (Array.isArray(linkVal)) {
		const enc = linkVal.find((l) => (l as Record<string, unknown>)?.rel === 'enclosure') as
			| Record<string, unknown>
			| undefined;
		enclosure = (enc?.href as string | undefined) ?? null;
	} else if (typeof linkVal === 'object' && linkVal) {
		const rec = linkVal as Record<string, unknown>;
		enclosure = (rec.rel === 'enclosure' ? (rec.href as string | undefined) : undefined) ?? null;
	}

	const mediaContent =
		((it['media:content'] as Record<string, unknown> | undefined)?.url as string | undefined) ??
		((it['media:thumbnail'] as Record<string, unknown> | undefined)?.url as string | undefined) ??
		null;

	const image = firstNonEmpty(enclosure, mediaContent, findImgSrc(getText(it.content)));

	return { title, link, publishedAt, excerpt, image, source: sourceTitle };
}

function stripTags(html: string) {
	return html
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function findImgSrc(html: string | null | undefined): string | null {
	if (!html) return null;
	const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
	return m?.[1] ?? null;
}
