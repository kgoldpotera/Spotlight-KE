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
		if (positions.includes(i + 1)) {
			out.push({ kind: 'ad', id: `ad-home-${adIndex++}`, label: 'Sponsored' });
		}
	}
	return out;
}

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const size = 60;

	// 1) Fetch Kenya + Global RSS
	const [kr, gr] = await Promise.all([
		fetch(`/api/news?scope=kenya&size=${size}`),
		fetch(`/api/news?scope=global&size=${size}`)
	]);

	let { items: kenya } = await kr.json();
	const { items: global } = await gr.json();

	kenya = (kenya ?? []) as Article[];
	const globalItems = (global ?? []) as Article[];

	// 2) Merge X items (Kenyan-first): prepend them to the Kenya pool
	if (locals?.flags?.enableX) {
		try {
			const xr = await fetch('/api/x-news?limit=40');
			const { items: xItems } = await xr.json();
			const used = new Set<string>(kenya.map((a: any) => a.url));
			const xNew = (xItems ?? []).filter((x: any) => x?.url && !used.has(x.url));
			kenya = [...xNew, ...kenya];
		} catch (e) {
			console.error('[x-news] merge error', e);
		}
	}

	// 3) Lead prefers Kenyan; else fallback to global
	const lead = kenya[0] ?? globalItems[0] ?? null;

	// 4) Right rail: up to 3 Kenyan after lead, top up with global if short
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
		for (const g of globalItems) {
			if (rail.length >= 3) break;
			if (!usedUrls.has(g.url)) {
				rail.push(g);
				usedUrls.add(g.url);
			}
		}
	}

	// 5) Main stream: remaining Kenya first, then Global (no dups)
	const remKenya = kenya.filter((a: any) => !usedUrls.has(a.url));
	const remGlobal = globalItems.filter((a: any) => !usedUrls.has(a.url));
	const merged = dedupe([...remKenya, ...remGlobal]);

	// Sprinkle ad placeholders
	const main = injectAds(merged, [6, 13]);

	return { lead, rightRail: rail, main, fetchedAt: Date.now() };
};
