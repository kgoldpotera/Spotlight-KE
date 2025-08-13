import type { Handle } from '@sveltejs/kit';
import { PUBLIC_ENABLE_OG_ENRICH, PUBLIC_ENABLE_X_NEWS } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.flags = {
		enableX: (PUBLIC_ENABLE_X_NEWS ?? 'false') === 'true',
		enableOG: (PUBLIC_ENABLE_OG_ENRICH ?? 'true') === 'true'
	};

	const response = await resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-type'
	});

	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	return response;
};
