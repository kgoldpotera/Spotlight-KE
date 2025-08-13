import type { PageServerLoad } from './$types';
import { SLUG_TO_CAT } from '$lib/utils/cat-slug';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';

export const load: PageServerLoad = async ({ params, url, fetch }) => {
	const slug = params.section.toLowerCase();
	const category = SLUG_TO_CAT[slug];
	const page = Number(url.searchParams.get('page') ?? '1');
	const size = Number(url.searchParams.get('size') ?? DEFAULT_PAGE_SIZE);

	if (!category) return { category: null, items: [], page, size };

	const r = await fetch(
		`/api/news?scope=all&category=${encodeURIComponent(category)}&page=${page}&size=${size}`
	);
	const { items } = await r.json();

	return { category, items, page, size };
};
