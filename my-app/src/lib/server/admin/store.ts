import type { FeedSource } from '$lib/types';
import { KENYA_SOURCES } from '../sources/kenya';
import { GLOBAL_SOURCES } from '../sources/global';

const state = new Map<string, FeedSource>(
	[...KENYA_SOURCES, ...GLOBAL_SOURCES].map((s) => [s.id, s])
);

export function getSources(): FeedSource[] {
	return Array.from(state.values());
}
export function setSource(id: string, patch: Partial<FeedSource>): FeedSource | null {
	const cur = state.get(id);
	if (!cur) return null;
	const next = { ...cur, ...patch };
	state.set(id, next);
	return next;
}
