import { createGame } from './game.js';

const root = document.getElementById('app');
window.__game = createGame(root);
