// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';
import type { Article } from '$lib/types';
import { resolveOgImage } from '$lib/server/enrich/ogImage';

const stripMdLinks = (s?: string | null): string | undefined =>
	s?.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1');

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const size = 60;

	// 1) RSS pools
	const [kr, gr] = await Promise.all([
		fetch(`/api/news?scope=kenya&size=${size}`),
		fetch(`/api/news?scope=global&size=${size}`)
	]);
	const kjson = (await kr.json()) as { items?: Article[] };
	const gjson = (await gr.json()) as { items?: Article[] };

	let kenya: Article[] = kjson.items ?? [];
	const globalItems: Article[] = gjson.items ?? [];

	// 2) X sidecar merge (Kenyan-first). Do NOT require images.
	if (locals.flags?.enableX) {
		try {
			const xr = await fetch('/api/x-news?limit=40');
			const xjson = (await xr.json()) as { items?: Article[] };
			const xItems: Article[] = xjson.items ?? [];

			const used = new Set(kenya.map((a) => a.url));
			const xNew: Article[] = xItems
				.filter((x) => x?.url && !used.has(x.url))
				.map((x) => ({
					...x,
					title: stripMdLinks(x.title) ?? x.title,
					excerpt: stripMdLinks(x.excerpt) ?? x.excerpt
				}));

			if (xNew.length) kenya = [...xNew, ...kenya];
		} catch (e) {
			console.error('[x-news] merge error', e);
		}
	}

	// 3) Lead + right rail
	const lead = kenya[0] ?? globalItems[0] ?? null;
	const usedUrls = new Set<string>(lead ? [lead.url] : []);
	const rightRail: Article[] = [];

	for (const k of kenya.slice(1)) {
		if (rightRail.length >= 3) break;
		if (!usedUrls.has(k.url)) {
			rightRail.push(k);
			usedUrls.add(k.url);
		}
	}
	if (rightRail.length < 3) {
		for (const g of globalItems) {
			if (rightRail.length >= 3) break;
			if (!usedUrls.has(g.url)) {
				rightRail.push(g);
				usedUrls.add(g.url);
			}
		}
	}

	// 4) Main stream (Kenya remainder → Global), with dedupe
	const seen = new Set<string>([...usedUrls]);
	const main: Article[] = [];
	for (const it of [...kenya.slice(1), ...globalItems]) {
		if (!seen.has(it.url)) {
			seen.add(it.url);
			main.push(it);
		}
	}

	// 5) Enrich above-the-fold images (lead + rail + first 18 from main)
	const toEnrich: Article[] = [];
	if (lead) toEnrich.push(lead);
	toEnrich.push(...rightRail, ...main.slice(0, 18));

	await Promise.all(
		toEnrich
			.filter((a) => a && !a.image)
			.map(async (a) => {
				const img = await resolveOgImage(a.url);
				if (img) a.image = img;
			})
	);

	return { lead, rightRail, main, fetchedAt: Date.now() };
};
