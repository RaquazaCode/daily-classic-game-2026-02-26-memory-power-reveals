import fs from 'node:fs';
import { chromium } from 'playwright';

const outDir = 'playwright/main-actions';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.screenshot({ path: `${outDir}/clip-1-opening.png`, fullPage: true });

async function getPairSetup() {
  return page.evaluate(() => {
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
}

async function solveCurrentBoard() {
  const setup = await getPairSetup();

  if (setup.powerIndex >= 0) {
    await page.evaluate((idx) => {
      window.__game.flip(idx);
      window.advanceTime(900);
    }, setup.powerIndex);
  }

  for (const entries of Object.values(setup.pairs)) {
    const [a, b] = entries;
    await page.evaluate(({ first, second }) => {
      window.__game.flip(first);
      window.advanceTime(70);
      window.__game.flip(second);
      window.advanceTime(900);
    }, { first: a, second: b });
  }

  return {
    powerTriggered: setup.powerIndex >= 0,
    state: JSON.parse(await page.evaluate(() => window.render_game_to_text()))
  };
}

await page.click('#start-btn');
await page.evaluate(() => window.advanceTime(100));
const classic = await solveCurrentBoard();
await page.screenshot({ path: `${outDir}/clip-2-midgame.png`, fullPage: true });

await page.selectOption('#mode-select', 'zen');
await page.click('#start-btn');
await page.evaluate(() => window.advanceTime(100));
await page.click('#hint-btn');
await page.evaluate(() => window.advanceTime(1300));
const zen = JSON.parse(await page.evaluate(() => window.render_game_to_text()));

await page.selectOption('#mode-select', 'sprint');
await page.click('#start-btn');
await page.evaluate(() => window.advanceTime(90000));
const sprint = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
await page.screenshot({ path: `${outDir}/clip-3-finale.png`, fullPage: true });

const summary = {
  classicWon: classic.state.mode === 'won',
  classicPowerTriggered: classic.powerTriggered,
  zenHintNoPenalty: zen.modeId === 'zen' && zen.hintsRemaining === null,
  sprintTimedOut: sprint.mode === 'time_up' && sprint.phase === 'time_up',
  tutorialFieldPresent: typeof classic.state.tutorialStepTitle === 'string'
};

fs.writeFileSync(
  `${outDir}/solver-final-state.json`,
  JSON.stringify({ classic: classic.state, zen, sprint }, null, 2),
);
fs.writeFileSync(`${outDir}/solver-summary.json`, JSON.stringify(summary, null, 2));

await browser.close();
