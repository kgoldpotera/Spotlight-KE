import type { RequestHandler } from './$types';
import { resolveOgImage } from '$lib/server/enrich/ogImage';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const target = url.searchParams.get('url');
	if (!target) return new Response('missing url', { status: 400 });

	const image = await resolveOgImage(target);
	setHeaders({
		'content-type': 'application/json',
		'cache-control': 'public, max-age=300, s-maxage=300'
	});
	return new Response(JSON.stringify({ image }));
};
