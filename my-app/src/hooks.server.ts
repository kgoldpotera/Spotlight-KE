import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.flags = {
		enableX: String(env.PUBLIC_ENABLE_X_NEWS).toLowerCase() === 'true'
	};
	return resolve(event);
};
