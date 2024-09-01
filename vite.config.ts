import path from 'path';
import { defineConfig } from 'vite';
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import dts from 'vite-plugin-dts';
import pkg from './package.json';

import buildeAsset from './build/asset';

const copyOverPyrightWorker = () =>
	viteStaticCopy({
		targets: [
			{
				src: 'node_modules/@typefox/pyright-browser/dist/pyright.worker.js',
				dest: './',
			}
		],
	});

export default defineConfig(({ mode }) => {
	const baseURL = mode === 'development' ? '/' : `https://unpkg.com/${pkg.name}@${pkg.version}/dist/`;
	return {
		base: baseURL,
		plugins: [
			copyOverPyrightWorker(),
			dts({
				include: 'src/index.ts'
			}),
			buildeAsset({
				baseURL,
				target: path.join(__dirname, 'dist'),
				include: /\.(json|svg|wasm|html)$/
			}),
		],
		optimizeDeps: {
			esbuildOptions: {
				plugins: [
					importMetaUrlPlugin,
				]
			},
			exclude: ['@wasm-fmt/ruff_fmt']
		},
		build: {
			lib: {
				entry: path.resolve(__dirname, 'src/index.ts'),
				name: 'monaco-python',
				fileName: 'index',
				formats: ['es'],
			},
		}
	}
});
