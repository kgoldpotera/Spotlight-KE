import type { Category } from '$lib/types';

export const CAT_TO_SLUG: Record<Exclude<Category, 'Top'>, string> = {
	Business: 'business',
	Sports: 'sports',
	Tech: 'tech',
	Health: 'health',
	Entertainment: 'entertainment',
	Politics: 'politics'
};

export const SLUG_TO_CAT: Record<string, Category> = Object.entries(CAT_TO_SLUG).reduce(
	(acc, [k, v]) => {
		acc[v] = k as Category;
		return acc;
	},
	{} as Record<string, Category>
);
