import type { PageServerLoad } from './$types';
import type { Article } from '$lib/types';

function dedupeByUrl(items: Article[]): Article[] {
	const seen = new Set<string>();
	const out: Article[] = [];
	for (const it of items) {
		if (!seen.has(it.url)) {
			seen.add(it.url);
			out.push(it);
		}
	}
	return out;
}

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const rssRes = await fetch('/api/news?scope=all&size=24');
	const { items: rssItems } = await rssRes.json();

	let all: Article[] = rssItems ?? [];

	if (locals?.flags?.enableX) {
		try {
			const xr = await fetch('/api/x-news?limit=40');
			const { items: xItems } = await xr.json();
			all = dedupeByUrl([...(rssItems ?? []), ...(xItems ?? [])]);
		} catch {
			/* ignore */
		}
	}

	return {
		hero: all[0] ?? null,
		items: all.slice(1),
		fetchedAt: Date.now()
	};
};
