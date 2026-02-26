import fs from 'node:fs';
import { chromium } from 'playwright';

const outDir = 'playwright/main-actions';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.click('#start-btn');
await page.evaluate(() => window.advanceTime(100));
await page.screenshot({ path: `${outDir}/clip-1-opening.png`, fullPage: true });

const setup = await page.evaluate(() => {
  const state = window.__game.getState();
  const pairs = {};
  let powerIndex = -1;
  for (let i = 0; i < state.deck.length; i += 1) {
    const card = state.deck[i];
    if (card.kind === 'power-reveal') {
      powerIndex = i;
      continue;
    }
    if (card.kind !== 'pair') continue;
    pairs[card.symbol] = pairs[card.symbol] || [];
    pairs[card.symbol].push(i);
  }
  return { pairs, powerIndex };
});

if (setup.powerIndex >= 0) {
  await page.evaluate((idx) => {
    window.__game.flip(idx);
    window.advanceTime(900);
  }, setup.powerIndex);
}

await page.screenshot({ path: `${outDir}/clip-2-midgame.png`, fullPage: true });

for (const entries of Object.values(setup.pairs)) {
  const [a, b] = entries;
  await page.evaluate(({ first, second }) => {
    window.__game.flip(first);
    window.advanceTime(60);
    window.__game.flip(second);
    window.advanceTime(900);
  }, { first: a, second: b });
}

const finalState = await page.evaluate(() => window.render_game_to_text());
fs.writeFileSync(`${outDir}/solver-final-state.json`, finalState);
await page.screenshot({ path: `${outDir}/clip-3-finale.png`, fullPage: true });
fs.writeFileSync(`${outDir}/solver-summary.json`, JSON.stringify({ powerTriggered: setup.powerIndex >= 0 }, null, 2));

await browser.close();
