import type { PageServerLoad } from './$types';
import type { Article, ContentItem } from '$lib/types';

function dedupe(items: Article[]): Article[] {
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
function injectAds(items: Article[], positions: number[] = [6, 13]): ContentItem[] {
	const out: ContentItem[] = [];
	let adIndex = 1;
	for (let i = 0; i < items.length; i++) {
		out.push(items[i]);
		if (positions.includes(i + 1))
			out.push({ kind: 'ad', id: `ad-home-${adIndex++}`, label: 'Sponsored' });
	}
	return out;
}

export const load: PageServerLoad = async ({ fetch }) => {
	const size = 60;

	const [kr, gr] = await Promise.all([
		fetch(`/api/news?scope=kenya&size=${size}`),
		fetch(`/api/news?scope=global&size=${size}`)
	]);
	const { items: kenyaRaw } = await kr.json();
	const { items: globalRaw } = await gr.json();

	const kenya = (kenyaRaw ?? []) as Article[];
	const global = (globalRaw ?? []) as Article[];

	// Lead prefers Kenyan; else fallback to global
	const lead = kenya[0] ?? global[0] ?? null;

	// Build right rail: up to 3 Kenyan (excluding lead), then top up with global if needed
	const usedUrls = new Set<string>(lead ? [lead.url] : []);
	const rail: Article[] = [];
	for (const k of kenya.slice(1)) {
		if (rail.length >= 3) break;
		if (!usedUrls.has(k.url)) {
			rail.push(k);
			usedUrls.add(k.url);
		}
	}
	if (rail.length < 3) {
		for (const g of global) {
			if (rail.length >= 3) break;
			if (!usedUrls.has(g.url)) {
				rail.push(g);
				usedUrls.add(g.url);
			}
		}
	}

	// Main stream: remaining Kenya (unused), then global (unused)
	const remKenya = kenya.filter((a) => !usedUrls.has(a.url));
	const remGlobal = global.filter((a) => !usedUrls.has(a.url));
	const merged = dedupe([...remKenya, ...remGlobal]);

	const main = injectAds(merged, [6, 13]);

	return { lead, rightRail: rail, main, fetchedAt: Date.now() };
};
