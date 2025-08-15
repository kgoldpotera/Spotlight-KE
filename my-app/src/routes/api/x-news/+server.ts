import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const base = env.X_SIDECAR_BASE;
	const limit = Number(url.searchParams.get('limit') ?? '40');
	const usernames = url.searchParams.getAll('usernames'); // optional passthrough

	if (!base) {
		return new Response(JSON.stringify({ items: [], fetchedAt: Date.now() }), {
			headers: { 'content-type': 'application/json', 'x-sidecar': 'missing' }
		});
	}

	const qs = new URLSearchParams({ limit: String(limit) });
	for (const u of usernames) qs.append('usernames', u);

	const r = await fetch(`${base.replace(/\/$/, '')}/api/x-news?${qs.toString()}`);
	const data = await r.json();
	return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
};
