import { createGame } from './game.js';

const root = document.getElementById('app');
root.innerHTML = '<main><h1>Memory Power Reveals</h1><p>Loading...</p></main>';

createGame(root);
