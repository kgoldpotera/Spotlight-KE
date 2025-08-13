import { writable } from 'svelte/store';
import { ENABLE_OG_DEFAULT, ENABLE_X_DEFAULT } from '$lib/constants';

export const enableX = writable<boolean>(ENABLE_X_DEFAULT);
export const enableOG = writable<boolean>(ENABLE_OG_DEFAULT);
