import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const source = readFileSync('src/original-nui.js', 'utf8');
const hash = createHash('sha256').update(source).digest('hex').slice(0, 8);
const fileName = `index.${hash}.js`;

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/assets', { recursive: true });
writeFileSync(`dist/assets/${fileName}`, source);
writeFileSync(
  'dist/index.html',
  `<!DOCTYPE html>\n<html lang="en">\n\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>UI</title>\n  <script type="module" crossorigin src="./assets/${fileName}"></script>\n</head>\n\n<body>\n  <div id="root"></div>\n</body>\n\n</html>\n`,
);

console.log(`Built dist/assets/${fileName}`);
