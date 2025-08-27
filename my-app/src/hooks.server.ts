// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
	// Read from env; any of these can be used in your .env
	// ENABLE_X_NEWS=true or PUBLIC_ENABLE_X_NEWS=true
	const enableX =
		String(env.ENABLE_X_NEWS ?? env.PUBLIC_ENABLE_X_NEWS ?? 'false').toLowerCase() === 'true';

	event.locals.flags = { enableX };
	return resolve(event);
};
