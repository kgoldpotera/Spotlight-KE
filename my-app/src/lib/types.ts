export type Category =
	| 'Top'
	| 'Business'
	| 'Sports'
	| 'Tech'
	| 'Health'
	| 'Entertainment'
	| 'Politics';

export type Scope = 'kenya' | 'global' | 'all';
export type SourceId = `rss:${string}` | `x:${string}` | `manual:${string}`;

export interface Article {
	id: string;
	source: SourceId;
	title: string;
	url: string;
	image?: string | null;
	excerpt?: string | null;
	category?: Category | null;
	publishedAt: string; // ISO
	author?: string | null;
}

export interface NewsResponse {
	items: Article[];
	total?: number;
	fetchedAt: number; // ms epoch
}

export interface FeedSource {
	id: string;
	label: string;
	url: string;
	active: boolean;
	ttlMs?: number;
	scope: Exclude<Scope, 'all'>;
}
