/* eslint-disable @next/next/no-img-element */
import Head from 'next/head';
import { useState } from 'react';

interface GoogleAppDetails {
  id: string;
  name: string;
  email: string;
  logoSrc?: string;
  website: string;
  termsUrls: string[];
  privacyUrls: string[];
}

const Home = () => {
  const [appDetails, setAppDetails] = useState<
  | { type: 'ready', id: string }
  | { type: 'loading' }
  | { type: 'error', error: Error }
  | { type: 'loaded', appDetails: GoogleAppDetails }
  >({ type: 'ready', id: '' });

  const onLookup = async (clientId: string) => {
    try {
      setAppDetails({ type: 'loading' });

      const response = await fetch(
        `https://corsproxy.io/?url=${encodeURIComponent(`https://accounts.google.com/signin/oauth/error/v2?client_id=${encodeURIComponent(clientId)}&flowName=GeneralOAuthFlow`)}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch app details');
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const element = doc.querySelector('[data-client-auth-config-brand]');

      if (!element) {
        throw new Error('Could not find app details');
      }

      const configStr = element.getAttribute('data-client-auth-config-brand');
      if (!configStr) {
        throw new Error('Could not find app configuration');
      }

      const parts = configStr.replace('%.@.', '').split(',');

      setAppDetails({
        type: 'loaded',
        appDetails: {
          id: parts[0],
          name: JSON.parse(parts[1]),
          logoSrc: JSON.parse(parts[2]),
          email: JSON.parse(parts[3]),
          website: JSON.parse(parts[4]),
          termsUrls: JSON.parse(parts[5]),
          privacyUrls: JSON.parse(parts[6]),
        },
      });
    } catch (error) {
      setAppDetails({
        type: 'error',
        error: error instanceof Error ? error : new Error('An unknown error occurred'),
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-16">
      <Head>
        <title>google-client-id-lookup</title>
      </Head>
      <h1 className="text-3xl font-bold mb-4">google-client-id-lookup</h1>
      <p className="mb-6">
        This tool can find the app details behind a given Google Client ID (such as
        12345.apps.googleusercontent.com).
      </p>

      {appDetails.type === 'ready' && (
        <div className="mb-6">
          <div className="shadow-sm border rounded-lg p-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Client ID"
                className="flex-1 px-3 border border-gray-300 rounded-md outline-none focus:ring-2 ring-gray-200 transition-all"
                value={appDetails.id}
                onChange={(e) => setAppDetails({ type: 'ready', id: e.target.value })}
              />
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 ring-blue-300 transition-all"
                onClick={() => onLookup(appDetails.id)}
              >
                Lookup
              </button>
            </div>
            <p className="mt-4">Just curious? <button type="button" onClick={() => setAppDetails({ type: 'ready', id: '606092904014-s1u3idjanlbhr4ns5b1hcjgfn63cr9nh.apps.googleusercontent.com' })} className="underline">Use an example</button>.</p>
          </div>
        </div>
      )}

      {appDetails.type === 'loading' && (
        <div className="mb-6 flex items-center gap-4 shadow-sm border rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-blue-500 border-transparent" />
          <span className="text-gray-600">Finding app details...</span>
        </div>
      )}

      {appDetails.type === 'error' && (
        <div className="mb-6 p-6 shadow bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 font-medium mb-1">Error occurred</div>
          <div className="text-red-600">{appDetails.error.message}</div>
          <p className="mt-4"><button type="button" onClick={() => setAppDetails({ type: 'ready', id: '' })} className="underline">Try again</button>.</p>
        </div>
      )}

      {appDetails.type === 'loaded' && (
        <div className="mb-6">
          <div className="shadow-sm border rounded-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              {appDetails.appDetails.logoSrc && (
                <img
                  src={appDetails.appDetails.logoSrc}
                  alt="App Logo"
                  className="w-20 h-20 shadow-sm border rounded-lg"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold">{appDetails.appDetails.name}</h2>
                <p className="text-gray-500 hover:underline"><a href={`mailto:${appDetails.appDetails.email}`}>{appDetails.appDetails.email}</a></p>
                <p className="text-blue-500 hover:underline">
                  <a
                    href={appDetails.appDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {appDetails.appDetails.website}
                  </a>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Terms of Service</h3>
                <ul className="list-disc ml-4 space-y-1">
                  {appDetails.appDetails.termsUrls.map((termsUrl) => (
                    <li key={termsUrl}>
                      <a
                        href={termsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {termsUrl}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-1">Privacy Policy</h3>
                <ul className="list-disc ml-4 space-y-1">
                  {appDetails.appDetails.privacyUrls.map((privacyUrl) => (
                    <li key={privacyUrl}>
                      <a
                        href={privacyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {privacyUrl}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <p className="mt-4">Want to lookup another app? <button type="button" onClick={() => setAppDetails({ type: 'ready', id: '' })} className="underline">Start over</button>.</p>
        </div>
      )}

      <p>
        This tool is open-source, and the code is available on <a href="https://github.com/domdomegg/google-client-id-lookup" className="underline">GitHub</a>.
      </p>
    </div>
  );
};

export default Home;
