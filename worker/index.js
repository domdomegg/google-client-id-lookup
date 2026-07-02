// Cloudflare Worker that fetches Google's OAuth error page with clean,
// browser-like headers and returns it with CORS headers.
//
// This exists because the lookup can't be done from the browser directly:
// - Google only serves the page with app details to browser-like User-Agents
// - Google rejects (403) requests carrying Sec-Fetch-Site: cross-site, which
//   browsers force-attach to cross-site fetches and JavaScript cannot remove,
//   so public pass-through CORS proxies that forward request headers all fail
//
// Deploy with: npx wrangler deploy (see worker/README.md)

const ALLOWED_PREFIX = 'https://accounts.google.com/signin/oauth/error';

export default {
	async fetch(request) {
		const url = new URL(request.url).searchParams.get('url');
		if (!url || !url.startsWith(ALLOWED_PREFIX)) {
			return new Response(`Bad request: url param must start with ${ALLOWED_PREFIX}`, {status: 400});
		}

		const upstream = await fetch(url, {
			redirect: 'follow',
			headers: {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'en',
			},
		});

		return new Response(upstream.body, {
			status: upstream.status,
			headers: {
				'Content-Type': upstream.headers.get('content-type') ?? 'text/html',
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': 'public, max-age=3600',
			},
		});
	},
};
