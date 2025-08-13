import { PUBLIC_APP_NAME, PUBLIC_ENABLE_OG_ENRICH, PUBLIC_ENABLE_X_NEWS } from '$env/static/public';

export const APP_NAME = PUBLIC_APP_NAME || 'SPOTLIGHT-KE';
export const DEFAULT_PAGE_SIZE = 24;

export const ENABLE_X_DEFAULT = (PUBLIC_ENABLE_X_NEWS ?? 'false') === 'true';
export const ENABLE_OG_DEFAULT = (PUBLIC_ENABLE_OG_ENRICH ?? 'true') === 'true';

export const CATEGORIES = [
	'Top',
	'Business',
	'Sports',
	'Tech',
	'Health',
	'Entertainment',
	'Politics'
] as const;
export type CategorySlug = 'business' | 'sports' | 'tech' | 'health' | 'entertainment' | 'politics';
