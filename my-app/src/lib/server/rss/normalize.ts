import type { Article } from '$lib/types';
import type { ParsedItem } from './parse';
import { classifyCategory } from '$lib/utils/categories';
import { htmlToText } from '$lib/utils/sanitize';
import { summarize } from '$lib/utils/summarize';
import { toISO } from '$lib/utils/dates';

export function itemsToArticles(opts: {
	sourceId: string; // e.g. 'rss:nation'
	sourceLabel: string; // 'Nation'
	parsed: ParsedItem[];
}): Article[] {
	const { sourceId, sourceLabel, parsed } = opts;

	return parsed
		.map((p) => {
			const url = (p.link || '').trim();
			if (!url) return null;

			const title = (p.title || '').trim();
			if (!title) return null;

			const text = p.description ? htmlToText(p.description) : '';
			const excerpt = text ? summarize(text, 260) : null;

			const cat = classifyCategory(`${title} ${text}`) ?? null;

			return {
				id: `rss:${hash(url)}`,
				source: sourceId as any,
				title,
				url,
				image: null,
				excerpt,
				category: cat,
				publishedAt: toISO(p.publishedAt ?? Date.now()),
				author: p.author ?? null
			} satisfies Article;
		})
		.filter(Boolean) as Article[];
}

function hash(s: string): string {
	let h = 2166136261 >>> 0;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return (h >>> 0).toString(36);
}
