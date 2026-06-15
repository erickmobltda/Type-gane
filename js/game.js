// game.js — loop principal: sorteia teclas, pontua, e gerencia a perseguição da horda.

// Perseguição: a "distância" (0–100) cai com o tempo (zumbis se aproximam) e
// sobe a cada acerto. Errar dá um tranco. Distância 0 = alcançado.
const DIST_START = 64;
const DIST_MAX = 100;
const DIST_GAIN = 3.4;     // ganho por acerto
const DIST_MISS = 6;       // perda por erro
const DIST_DRAIN = 11;     // queda por segundo (≈ equilíbrio em ~39 WPM)
const CATCH_RECOVER = 48;  // recuo da horda após ser pego (Clássico)
const CHASE_MS = 80;       // passo do loop da perseguição

const Game = {
  state: null,
  layout: null,
  pool: [],
  target: null,
  keyHandler: null,
  wpmTimer: null,
  chaseTimer: null,
  chaseLast: 0,
  distance: DIST_START,
  grabbing: false, // congela a perseguição durante o agarrão
  grabTimer: null,
  el: {}, // cache de elementos
};

const MODE_LABELS = { classic: 'Clássico', free: 'Treino livre' };

function gameCacheEls() {
  Game.el = {
    hits: document.getElementById('hud-hits'),
    wpm: document.getElementById('hud-wpm'),
    pr: document.getElementById('hud-pr'),
    lives: document.getElementById('hud-lives'),
    layoutName: document.getElementById('game-layout-name'),
    promptKey: document.getElementById('prompt-key'),
    promptFinger: document.getElementById('prompt-finger'),
    promptHand: document.getElementById('prompt-hand'),
    kbd: document.getElementById('kbd-area'),
    hands: document.getElementById('hands-area'),
    stage: document.getElementById('stage'),
    feedback: document.getElementById('feedback'),
    livesWrap: document.getElementById('hud-lives-wrap'),
    distFill: document.getElementById('hud-dist-fill'),
    modeName: document.getElementById('game-mode-name'),
  };
}

function startGame(layoutId, mode) {
  if (!Game.el.hits) gameCacheEls();

  Game.layout = buildLayout(layoutId);
  Game.pool = letterPool(Game.layout);
  Game.state = createState(layoutId, mode);
  Game.target = null;
  Game.distance = DIST_START;
  Game.grabbing = false;

  Game.el.layoutName.textContent = Game.layout.name;
  Game.el.modeName.textContent = MODE_LABELS[Game.state.mode];
  stageInit(Game.el.stage); // monta a cena da fuga

  renderHud();
  renderChase();
  nextTarget();

  // Listener de teclado
  if (Game.keyHandler) document.removeEventListener('keydown', Game.keyHandler);
  Game.keyHandler = onKeyDown;
  document.addEventListener('keydown', Game.keyHandler);

  // Atualiza WPM continuamente enquanto joga
  if (Game.wpmTimer) clearInterval(Game.wpmTimer);
  Game.wpmTimer = setInterval(() => {
    if (Game.state && !Game.state.finished && Game.state.startTime) {
      recomputeWpm(Game.state);
      Game.el.wpm.textContent = Math.round(Game.state.wpm);
    }
  }, 400);

  startChase();
}

function stopGame() {
  if (Game.keyHandler) document.removeEventListener('keydown', Game.keyHandler);
  Game.keyHandler = null;
  if (Game.wpmTimer) clearInterval(Game.wpmTimer);
  Game.wpmTimer = null;
  stopChase();
  if (Game.grabTimer) clearTimeout(Game.grabTimer);
  Game.grabTimer = null;
  Game.grabbing = false;
}

// Sai do jogo e volta à seleção (tecla Esc).
function quitGame() {
  stopGame();
  if (typeof initSelectScreen === 'function') initSelectScreen();
  Screens.show('select');
}

// ---- perseguição da horda ----
function startChase() {
  stopChase();
  Game.chaseLast = performance.now();
  Game.chaseTimer = setInterval(chaseTick, CHASE_MS);
}

function stopChase() {
  if (Game.chaseTimer) clearInterval(Game.chaseTimer);
  Game.chaseTimer = null;
}

function chaseTick() {
  const s = Game.state;
  if (!s || s.finished) return;
  const now = performance.now();
  const dt = (now - Game.chaseLast) / 1000;
  Game.chaseLast = now;
  if (Game.grabbing) return; // congelado durante o agarrão

  Game.distance = Math.max(0, Game.distance - DIST_DRAIN * dt);
  renderChase();
  if (Game.distance <= 0) handleCaught();
}

// Atualiza a barra da horda + a posição/tensão da cena.
function renderChase() {
  const d = Game.distance; // 0..100
  if (Game.el.distFill) {
    Game.el.distFill.style.width = d + '%';
    Game.el.distFill.style.background = d > 50 ? 'var(--green-bright)' : d > 25 ? '#f0c750' : '#e7402e';
  }
  if (typeof stageSetChase === 'function') stageSetChase(d / 100);
}

