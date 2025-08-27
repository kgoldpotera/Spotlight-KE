// src/lib/server/enrich/ogImage.ts
const UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

function firstMatch(re: RegExp, s: string): string | null {
	const m = re.exec(s);
	return m?.[1]?.trim() ?? null;
}

function absolutize(src: string, base: string): string {
	try {
		return new URL(src, base).href;
	} catch {
		return src;
	}
}

/** Try to find an OG/Twitter image. Fallback to a page screenshot (mShots). */
export async function resolveOgImage(url: string): Promise<string | null> {
	try {
		const ac = new AbortController();
		const t = setTimeout(() => ac.abort(), 6000);

		const res = await fetch(url, {
			headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
			redirect: 'follow',
			signal: ac.signal
		});

		clearTimeout(t);
		const finalUrl = res.url || url;
		const html = await res.text();

		// Look for common tags
		const og =
			firstMatch(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i, html) ||
			firstMatch(/<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["']/i, html) ||
			firstMatch(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i, html) ||
			firstMatch(/<meta[^>]+property=["']twitter:image["'][^>]+content=["']([^"']+)["']/i, html);

		if (og) return absolutize(og, finalUrl);

		// domain-agnostic screenshot fallback
		return `https://s0.wp.com/mshots/v1/${encodeURIComponent(finalUrl)}?w=1200`;
	} catch {
		return `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=1200`;
	}
}
