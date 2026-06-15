// game.js — loop principal: sorteia teclas, ouve o teclado, pontua, controla vidas/WPM.

const Game = {
  state: null,
  layout: null,
  pool: [],
  target: null,
  keyHandler: null,
  wpmTimer: null,
  el: {}, // cache de elementos
};

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
    hero: document.getElementById('hero-area'),
    feedback: document.getElementById('feedback'),
  };
}

function startGame(layoutId) {
  if (!Game.el.hits) gameCacheEls();

  Game.layout = buildLayout(layoutId);
  Game.pool = letterPool(Game.layout);
  Game.state = createState(layoutId);
  Game.target = null;

  Game.el.layoutName.textContent = Game.layout.name;
  Game.el.hero.className = 'hero'; // reseta estado de animação
  Game.el.hero.innerHTML = renderHero();

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
  if (!s.startTime) s.startTime = performance.now();
  s.hits += 1;
  recomputeWpm(s);
  maybeUpdatePR(s);

  flash('hit');
  heroAnimate(Game.el.hero, 'attack');
  renderHud();
  nextTarget();
}

function handleMiss() {
  const s = Game.state;
  s.misses += 1;
  s.lives -= 1;

  flash('miss');
  heroAnimate(Game.el.hero, 'hurt');
  renderHud();

  if (s.lives <= 0) {
    endGame();
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
  Game.el.lives.innerHTML = renderHearts(s.lives);
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
