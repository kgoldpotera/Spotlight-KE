import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const base = env.X_SIDECAR_BASE; // e.g. http://127.0.0.1:8910
	const limit = String(url.searchParams.get('limit') ?? '40');
	const usernames = url.searchParams.getAll('usernames');

	if (!base) {
		return new Response(
			JSON.stringify({
				items: [],
				fetchedAt: Date.now(),
				note: 'X sidecar not configured'
			}),
			{ headers: { 'content-type': 'application/json' } }
		);
	}

	const qs = new URLSearchParams({ limit });
	usernames.forEach((u) => qs.append('usernames', u));

	const r = await fetch(`${base.replace(/\/$/, '')}/api/x-news?${qs.toString()}`);
	const data = await r.json();
	return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
};
