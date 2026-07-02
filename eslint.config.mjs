import domdomegg from 'eslint-config-domdomegg';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default [
	{
		ignores: ['.next', 'next-env.d.ts'],
	},
	...domdomegg,
];
