// game.js — loop principal: sorteia teclas, ouve o teclado, pontua, controla vidas/WPM.

const FREE_IDLE_MS = 5000; // modo livre: termina após este tempo sem digitar

const Game = {
  state: null,
  layout: null,
  pool: [],
  target: null,
  keyHandler: null,
  wpmTimer: null,
  idleInterval: null, // contagem regressiva de inatividade (modo livre)
  idleDeadline: 0,
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
    idleWrap: document.getElementById('hud-idle-wrap'),
    idle: document.getElementById('hud-idle'),
    modeName: document.getElementById('game-mode-name'),
  };
}

function startGame(layoutId, mode) {
  if (!Game.el.hits) gameCacheEls();

  Game.layout = buildLayout(layoutId);
  Game.pool = letterPool(Game.layout);
  Game.state = createState(layoutId, mode);
  Game.target = null;

  Game.el.layoutName.textContent = Game.layout.name;
  Game.el.modeName.textContent = MODE_LABELS[Game.state.mode];
  Game.el.idle.textContent = (FREE_IDLE_MS / 1000).toFixed(1) + 's';
  stageInit(Game.el.stage); // monta a cena side-scroller

  renderHud();
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
}

function stopGame() {
  if (Game.keyHandler) document.removeEventListener('keydown', Game.keyHandler);
  Game.keyHandler = null;
  if (Game.wpmTimer) clearInterval(Game.wpmTimer);
  Game.wpmTimer = null;
  clearIdle();
}

// Sai do jogo e volta à seleção (tecla Esc).
function quitGame() {
  stopGame();
  if (typeof initSelectScreen === 'function') initSelectScreen();
  Screens.show('select');
}

// ---- contagem de inatividade (modo livre) ----
function armIdle() {
  clearIdle();
  Game.idleDeadline = performance.now() + FREE_IDLE_MS;
  Game.idleInterval = setInterval(() => {
    const remain = Math.max(0, Game.idleDeadline - performance.now());
    Game.el.idle.textContent = (remain / 1000).toFixed(1) + 's';
    if (remain <= 0) { clearIdle(); endGame(); }
  }, 100);
}

function clearIdle() {
  if (Game.idleInterval) clearInterval(Game.idleInterval);
  Game.idleInterval = null;
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

  flash('hit');
  stageStep(chooseAction(s));
  renderHud();
  nextTarget();

  if (s.mode === 'free') armIdle();
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

  flash('miss');
  stageHurt();

  if (s.mode === 'free') {
    // Modo livre: pode errar à vontade (sem perder vida).
    renderHud();
    armIdle();
  } else {
    s.lives -= 1;
    renderHud();
    if (s.lives <= 0) endGame();
  }
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

  // Clássico mostra vidas (corações); livre mostra a contagem de inatividade.
  if (s.mode === 'free') {
    Game.el.livesWrap.classList.add('hidden');
    Game.el.idleWrap.classList.remove('hidden');
  } else {
    Game.el.idleWrap.classList.add('hidden');
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
