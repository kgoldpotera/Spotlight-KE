import { XMLParser } from 'fast-xml-parser';

export interface ParsedItem {
	title: string;
	link: string;
	publishedAt?: string;
	description?: string;
	author?: string;
	imageUrl?: string; // <- NEW
	rawHtml?: string; // <- optional raw (desc/content) for img extraction
}

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	textNodeName: '#text',
	trimValues: true
});

export function parseFeed(xml: string): ParsedItem[] {
	const root = parser.parse(xml);

	// RSS 2.0
	if (root?.rss?.channel?.item) {
		const items = Array.isArray(root.rss.channel.item)
			? root.rss.channel.item
			: [root.rss.channel.item];
		return items.map(fromRssItem).filter(valid);
	}

	// Atom
	if (root?.feed?.entry) {
		const entries = Array.isArray(root.feed.entry) ? root.feed.entry : [root.feed.entry];
		return entries.map(fromAtomEntry).filter(valid);
	}

	// Some feeds nest differently
	const channel = root?.channel;
	if (channel?.item) {
		const items = Array.isArray(channel.item) ? channel.item : [channel.item];
		return items.map(fromRssItem).filter(valid);
	}

	return [];
}

function valid(x: ParsedItem | null | undefined): x is ParsedItem {
	return !!x && !!x.title && !!x.link;
}

function fromRssItem(it: any): ParsedItem {
	const title = str(it.title);
	const link = str(it.link) || str(it?.guid?.['#text']) || '';

	// Dates/author
	const publishedAt =
		str(it.pubDate) || str(it?.['dc:date']) || str(it?.['dc:date.issued']) || undefined;
	const author = str(it?.author) || str(it?.['dc:creator']) || undefined;

	// Primary bodies
	const descriptionHtml = str(it?.description);
	const contentHtml = str(it?.['content:encoded']);

	// Image from RSS media tags
	const enclosureUrl = str(it?.enclosure?.['@_url']);
	const mediaContent = arr(it?.['media:content']).map((m: any) => str(m?.['@_url'] || m?.url));
	const mediaThumbs = arr(it?.['media:thumbnail']).map((m: any) => str(m?.['@_url'] || m?.url));
	const imageFromMedia = pickFirst([enclosureUrl, ...mediaContent, ...mediaThumbs].filter(Boolean));

	// Fallback: first <img src="..."> in description/content
	const imageFromHtml = pickImageFromHtml(descriptionHtml) || pickImageFromHtml(contentHtml);

	return {
		title,
		link,
		publishedAt,
		description: descriptionHtml || contentHtml || undefined,
		author,
		imageUrl: imageFromMedia || imageFromHtml || undefined,
		rawHtml: descriptionHtml || contentHtml || undefined
	};
}

function fromAtomEntry(en: any): ParsedItem {
	const title = str(en.title?.['#text'] ?? en.title) || '';
	const link = pickAtomLink(en.link);
	const publishedAt = str(en.updated) || str(en.published) || undefined;
	const summaryHtml = str(en.summary?.['#text'] ?? en.summary);
	const contentHtml = str(en.content?.['#text'] ?? en.content);

	// Atom media namespaces sometimes appear as media:content too
	const mediaContent = arr(en?.['media:content']).map((m: any) => str(m?.['@_url'] || m?.url));
	const mediaThumbs = arr(en?.['media:thumbnail']).map((m: any) => str(m?.['@_url'] || m?.url));
	const imageFromMedia = pickFirst([...mediaContent, ...mediaThumbs].filter(Boolean));
	const imageFromHtml = pickImageFromHtml(summaryHtml) || pickImageFromHtml(contentHtml);

	return {
		title,
		link,
		publishedAt,
		description: summaryHtml || contentHtml || undefined,
		author: str(en.author?.name ?? en.author) || undefined,
		imageUrl: imageFromMedia || imageFromHtml || undefined,
		rawHtml: summaryHtml || contentHtml || undefined
	};
}

// helpers
function pickAtomLink(link: any): string {
	if (!link) return '';
	if (typeof link === 'string') return link;
	const arrL = Array.isArray(link) ? link : [link];
	const alt = arrL.find((l) => (l['@_rel'] ?? 'alternate') === 'alternate' && !!l['@_href']);
	return (alt?.['@_href'] ?? arrL[0]?.['@_href'] ?? arrL[0]) || '';
}

function pickImageFromHtml(html?: string): string | null {
	if (!html) return null;
	// simple <img ... src="..."> matcher
	const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
	return m?.[1] ?? null;
}

function str(v: any): string {
	if (v == null) return '';
	if (typeof v === 'string') return v;
	if (typeof v === 'number') return String(v);
	if (typeof v === 'object' && typeof v['#text'] === 'string') return v['#text'];
	return '';
}

function arr<T>(v: any): T[] {
	if (!v) return [];
	return Array.isArray(v) ? v : [v];
}

function pickFirst<T>(xs: T[]): T | undefined {
	return xs.length ? xs[0] : undefined;
}
