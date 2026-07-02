# Proxy worker

A tiny Cloudflare Worker the web app uses to fetch Google's OAuth error page.

Public CORS proxies can't do this job: browsers force-attach `Sec-Fetch-Site: cross-site` to cross-site fetches (JavaScript cannot remove it), pass-through proxies forward it to Google, and Google responds 403. This worker instead makes its own clean request with a browser-like `User-Agent`, so it works regardless of what the browser sends. It only proxies `https://accounts.google.com/signin/oauth/error*` URLs.

## Deploy

```sh
cd worker
npx wrangler login   # one-time browser OAuth
npx wrangler deploy
```

Then put the printed URL (e.g. `https://google-client-id-lookup-proxy.<account>.workers.dev`) at the front of `corsProxies` in `src/pages/index.tsx`:

```ts
(url: string) => `https://google-client-id-lookup-proxy.<account>.workers.dev/?url=${encodeURIComponent(url)}`,
```

The free tier (100k requests/day) is far more than this tool needs.

## Caveat

Google may serve different content to Cloudflare datacenter IPs than to residential IPs — verify a lookup end-to-end after deploying.
