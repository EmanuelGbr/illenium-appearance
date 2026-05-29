import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const lua = readFileSync('../game/nui.lua', 'utf8');
const distIndex = readFileSync('dist/index.html', 'utf8');
const assetNames = readdirSync('dist/assets').filter((file) => file.endsWith('.js'));
const bundle = assetNames.map((file) => readFileSync(join('dist/assets', file), 'utf8')).join('\n');

const callbacks = [...lua.matchAll(/RegisterNUICallback\('([^']+)'/g)].map((match) => match[1]);
const requiredEvents = ['appearance_display', 'appearance_hide'];
const missingCallbacks = callbacks.filter((callback) => !bundle.includes(callback));
const missingEvents = requiredEvents.filter((event) => !bundle.includes(event));
const hasExpectedIndex = /<div id="root"><\/div>/.test(distIndex) && /\.\/assets\/.+\.js/.test(distIndex);

if (!hasExpectedIndex || missingCallbacks.length > 0 || missingEvents.length > 0) {
  console.error(JSON.stringify({ hasExpectedIndex, missingCallbacks, missingEvents }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ callbacks: callbacks.length, events: requiredEvents.length, assets: assetNames }, null, 2));
