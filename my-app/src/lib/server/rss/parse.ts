import { XMLParser } from 'fast-xml-parser';

export interface ParsedItem {
	title: string;
	link: string;
	publishedAt?: string;
	description?: string;
	author?: string;
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
		return items.map(fromRssItem).filter((x): x is ParsedItem => !!x?.link && !!x?.title);
	}

	// Atom
	if (root?.feed?.entry) {
		const entries = Array.isArray(root.feed.entry) ? root.feed.entry : [root.feed.entry];
		return entries.map(fromAtomEntry).filter((x): x is ParsedItem => !!x?.link && !!x?.title);
	}

	// Some feeds nest differently; try a best-effort scan
	const channel = root?.channel;
	if (channel?.item) {
		const items = Array.isArray(channel.item) ? channel.item : [channel.item];
		return items.map(fromRssItem).filter((x): x is ParsedItem => !!x?.link && !!x?.title);
	}

	return [];
}

function fromRssItem(it: any): ParsedItem {
	const title = str(it.title);
	const link = str(it.link) || str(it?.guid?.['#text']) || '';
	const publishedAt =
		str(it.pubDate) || str(it?.['dc:date']) || str(it?.['dc:date.issued']) || undefined;
	const description = str(it.description) || str(it?.['content:encoded']) || undefined;
	const author = str(it?.author) || str(it?.['dc:creator']) || undefined;

	return { title, link, publishedAt, description, author };
}

function fromAtomEntry(en: any): ParsedItem {
	const title = str(en.title?.['#text'] ?? en.title) || '';
	const link = pickAtomLink(en.link);
	const publishedAt = str(en.updated) || str(en.published) || undefined;
	const description =
		str(en.summary?.['#text'] ?? en.summary) ||
		str(en.content?.['#text'] ?? en.content) ||
		undefined;
	const author = str(en.author?.name ?? en.author) || undefined;

	return { title, link, publishedAt, description, author };
}

function pickAtomLink(link: any): string {
	if (!link) return '';
	if (typeof link === 'string') return link;
	const arr = Array.isArray(link) ? link : [link];
	const alt = arr.find((l) => (l['@_rel'] ?? 'alternate') === 'alternate' && !!l['@_href']);
	return (alt?.['@_href'] ?? arr[0]?.['@_href'] ?? arr[0]) || '';
}

function str(v: any): string {
	if (v == null) return '';
	if (typeof v === 'string') return v;
	if (typeof v === 'number') return String(v);
	if (typeof v === 'object') {
		if (typeof v['#text'] === 'string') return v['#text'];
	}
	return '';
}
