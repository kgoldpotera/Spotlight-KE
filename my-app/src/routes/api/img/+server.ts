import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const src = url.searchParams.get('url');
	if (!src) return new Response('missing url', { status: 400 });

	const u = new URL(src);
	// helpful Referer for sites that block hotlinking
	const referer = `${u.protocol}//${u.hostname}/`;

	const r = await fetch(src, {
		headers: {
			'User-Agent': 'Mozilla/5.0',
			Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
			Referer: referer
		},
		redirect: 'follow'
	}).catch(() => null);

	if (!r || !r.ok) return new Response('fetch failed', { status: 502 });

	setHeaders({
		'cache-control': 'public, max-age=86400',
		'content-type': r.headers.get('content-type') ?? 'image/jpeg'
	});
	return new Response(r.body);
};
