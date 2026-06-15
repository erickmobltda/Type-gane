// state.js — estado do jogo e persistência do recorde (localStorage).

const MAX_LIVES = 3;
const PR_KEY_PREFIX = 'splitTyping.pr.';

function createState(layoutId) {
  return {
    layoutId,
    hits: 0,        // acertos
    misses: 0,      // erros cometidos
    lives: MAX_LIVES,
    startTime: null, // marca o 1º acerto
    wpm: 0,
    pr: loadPR(layoutId),
    finished: false,
  };
}

// Recorde por layout (maior WPM já atingido).
function loadPR(layoutId) {
  const v = Number(localStorage.getItem(PR_KEY_PREFIX + layoutId));
  return Number.isFinite(v) ? v : 0;
}

function savePR(layoutId, wpm) {
  localStorage.setItem(PR_KEY_PREFIX + layoutId, String(Math.round(wpm)));
}

// Atualiza o recorde se o WPM atual for maior. Retorna true se houve novo recorde.
function maybeUpdatePR(state) {
  if (state.wpm > state.pr) {
    state.pr = Math.round(state.wpm);
    savePR(state.layoutId, state.pr);
    return true;
  }
  return false;
}

// Recalcula WPM = (acertos / 5) / minutos decorridos.
function recomputeWpm(state) {
  if (!state.startTime || state.hits === 0) {
    state.wpm = 0;
    return;
  }
  const minutes = (performance.now() - state.startTime) / 60000;
  state.wpm = minutes > 0 ? (state.hits / 5) / minutes : 0;
}
