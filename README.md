# typescript-webapp-template

Personal template for creating TypeScript web applications with Next.js.

## Quick start

1. Update the package name in `package.json`
2. Set 'Source' to 'GitHub Actions' in _Settings > Pages_
3. Enable 'Allow GitHub Actions to create and approve pull requests' in _Settings > Actions (General) > Workflow permissions_
4. Set protection on the master branch: require a pull request before merging, require reivew from code owners, require status checks to pass (select both ci options)
5. Add the repo to the [file sync automation rules](https://github.com/domdomegg/domdomegg/blob/master/.github/workflows/repo-file-sync.yaml)
6. Update the README, using the template commented out below

## Enabling API routes

This template is primarily meant for static sites hosted on GitHub pages. However, if you want to enable API routes:

1. Edit `next.config.ts` to remove the line `output: 'export',`
2. Add an `api` folder in [`pages`](./src/pages). You can then add routes, such as `ping.ts` for /api/ping:
    ```ts
    import type { NextApiRequest, NextApiResponse } from "next";
    
    export default function handler(req: NextApiRequest, res: NextApiResponse<{ pong: true }>) {
        res.status(200).json({ pong: true });
    }
    ```
3. Change the hosting setup, as running code is not supported on GitHub Actions

<!--

# TODO: name of webapp [(view live)](https://adamjones.me/TODO-webapp-name/)

TODO: A short description of what the webapp does, explaining why people might want to use it.

TODO: A screenshot of the app

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

-->
