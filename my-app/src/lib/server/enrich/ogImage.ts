// Robust OG/Twitter/JSON-LD image resolver with TTL cache + screenshot fallback
const CACHE = new Map<string, { value: string | null; exp: number }>();
const TTL_MS = 1000 * 60 * 60 * 6; // 6h

function abs(base: string, maybe?: string | null) {
	if (!maybe) return null;
	try {
		return new URL(maybe, base).href;
	} catch {
		return null;
	}
}

function meta(html: string, nameOrProp: string) {
	// <meta property="og:image" content="..."> or <meta name="twitter:image" ...>
	const re = new RegExp(
		`<meta[^>]+(?:property|name)=["']${nameOrProp}["'][^>]*content=["']([^"']+)["']`,
		'i'
	);
	const m = html.match(re);
	return m ? m[1] : null;
}

function linkRel(html: string, rel: string) {
	const re = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]*href=["']([^"']+)["']`, 'i');
	const m = html.match(re);
	return m ? m[1] : null;
}

function firstStr(v: any): string | null {
	if (!v) return null;
	if (typeof v === 'string') return v;
	if (Array.isArray(v)) return firstStr(v[0]);
	if (typeof v === 'object') return firstStr(v.url || v.contentUrl || v.thumbnailUrl);
	return null;
}

function imagesFromJsonLD(html: string): string[] {
	const imgs: string[] = [];
	const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
	let m: RegExpExecArray | null;
	while ((m = re.exec(html))) {
		try {
			const data = JSON.parse(m[1]);
			const arr = Array.isArray(data) ? data : [data];
			for (const node of arr) {
				const t = (node?.['@type'] || node?.type || '').toString().toLowerCase();
				if (!t || !/article|news|blog|creativework|webpage/.test(t)) {
					// still try generic nodes for image fields
				}
				const candidate =
					firstStr(node?.image) ||
					firstStr(node?.thumbnailUrl) ||
					firstStr(node?.primaryImageOfPage) ||
					firstStr(node?.associatedMedia);
				if (candidate) imgs.push(candidate);
			}
		} catch {
			/* ignore bad JSON-LD */
		}
	}
	return imgs;
}

function screenshot(url: string, w = 1200) {
	// Free screenshot fallback (no key). Fine for dev; replace if you want your own service later.
	return `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=${w}`;
}

export async function resolveOgImage(url: string, timeoutMs = 9000): Promise<string | null> {
	const now = Date.now();
	const hit = CACHE.get(url);
	if (hit && hit.exp > now) return hit.value;

	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), timeoutMs);

	try {
		const res = await fetch(url, {
			redirect: 'follow',
			signal: ctrl.signal,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
				Accept: 'text/html,application/xhtml+xml'
			}
		});
		const html = await res.text();

		// 1) Common metas
		const keys = [
			'og:image:secure_url',
			'og:image:url',
			'og:image',
			'twitter:image:src',
			'twitter:image'
		];
		for (const k of keys) {
			const v = abs(url, meta(html, k));
			if (v) {
				CACHE.set(url, { value: v, exp: now + TTL_MS });
				return v;
			}
		}

		// 2) <link rel="image_src">, parsely, etc.
		const rel = abs(url, linkRel(html, 'image_src'));
		if (rel) {
			CACHE.set(url, { value: rel, exp: now + TTL_MS });
			return rel;
		}
		const parsely = abs(url, meta(html, 'parsely-image'));
		if (parsely) {
			CACHE.set(url, { value: parsely, exp: now + TTL_MS });
			return parsely;
		}

		// 3) JSON-LD
		const ld = imagesFromJsonLD(html)
			.map((s) => abs(url, s))
			.find(Boolean);
		if (ld) {
			CACHE.set(url, { value: ld!, exp: now + TTL_MS });
			return ld!;
		}

		// 4) Last-resort screenshot
		const shot = screenshot(url);
		CACHE.set(url, { value: shot, exp: now + TTL_MS / 2 });
		return shot;
	} catch {
		// short negative cache
		CACHE.set(url, { value: null, exp: now + TTL_MS / 4 });
		return null;
	} finally {
		clearTimeout(timer);
	}
}
