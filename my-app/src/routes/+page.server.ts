import type { PageServerLoad } from './$types';
import type { Article } from '$lib/types';
import { resolveOgImage } from '$lib/server/enrich/ogImage';

type Kind = 'rss' | 'x';
type A = Article & { origin: Kind };

const tag = (list: Article[] | undefined, origin: Kind): A[] =>
	(list ?? []).map((a) => ({ ...a, origin }));

const KENYAN_DOMAINS = [
	'citizen.digital',
	'kbc.co.ke',
	'k24tv.co.ke',
	'standardmedia.co.ke',
	'nation.africa',
	'businessdailyafrica.com',
	'people.co.ke',
	'capitalfm.co.ke',
	'the-star.co.ke',
	'nairobinews.nation.africa',
	'kenyans.co.ke',
	'ntvkenya.co.ke',
	'tuko.co.ke'
];

const isKenyan = (url: string) => {
	try {
		const host = new URL(url).hostname.replace(/^www\./, '');
		return KENYAN_DOMAINS.some((d) => host.endsWith(d));
	} catch {
		return false;
	}
};

const stripMdLinks = (s?: string | null): string | undefined =>
	s?.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1');

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const size = 60;

	// 1) Fetch RSS pools
	const [kr, gr] = await Promise.all([
		fetch(`/api/news?scope=kenya&size=${size}`),
		fetch(`/api/news?scope=global&size=${size}`)
	]);
	const kjson = (await kr.json()) as { items?: Article[] };
	const gjson = (await gr.json()) as { items?: Article[] };

	const rssKenya: A[] = tag(kjson.items, 'rss');
	const rssGlobal: A[] = tag(gjson.items, 'rss');

	// 2) Fetch X once, then split into Kenya/Global
	const xKenya: A[] = [];
	const xGlobal: A[] = [];
	if (locals.flags?.enableX) {
		try {
			const xr = await fetch('/api/x-news?limit=60');
			const xj = (await xr.json()) as { items?: Article[] };
			const allX = tag(xj.items, 'x').map((x) => ({
				...x,
				title: stripMdLinks(x.title) ?? x.title,
				excerpt: stripMdLinks(x.excerpt) ?? x.excerpt
			}));

			const seenX = new Set<string>();
			for (const it of allX) {
				if (!it.url || seenX.has(it.url)) continue;
				seenX.add(it.url);
				(isKenyan(it.url) ? xKenya : xGlobal).push(it);
			}
		} catch (e) {
			console.warn('[x] sidecar merge skipped:', e);
		}
	}

	// 3) Master buckets in the required order
	const buckets: A[][] = [rssKenya, xKenya, rssGlobal, xGlobal];

	// 4) Build hero + right rail with RSS preference naturally via bucket order
	const used = new Set<string>();
	const pickNext = (): A | null => {
		for (const b of buckets) {
			while (b.length) {
				const it = b.shift()!;
				if (it.url && !used.has(it.url)) {
					used.add(it.url);
					return it;
				}
			}
		}
		return null;
	};

	const lead = pickNext();
	const rightRail: A[] = [];
	while (rightRail.length < 3) {
		const n = pickNext();
		if (!n) break;
		rightRail.push(n);
	}

	// 5) Main stream in order: [Kenya RSS]→[Kenya X]→[Global RSS]→[Global X]
	const main: A[] = [];
	while (true) {
		const n = pickNext();
		if (!n) break;
		main.push(n);
	}

	// 6) Enrich above-the-fold with images (lead + rail + first N)
	const enrich: A[] = [];
	if (lead) enrich.push(lead);
	enrich.push(...rightRail, ...main.slice(0, 18));

	await Promise.all(
		enrich
			.filter((a) => !a.image)
			.map(async (a) => {
				const img = await resolveOgImage(a.url);
				if (img) a.image = img;
			})
	);

	return {
		lead,
		rightRail,
		main,
		fetchedAt: Date.now()
	};
};