// A horda alcançou o jogador — segura o contato por um instante (susto) antes de seguir.
function handleCaught() {
  const s = Game.state;
  if (!s || s.finished || Game.grabbing) return;

  Game.grabbing = true;
  flash('miss');
  if (typeof stageGrab === 'function') stageGrab();

  if (s.mode === 'free') {
    Game.grabTimer = setTimeout(() => { if (!s.finished) endGame(); }, 540);
    return;
  }
  // Clássico: perde uma das chances.
  s.lives -= 1;
  renderHud();
  if (s.lives <= 0) {
    Game.grabTimer = setTimeout(() => { if (!s.finished) endGame(); }, 620);
    return;
  }
  // Sobreviveu: a horda recua e a fuga continua.
  Game.grabTimer = setTimeout(() => {
    Game.distance = CATCH_RECOVER;
    Game.grabbing = false;
    renderChase();
  }, 470);
}

// Escolhe a próxima tecla alvo (evita repetir a anterior).
function nextTarget() {
  let key;
  do {
    key = Game.pool[Math.floor(Math.random() * Game.pool.length)];
  } while (Game.pool.length > 1 && Game.target && key.char === Game.target.char);
  Game.target = key;

  const finger = FINGERS[key.finger];
  Game.el.promptKey.textContent = key.label;
  Game.el.promptKey.style.color = finger.color;
  Game.el.promptFinger.textContent = finger.name;
  Game.el.promptFinger.style.color = finger.color;
  Game.el.promptHand.textContent = key.hand === 'L' ? 'mão esquerda' : 'mão direita';

  Game.el.kbd.innerHTML = renderKeyboard(Game.layout, { targetChar: key.char });
  Game.el.hands.innerHTML = renderHands(key.hand, key.finger);
}

function onKeyDown(e) {
  if (!Game.state || Game.state.finished) return;
  // Esc encerra a partida e volta à seleção (navegação por teclado).
  if (e.key === 'Escape') { e.preventDefault(); quitGame(); return; }
  if (Game.grabbing) return; // ignora digitação durante o agarrão
  // Evita perder o foco com Tab e barra de espaço rolando a página.
  if (e.key === 'Tab' || e.key === ' ') e.preventDefault();

  // Só consideramos teclas de letra (o jogo só pede letras a–z).
  const pressed = e.key.length === 1 ? e.key.toLowerCase() : null;
  if (!pressed || !/^[a-z]$/.test(pressed)) return;

  if (pressed === Game.target.char) {
    handleHit();
  } else {
    handleMiss();
  }
}

function handleHit() {
  const s = Game.state;
  const now = performance.now();
  if (!s.startTime) s.startTime = now;
  s.lastActive = now;
  s.hits += 1;
  s.steps += 1;
  s.combo += 1;
  recomputeWpm(s);
  maybeUpdatePR(s);

  // Abre distância da horda.
  Game.distance = Math.min(DIST_MAX, Game.distance + DIST_GAIN);

  stageStep(chooseAction(s));
  renderHud();
  renderChase();
  nextTarget();
}

// Decide a ação da cena a cada acerto (prioridade: dash > pulo > corrida).
function chooseAction(s) {
  if (s.combo > 0 && s.combo % 20 === 0) return 'dash';
  if (s.steps % 6 === 0) return 'jump';
  return 'run';
}

function handleMiss() {
  const s = Game.state;
  s.misses += 1;
  s.combo = 0;
  recordMiss(s, Game.target.char);

  // Erro: o sobrevivente tropeça e a horda avança um tranco (não tira vida direto).
  Game.distance = Math.max(0, Game.distance - DIST_MISS);

  stageHurt();
  renderHud();
  renderChase();
  if (Game.distance <= 0) handleCaught();
}

function endGame() {
  const s = Game.state;
  s.finished = true;
  recomputeWpm(s);
  const isNewPr = maybeUpdatePR(s);
  stopGame();
  showGameOver(s, isNewPr);
}

function renderHud() {
  const s = Game.state;
  Game.el.hits.textContent = s.hits;
  Game.el.wpm.textContent = Math.round(s.wpm);
  Game.el.pr.textContent = s.pr;

  // Vidas (corações) só no Clássico — são as "chances" de ser pego.
  if (s.mode === 'free') {
    Game.el.livesWrap.classList.add('hidden');
  } else {
    Game.el.livesWrap.classList.remove('hidden');
    Game.el.lives.innerHTML = renderHearts(s.lives);
  }
}

function renderHearts(lives) {
  let h = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    const full = i < lives;
    h += `<span class="heart ${full ? 'full' : 'empty'}">${heartSvg(full)}</span>`;
  }
  return h;
}

function heartSvg(full) {
  const fill = full ? '#e7402e' : '#3a2a22';
  const stroke = full ? '#ff7a5c' : '#5e4a3a';
  return `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
    <path d="M12 21s-8-5.2-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 3.5C20 15.8 12 21 12 21z"
      fill="${fill}" stroke="${stroke}" stroke-width="1.5"/></svg>`;
}

function flash(kind) {
  const f = Game.el.feedback;
  if (!f) return;
  f.classList.remove('flash-hit', 'flash-miss');
  void f.offsetWidth;
  f.classList.add(kind === 'hit' ? 'flash-hit' : 'flash-miss');
}
