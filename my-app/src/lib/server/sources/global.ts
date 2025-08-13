import type { FeedSource } from '$lib/types';

export const GLOBAL_SOURCES: FeedSource[] = [
	{
		id: 'rss:reuters',
		label: 'Reuters World',
		url: 'https://www.reuters.com/world/rss',
		active: true,
		ttlMs: 300_000,
		scope: 'global'
	}
];
