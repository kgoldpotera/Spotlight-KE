import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const limit = Number(url.searchParams.get('limit') ?? '40');
	const base = env.X_SIDECAR_BASE;
	if (!base) {
		return new Response(JSON.stringify({ items: [], fetchedAt: Date.now() }), {
			headers: { 'content-type': 'application/json', 'x-sidecar': 'missing' }
		});
	}
	try {
		const r = await fetch(`${base.replace(/\/$/, '')}/api/x-news?limit=${limit}`);
		const data = await r.json();
		return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
	} catch (e: any) {
		return new Response(
			JSON.stringify({ items: [], fetchedAt: Date.now(), error: e?.message ?? 'sidecar error' }),
			{
				status: 200,
				headers: { 'content-type': 'application/json', 'x-sidecar': 'error' }
			}
		);
	}
};
