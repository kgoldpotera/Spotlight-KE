import type { FeedSource } from '$lib/types';

export const GLOBAL_SOURCES: FeedSource[] = [
	{
		id: 'rss:bbc-africa',
		label: 'BBC Africa',
		url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml',
		active: true,
		ttlMs: 300_000,
		scope: 'global'
	},
	{
		id: 'rss:reuters-top',
		label: 'Reuters Top',
		url: 'https://feeds.reuters.com/reuters/topNews',
		active: true,
		ttlMs: 300_000,
		scope: 'global'
	}
];
