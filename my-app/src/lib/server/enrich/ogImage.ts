import { getCache } from '$lib/server/cache';

const UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 SPOTLIGHT-KE/0.1';

const HTML_TIMEOUT_MS = 8000;
const MAX_BYTES = 400_000; // read at most ~400KB; enough for <head>

export async function resolveOGImage(articleUrl: string): Promise<string | null> {
	const cache = getCache();
	const key = `og:${articleUrl}`;
	const cached = await cache.get<string | null>(key);
	if (cached !== undefined) return cached ?? null; // cached null means "no image"

	try {
		const html = await fetchPartialHtml(articleUrl);
		if (!html) {
			await cache.set(key, null, 6 * 60 * 60);
			return null;
		}

		const base = new URL(articleUrl);
		const cand =
			fromMeta(html, /<meta[^>]+property=["']og:image["'][^>]*>/i) ||
			fromMeta(html, /<meta[^>]+name=["']og:image["'][^>]*>/i) ||
			fromMeta(html, /<meta[^>]+property=["']twitter:image["'][^>]*>/i) ||
			fromLink(html, /<link[^>]+rel=["']image_src["'][^>]*>/i) ||
			fromJsonLd(html);

		if (!cand) {
			await cache.set(key, null, 6 * 60 * 60);
			return null;
		}

		const abs = toAbsolute(cand, base);
		if (!abs) {
			await cache.set(key, null, 6 * 60 * 60);
			return null;
		}

		// Optional: quick HEAD to ensure it’s an image (ignore errors)
		try {
			const head = await fetch(abs, { method: 'HEAD' });
			const ct = head.headers.get('content-type') || '';
			if (ct && !/^image\//i.test(ct)) {
				// not an image; keep URL anyway (some hosts block HEAD)
			}
		} catch {
			// ignore
		}

		await cache.set(key, abs, 24 * 60 * 60);
		return abs;
	} catch {
		await cache.set(key, null, 6 * 60 * 60);
		return null;
	}
}

async function fetchPartialHtml(url: string): Promise<string | null> {
	const controller = new AbortController();
	const t = setTimeout(() => controller.abort(), HTML_TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			headers: {
				'user-agent': UA,
				accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'
			},
			redirect: 'follow',
			signal: controller.signal
		});
		if (!res.ok) return null;

		// Read only first MAX_BYTES
		if (!res.body) return await res.text();
		const reader = res.body.getReader();
		const chunks: Uint8Array[] = [];
		let total = 0;
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			if (value) {
				chunks.push(value);
				total += value.byteLength;
				if (total >= MAX_BYTES) break;
			}
		}
		return new TextDecoder().decode(concat(chunks, total));
	} catch {
		return null;
	} finally {
		clearTimeout(t);
	}
}

function concat(chunks: Uint8Array[], total: number) {
	const out = new Uint8Array(total);
	let o = 0;
	for (const c of chunks) {
		out.set(c, o);
		o += c.byteLength;
	}
	return out;
}

function fromMeta(html: string, tagRe: RegExp): string | null {
	const m = html.match(tagRe);
	if (!m) return null;
	const tag = m[0];
	const cm = tag.match(/\scontent=["']([^"']+)["']/i);
	return cm ? cm[1] : null;
}

function fromLink(html: string, tagRe: RegExp): string | null {
	const m = html.match(tagRe);
	if (!m) return null;
	const tag = m[0];
	const hm = tag.match(/\shref=["']([^"']+)["']/i);
	return hm ? hm[1] : null;
}

function fromJsonLd(html: string): string | null {
	const scripts = html.match(
		/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi
	);
	if (!scripts) return null;
	for (const s of scripts) {
		const json = s.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
		try {
			const obj = JSON.parse(json);
			// Look for .image or .image.url or NewsArticle.image
			const img =
				obj?.image?.url ||
				(Array.isArray(obj?.image) ? obj.image[0] : obj?.image) ||
				obj?.thumbnailUrl ||
				obj?.primaryImageOfPage?.url;
			if (typeof img === 'string' && img) return img;
		} catch {
			/* ignore json errors */
		}
	}
	return null;
}

function toAbsolute(u: string, base: URL): string | null {
	try {
		if (/^data:/i.test(u)) return null;
		return new URL(u, base).toString();
	} catch {
		return null;
	}
}
