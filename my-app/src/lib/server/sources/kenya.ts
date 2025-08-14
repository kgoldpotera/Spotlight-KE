import type { FeedSource } from '$lib/types';

/**
 * Notes:
 * - WordPress sites expose /feed/ reliably (KBC, Citizen, K24, People Daily, Capital FM).
 * - Nation/BD/The Star expose RSS too; if any rate-limit, they’ll just be skipped for that run.
 * - You can toggle any source off in your admin later.
 */
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
		label: 'K24 TV',
		url: 'https://www.k24tv.co.ke/feed/',
		active: true,
		ttlMs: 300_000,
		scope: 'kenya'
	},
	{
		id: 'rss:capital',
		label: 'Capital FM News',
		url: 'https://www.capitalfm.co.ke/news/feed/',
		active: true,
		ttlMs: 300_000,
		scope: 'kenya'
	},
	{
		id: 'rss:people-daily',
		label: 'People Daily',
		url: 'https://www.pd.co.ke/feed/',
		active: true,
		ttlMs: 300_000,
		scope: 'kenya'
	},

	// These often work but may occasionally redirect/rate-limit:
	{
		id: 'rss:the-star',
		label: 'The Star',
		url: 'https://www.the-star.co.ke/rss.xml',
		active: true,
		ttlMs: 600_000,
		scope: 'kenya'
	},
	{
		id: 'rss:nation',
		label: 'Nation Africa',
		url: 'https://nation.africa/kenya/rss',
		active: true,
		ttlMs: 600_000,
		scope: 'kenya'
	},
	{
		id: 'rss:bd-africa',
		label: 'Business Daily',
		url: 'https://www.businessdailyafrica.com/bd/feeds/rss.xml',
		active: true,
		ttlMs: 600_000,
		scope: 'kenya'
	},
	{
		id: 'rss:nairobi-news',
		label: 'Nairobi News',
		url: 'https://nairobinews.nation.africa/feed/',
		active: true,
		ttlMs: 600_000,
		scope: 'kenya'
	},

	// Keep Standard off-by-default if it’s flaky in dev; enable when verified
	{
		id: 'rss:standard',
		label: 'The Standard',
		url: 'https://www.standardmedia.co.ke/rss',
		active: false,
		ttlMs: 900_000,
		scope: 'kenya'
	}
];
