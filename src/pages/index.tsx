import Head from 'next/head';
import {useState} from 'react';

type GoogleAppDetails = {
	id: string;
	name: string;
	email?: string;
	logoSrc?: string;
	termsUrls: string[];
	privacyUrls: string[];
};

const googleErrorPageUrl = (clientId: string) => `https://accounts.google.com/signin/oauth/error?client_id=${encodeURIComponent(clientId)}&flowName=GeneralOAuthFlow`;

// Google's OAuth error page only includes app details when requested with a
// full browser User-Agent, and blocks cross-origin reads, so we go via public
// CORS proxies (which forward the browser's User-Agent). Tried in order.
const corsProxies = [
	(url: string) => `https://corsmirror.com/v1?url=${encodeURIComponent(url)}`,
	(url: string) => `https://proxy.cors.sh/${url}`,
	(url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

// App details are embedded in the page as AF_initDataCallback script chunks,
// e.g. AF_initDataCallback({key: 'ds:1', hash: '3', data:["Slack",
// ["https://slack.com/terms-of-service/user"],["https://slack.com/privacy-policy"],
// "help@slack-corp.com",2], sideChannel: {}})
const extractDataChunks = (html: string): unknown[] => {
	const chunks: unknown[] = [];
	const re = /AF_initDataCallback\(\{key: 'ds:\d+', hash: '\d+', data:(\[[\s\S]*?\]), sideChannel/g;
	for (const match of html.matchAll(re)) {
		try {
			chunks.push(JSON.parse(match[1]));
		} catch {
			// Skip chunks that aren't plain JSON
		}
	}

	return chunks;
};

const findBrandChunk = (chunks: unknown[]) => chunks.find((chunk): chunk is [string, string[], string[], unknown] => Array.isArray(chunk)
	&& typeof chunk[0] === 'string'
	&& Array.isArray(chunk[1])
	&& Array.isArray(chunk[2]));

const findLogoSrc = (value: unknown): string | undefined => {
	if (typeof value === 'string' && value.startsWith('https://lh3.googleusercontent.com/')) {
		return value;
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			const result = findLogoSrc(item);
			if (result !== undefined) {
				return result;
			}
		}
	}

	return undefined;
};

const Home = () => {
	const [appDetails, setAppDetails] = useState<
		| {type: 'ready'; id: string}
		| {type: 'loading'}
		| {type: 'error'; error: Error; id: string}
		| {type: 'loaded'; appDetails: GoogleAppDetails}
	>({type: 'ready', id: ''});

	const onLookup = async (clientId: string) => {
		try {
			setAppDetails({type: 'loading'});

			const targetUrl = googleErrorPageUrl(clientId);
			let sawGooglePage = false;

			// Proxies are fallbacks for each other, so must be tried one at a time
			/* eslint-disable no-await-in-loop */
			for (const proxy of corsProxies) {
				let html: string;
				try {
					const response = await fetch(proxy(targetUrl));
					if (!response.ok) {
						continue;
					}

					html = await response.text();
				} catch {
					continue;
				}

				if (!html.includes('AF_initDataCallback')) {
					// Proxy responded, but not with Google's full error page
					continue;
				}

				sawGooglePage = true;
				const chunks = extractDataChunks(html);
				const brand = findBrandChunk(chunks);
				if (!brand) {
					continue;
				}

				setAppDetails({
					type: 'loaded',
					appDetails: {
						id: clientId,
						name: brand[0],
						termsUrls: brand[1],
						privacyUrls: brand[2],
						email: typeof brand[3] === 'string' ? brand[3] : undefined,
						logoSrc: findLogoSrc(chunks),
					},
				});
				return;
			}
			/* eslint-enable no-await-in-loop */

			if (sawGooglePage) {
				throw new Error('Google did not return any app details for this client ID. Double-check the client ID is correct (it should look like 12345.apps.googleusercontent.com).');
			}

			throw new Error('Failed to fetch app details from Google via the available CORS proxies. You can still look up the details manually with the command below.');
		} catch (error) {
			setAppDetails({
				type: 'error',
				error: error instanceof Error ? error : new Error('An unknown error occurred'),
				id: clientId,
			});
		}
	};

	const [pastedHtml, setPastedHtml] = useState('');

	const onParsePastedHtml = (clientId: string) => {
		const chunks = extractDataChunks(pastedHtml);
		const brand = findBrandChunk(chunks);
		if (!brand) {
			setAppDetails({
				type: 'error',
				error: new Error('Could not find app details in the pasted output. Check the command ran successfully and you pasted its full output — and double-check the client ID is correct.'),
				id: clientId,
			});
			return;
		}

		setPastedHtml('');
		setAppDetails({
			type: 'loaded',
			appDetails: {
				id: clientId,
				name: brand[0],
				termsUrls: brand[1],
				privacyUrls: brand[2],
				email: typeof brand[3] === 'string' ? brand[3] : undefined,
				logoSrc: findLogoSrc(chunks),
			},
		});
	};

	const browserUserAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

	const curlCommand = (clientId: string) => `curl -s -A "${browserUserAgent}" "${googleErrorPageUrl(clientId || 'YOUR_CLIENT_ID')}"`;

	const curlJqCommand = (clientId: string) => `${curlCommand(clientId)} \\
  | grep -o "AF_initDataCallback({key: 'ds:1', hash: '[0-9]*', data:\\[[^;]*\\], sideChannel" \\
  | sed "s/.*data://; s/, sideChannel//" \\
  | jq '{name: .[0], termsOfService: .[1], privacyPolicy: .[2], email: .[3]}'`;

	return (
		<div className='max-w-2xl mx-auto p-16'>
			<Head>
				<title>google-client-id-lookup</title>
			</Head>
			<h1 className='text-3xl font-bold mb-4'>google-client-id-lookup</h1>
			<p className='mb-6'>
				This tool can find the app details behind a given Google Client ID (such as
				12345.apps.googleusercontent.com).
			</p>

			<div className='mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm'>
				⚠️ In-browser lookup is currently unreliable: Google blocks requests made via public CORS
				proxies, which this page depends on. If the lookup fails, the error screen includes a
				manual lookup that takes about 30 seconds.
			</div>

			{appDetails.type === 'ready' && (
				<div className='mb-6'>
					<div className='shadow-sm border rounded-lg p-6'>
						<div className='flex gap-2'>
							<input
								type='text'
								placeholder='Enter Client ID'
								className='flex-1 px-3 border border-gray-300 rounded-md outline-none focus:ring-2 ring-gray-200 transition-all'
								value={appDetails.id}
								onChange={(e) => {
									setAppDetails({type: 'ready', id: e.target.value});
								}}
							/>
							<button
								type='button'
								className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 ring-blue-300 transition-all'
								onClick={async () => onLookup(appDetails.id)}
							>
								Lookup
							</button>
						</div>
						<p className='mt-4'>Just curious? <button type='button' onClick={() => {
							setAppDetails({type: 'ready', id: '606092904014-s1u3idjanlbhr4ns5b1hcjgfn63cr9nh.apps.googleusercontent.com'});
						}} className='underline'>Use an example</button>.</p>
					</div>
				</div>
			)}

			{appDetails.type === 'loading' && (
				<div className='mb-6 flex items-center gap-4 shadow-sm border rounded-lg p-6'>
					<div className='animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-blue-500 border-transparent' />
					<span className='text-gray-600'>Finding app details...</span>
				</div>
			)}

			{appDetails.type === 'error' && (
				<div className='mb-6 p-6 shadow bg-red-50 border border-red-200 rounded-lg'>
					<div className='text-red-700 font-medium mb-1'>Error occurred</div>
					<div className='text-red-600'>{appDetails.error.message}</div>
					<div className='mt-4'>
						<div className='text-red-700 font-medium mb-1'>Manual lookup</div>
						<p className='text-red-600 text-sm mb-2'>
							Run this in a terminal (Google will only answer requests that look like they come from a browser):
						</p>
						<pre className='bg-red-100 text-red-900 text-xs p-3 rounded overflow-x-auto whitespace-pre-wrap break-all'><code>{curlCommand(appDetails.id)}</code></pre>
						<p className='text-red-600 text-sm my-2'>
							Then paste the output here and the app details will be extracted from it:
						</p>
						<textarea
							value={pastedHtml}
							onChange={(e) => {
								setPastedHtml(e.target.value);
							}}
							placeholder='Paste the command output here...'
							className='w-full h-24 px-3 py-2 text-xs border border-red-300 rounded-md outline-none focus:ring-2 ring-red-200 transition-all font-mono'
						/>
						<button
							type='button'
							className='mt-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 focus:outline-none focus:ring-2 ring-red-300 transition-all'
							onClick={() => {
								onParsePastedHtml(appDetails.id);
							}}
						>
							Extract app details
						</button>
						<p className='text-red-600 text-sm mt-4 mb-2'>
							Alternatively, with <a href='https://jqlang.org/' target='_blank' rel='noopener noreferrer' className='underline'>jq</a> installed you can get the details as JSON directly:
						</p>
						<pre className='bg-red-100 text-red-900 text-xs p-3 rounded overflow-x-auto whitespace-pre-wrap break-all'><code>{curlJqCommand(appDetails.id)}</code></pre>
					</div>
					<p className='mt-4'><button type='button' onClick={() => {
						setAppDetails({type: 'ready', id: appDetails.id});
					}} className='underline'>Try again</button>.</p>
				</div>
			)}

			{appDetails.type === 'loaded' && (
				<div className='mb-6'>
					<div className='shadow-sm border rounded-lg p-6'>
						<div className='flex items-center gap-4 mb-6'>
							{appDetails.appDetails.logoSrc && (
								<img
									src={appDetails.appDetails.logoSrc}
									alt='App Logo'
									className='w-20 h-20 shadow-sm border rounded-lg'
								/>
							)}
							<div>
								<h2 className='text-xl font-semibold'>{appDetails.appDetails.name}</h2>
								{appDetails.appDetails.email && (
									<p className='text-gray-500 hover:underline'><a href={`mailto:${appDetails.appDetails.email}`}>{appDetails.appDetails.email}</a></p>
								)}
							</div>
						</div>

						<div className='space-y-4'>
							<div>
								<h3 className='font-medium mb-1'>Terms of Service</h3>
								<ul className='list-disc ml-4 space-y-1'>
									{appDetails.appDetails.termsUrls.map((termsUrl) => (
										<li key={termsUrl}>
											<a
												href={termsUrl}
												target='_blank'
												rel='noopener noreferrer'
												className='text-blue-500 hover:underline'
											>
												{termsUrl}
											</a>
										</li>
									))}
								</ul>
							</div>

							<div>
								<h3 className='font-medium mb-1'>Privacy Policy</h3>
								<ul className='list-disc ml-4 space-y-1'>
									{appDetails.appDetails.privacyUrls.map((privacyUrl) => (
										<li key={privacyUrl}>
											<a
												href={privacyUrl}
												target='_blank'
												rel='noopener noreferrer'
												className='text-blue-500 hover:underline'
											>
												{privacyUrl}
											</a>
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
					<p className='mt-4'>Want to lookup another app? <button type='button' onClick={() => {
						setAppDetails({type: 'ready', id: ''});
					}} className='underline'>Start over</button>.</p>
				</div>
			)}

			<p>
				This tool is open-source, and the code is available on <a href='https://github.com/domdomegg/google-client-id-lookup' className='underline'>GitHub</a>.
			</p>
		</div>
	);
};

export default Home;
