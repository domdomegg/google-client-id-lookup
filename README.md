# google-client-id-lookup [(view live)](https://adamjones.me/google-client-id-lookup/)

Web app that can find the app behind a given Google Client ID (such as 12345.apps.googleusercontent.com)

| Home Page | Results Page |
|------------|--------------|
| ![Home Page](docs/home-page.png) | ![Results Page](docs/results-page.png) |

## How it works

The Google OAuth error pages previously provided hidden data about the app when provided a client ID for debugging purposes. This app attempts to fetch those pages, scrape the data and display the app information in a nice way.

**⚠️ Current Status:** As of 2025, Google requires a proper browser `User-Agent` header to return OAuth pages with embedded app data. Without this header, Google returns a JavaScript-rendered page where the `data-client-auth-config-brand` attribute contains template code (e.g., `'+_.G(_.qg(e))+'`) instead of actual data.

**This tool no longer works** because:
- It runs entirely in the browser (client-side)
- Browsers cannot send custom headers to Google due to CORS restrictions
- CORS proxies (like corsproxy.io) strip the `User-Agent` header

**To fix this tool**, it would need to be converted to use a backend server that can:
- Send requests to Google with a proper browser `User-Agent` header
- Bypass CORS restrictions
- Alternatively, use a headless browser solution (Puppeteer/Playwright)

This tool is subject to breaking changes whenever Google updates their OAuth sign-in pages.

## Contributing

Pull requests are welcomed on GitHub! To get started:

1. Install Git and Node.js
2. Clone the repository
3. Install dependencies with `npm install`
4. Run the app with `npm start`
5. Run `npm run test` to run tests
6. Build with `npm run build`

## Releases

Commits to the master branch are automatically published to GitHub Pages.
