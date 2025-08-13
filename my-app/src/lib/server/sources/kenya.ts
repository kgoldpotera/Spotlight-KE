import type { FeedSource } from '$lib/types';

export const KENYA_SOURCES: FeedSource[] = [
	{
		id: 'rss:kbc',
		label: 'KBC',
		url: 'https://www.kbc.co.ke/feed/',
		active: true,
		ttlMs: 300_000,
		scope: 'kenya'
	},
	{
		id: 'rss:citizen',
		label: 'Citizen TV',
		url: 'https://citizen.digital/feed/',
		active: true,
		ttlMs: 300_000,
		scope: 'kenya'
	},
	{
		id: 'rss:k24',
		label: 'K24',
		url: 'https://www.k24tv.co.ke/feed/',
		active: true,
		ttlMs: 300_000,
		scope: 'kenya'
	},
	{
		id: 'rss:star',
		label: 'The Star',
		url: 'https://www.the-star.co.ke/rss.xml',
		active: true,
		ttlMs: 300_000,
		scope: 'kenya'
	},
	{
		id: 'rss:capital',
		label: 'Capital FM',
		url: 'https://www.capitalfm.co.ke/news/feed/',
		active: true,
		ttlMs: 300_000,
		scope: 'kenya'
	}
	// Nation + Standard often rate-limit/redirect; add later once confirmed:
	// { id: 'rss:nation',   label: 'Nation',   url: 'https://nation.africa/kenya/rss', active: true, ttlMs: 300_000, scope: 'kenya' },
	// { id: 'rss:standard', label: 'Standard', url: 'https://www.standardmedia.co.ke/rss', active: true, ttlMs: 300_000, scope: 'kenya' },
];
