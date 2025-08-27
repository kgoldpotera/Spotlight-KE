// src/lib/server/rss/catalog.ts
// Returns a flat list of feed URLs by scope. We include native RSS where possible
// and add Google News domain-scoped fallbacks for outlets that block RSS or 403.

const GN = (domain: string, lang = 'en-KE', gl = 'KE', ceid = 'KE:en') =>
	`https://news.google.com/rss/search?q=site:${encodeURIComponent(domain)}&hl=${lang}&gl=${gl}&ceid=${ceid}`;

/** ——— KENYA ———
 * Direct RSS first (when known to work), then a Google News fallback.
 * Duplicates are fine — your pipeline dedupes by article URL.
 */
const KENYA_FEEDS: string[] = [
	// Citizen Digital (WP RSS can be temperamental; GN fallback added)
	'https://citizen.digital/feed/',
	GN('citizen.digital'),

	// KBC (WordPress; usually OK)
	'https://www.kbc.co.ke/feed/',
	GN('kbc.co.ke'),

	// K24
	'https://www.k24tv.co.ke/feed/',
	GN('k24tv.co.ke'),

	// Capital FM
	'https://www.capitalfm.co.ke/news/feed/',
	GN('capitalfm.co.ke'),

	// Nation group
	'https://nairobinews.nation.africa/feed/',
	GN('nairobinews.nation.africa'),
	// Nation Africa main often returns 403 to servers; keep GN fallback
	// 'https://nation.africa/kenya/rss', // often blocked
	GN('nation.africa'),

	// Business Daily (usually 403 from servers; GN fallback)
	// 'https://www.businessdailyafrica.com/bd/feeds/rss.xml',
	GN('businessdailyafrica.com'),

	// The Star (their RSS endpoints change; keep both guesses + GN)
	'https://www.the-star.co.ke/rss/',
	'https://www.the-star.co.ke/rss.xml',
	GN('the-star.co.ke'),

	// Standard Media / KTN / The Standard
	// Many sections have section feeds: https://www.standardmedia.co.ke/rss/kenya.xml etc.
	'https://www.standardmedia.co.ke/rss/kenya.xml',
	'https://www.standardmedia.co.ke/rss/politics.xml',
	GN('standardmedia.co.ke'),

	// People Daily
	'https://www.pd.co.ke/feed/',
	GN('pd.co.ke'),

	// Kenyans.co.ke
	// If native feed is unavailable, GN works well:
	// 'https://www.kenyans.co.ke/rss.xml',
	GN('kenyans.co.ke'),

	// Tuko
	// 'https://www.tuko.co.ke/rss', // may exist, often blocked; GN fallback:
	GN('tuko.co.ke'),

	// NTV (site moves often; GN robust)
	GN('ntv.co.ke'),
	GN('ntvkenya.co.ke'),

	// People.co.ke (Nation/People brand)
	GN('people.co.ke'),

	// Mpasho (entertainment; Kenyan audience)
	GN('mpasho.co.ke'),

	// Pulse Live Kenya
	// 'https://www.pulselive.co.ke/rss', // sometimes available; add GN too:
	GN('pulselive.co.ke'),

	// The EastAfrican (regional; often 403 from server — keep GN)
	// 'https://www.theeastafrican.co.ke/tea/rss.xml',
	GN('theeastafrican.co.ke'),

	// The Elephant (Kenyan longform, WordPress)
	'https://www.theelephant.info/feed/',
	GN('theelephant.info'),

	// Tech (Kenya-based)
	'https://techweez.com/feed/',
	GN('techweez.com'),

	// KahawaTungu (blog)
	'https://www.kahawatungu.com/feed/',
	GN('kahawatungu.com'),

	// AllAfrica Kenya stream (RDF) — very reliable
	'https://allafrica.com/tools/headlines/rdf/kenya/headlines.rdf'
];

/** ——— GLOBAL ——— (sample; keep yours or extend similarly) */
const GLOBAL_FEEDS: string[] = [
	// Reuters Top
	'https://feeds.reuters.com/reuters/topNews',
	// AP News World
	'https://apnews.com/hub/apf-topnews?utm_source=apnews.com&utm_medium=referral&utm_campaign=rss',
	// BBC World
	'http://feeds.bbci.co.uk/news/world/rss.xml',
	// Al Jazeera Top
	'https://www.aljazeera.com/xml/rss/all.xml',
	// Bloomberg (GN fallback tends to be better)
	GN('bloomberg.com'),
	// Financial Times (GN fallback)
	GN('ft.com'),
	// The Guardian (international)
	'https://www.theguardian.com/world/rss',
	// New York Times World (GN fallback is safer server-side)
	GN('nytimes.com'),
	// The Economist (GN fallback)
	GN('economist.com'),
	// TRT World
	'https://www.trtworld.com/rss',
	// Africanews
	'https://www.africanews.com/feed/rss',
	// Reuters Africa (helpful context)
	'https://feeds.reuters.com/reuters/africa'
];

export function getFeedUrls(scope: 'kenya' | 'global' | 'all'): string[] {
	if (scope === 'kenya') return KENYA_FEEDS;
	if (scope === 'global') return GLOBAL_FEEDS;
	return [...KENYA_FEEDS, ...GLOBAL_FEEDS];
}
