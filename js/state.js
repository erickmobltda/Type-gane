// state.js — estado do jogo e persistência do recorde (localStorage).

const MAX_LIVES = 3;
const PR_KEY_PREFIX = 'splitTyping.pr.';

function createState(layoutId, mode) {
  return {
    layoutId,
    mode: mode === 'free' ? 'free' : 'classic',
    hits: 0,        // acertos
    misses: 0,      // erros cometidos
    steps: 0,       // passos dados na cena side-scroller (1 por acerto)
    combo: 0,       // sequência de acertos sem erro (alimenta o "especial")
    lives: MAX_LIVES,
    missByChar: {}, // contagem de erros por tecla alvo
    startTime: null, // marca o 1º acerto
    lastActive: null, // momento do último acerto (WPM não conta pausas)
    wpm: 0,
    pr: loadPR(layoutId),
    finished: false,
  };
}

// Registra um erro na tecla alvo (para o relatório de fim de jogo).
function recordMiss(state, char) {
  state.missByChar[char] = (state.missByChar[char] || 0) + 1;
}

// Top N teclas mais erradas: [{ char, count }] em ordem decrescente.
function topMissedKeys(state, n) {
  return Object.entries(state.missByChar)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([char, count]) => ({ char, count }));
}

// Precisão em % (acertos / total de toques).
function accuracy(state) {
  const total = state.hits + state.misses;
  return total ? Math.round((state.hits / total) * 100) : 100;
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

// Recalcula WPM = (acertos / 5) / minutos digitando.
// Usa o tempo até o último acerto, então pausas (e o encerramento por
// inatividade no modo livre) não derrubam o resultado.
function recomputeWpm(state) {
  if (state.startTime == null || state.hits === 0) {
    state.wpm = 0;
    return;
  }
  const end = state.lastActive || performance.now();
  const minutes = (end - state.startTime) / 60000;
  state.wpm = minutes > 0 ? (state.hits / 5) / minutes : 0;
}

// ---------- Preferência: último teclado/modo usados ----------
const LAST_KEY = 'splitTyping.last';

function saveLast(layoutId, mode) {
  localStorage.setItem(LAST_KEY, JSON.stringify({ layoutId, mode }));
}

function loadLast() {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY));
    if (v && v.layoutId) return v;
  } catch (e) { /* ignora */ }
  return null;
}

// ---------- Histórico de WPM por teclado (evolução entre sessões) ----------
const HISTORY_PREFIX = 'splitTyping.history.';
const HISTORY_MAX = 40;

function loadHistory(layoutId) {
  try {
    const v = JSON.parse(localStorage.getItem(HISTORY_PREFIX + layoutId));
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}

// Registra o resultado da partida e devolve a lista atualizada (mais antigo → recente).
function addHistory(state) {
  const list = loadHistory(state.layoutId);
  list.push({ wpm: Math.round(state.wpm), acc: accuracy(state), mode: state.mode, t: Date.now() });
  while (list.length > HISTORY_MAX) list.shift();
  localStorage.setItem(HISTORY_PREFIX + state.layoutId, JSON.stringify(list));
  return list;
}
