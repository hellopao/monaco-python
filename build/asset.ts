import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Plugin } from 'vite';

const files: { name: string; buf: Buffer }[] = [];

export default (options: { baseURL: string; include: RegExp; target: string; }) => ({
	name: 'monaco-theme',
	apply: 'build' as Plugin['apply'],
	transform: async (code, id) => {
		if (code.includes('new URL(')) {
			code = code.replace(/new\s+URL\(['"](.*?)['"]\s*,\s*import\.meta\.url\)/g, (_, asset) => {
				if (options.include.test(asset)) {
					let file = path.join(path.dirname(id), asset);
					const exist = fs.existsSync(file);
					if (!exist && !/^\./.test(asset)) {
						file = path.join(process.cwd(), 'node_modules', asset)
					}
					const buf = fs.readFileSync(file)
					const hash = crypto.createHash('md5').update(buf).digest('hex').slice(0, 8);
					const target = path.basename(asset).replace(/(\..*)$/, `-${hash}$1`);
					files.push({ name: target, buf });
					return `new URL('${target}', '${options.baseURL}')`;
				}
				return _;
			});
		}
		return {
			code, map: null
		};
	},
	closeBundle: async () => {
		for (const file of files) {
			fs.writeFileSync(path.join(options.target, file.name), file.buf);
		}
	}
});
