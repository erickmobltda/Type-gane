// stage.js — cena 2D de fuga: o corredor foge à frente e a HORDA de zumbis persegue.
// A posição da horda reflete a "distância" (chase). O corredor anda/pula/dá dash ao
// digitar e tropeça no erro. Reaproveita renderRunner() (character.js).

const Stage = {
  root: null, runner: null, obstacle: null, scene: null, fx: null,
  horde: null, danger: null,
  scroll: 0,
  idleTimer: null,
  classTimers: {}, // timers para remover classes "one-shot"
};

const STAGE_STEP = 26;       // px de rolagem por acerto
const STAGE_DASH_STEP = 70;  // rolagem extra no dash
const STAGE_IDLE_MS = 460;   // tempo parado até voltar ao idle
const ACTION_MS = { jump: 620, dash: 500, stumble: 420 };

// Monta a cena dentro do contêiner e zera o estado.
function stageInit(containerEl) {
  containerEl.innerHTML = `
    <div class="stage-scene">
      <div class="layer sky"></div>
      <div class="layer clouds"></div>
      <div class="layer hills"></div>
      <div class="layer ground"></div>
    </div>
    <div class="stage-actors">
      <div id="stage-horde" class="horde">${renderHorde()}</div>
      <div id="stage-obstacle" class="obstacle">${renderObstacle()}</div>
      <div id="stage-runner" class="runner">${renderRunner()}</div>
      <div id="stage-fx" class="stage-fx"></div>
    </div>
    <div id="stage-danger" class="danger"></div>`;

  Stage.root = containerEl;
  Stage.scene = containerEl.querySelector('.stage-scene');
  Stage.runner = containerEl.querySelector('#stage-runner');
  Stage.obstacle = containerEl.querySelector('#stage-obstacle');
  Stage.fx = containerEl.querySelector('#stage-fx');
  Stage.horde = containerEl.querySelector('#stage-horde');
  Stage.danger = containerEl.querySelector('#stage-danger');

  Stage.scroll = 0;
  applyScroll();
  clearTimeout(Stage.idleTimer);
  Object.values(Stage.classTimers).forEach(clearTimeout);
  Stage.classTimers = {};
  Stage.runner.className = 'runner';
  Stage.root.classList.remove('shake', 'grab');
  stageSetChase(1);
}

// Avança um passo + dispara a ação ('run' | 'jump' | 'dash').
function stageStep(action) {
  if (!Stage.runner) return;

  Stage.scroll += STAGE_STEP + (action === 'dash' ? STAGE_DASH_STEP : 0);
  applyScroll();

  Stage.runner.classList.add('is-running');
  clearTimeout(Stage.idleTimer);
  Stage.idleTimer = setTimeout(stageIdle, STAGE_IDLE_MS);

  if (action === 'jump') {
    triggerObstacle();
    oneShot('is-jump', ACTION_MS.jump);
  } else if (action === 'dash') {
    spawnSpeedLines();
    oneShot('is-dash', ACTION_MS.dash);
  }
}

// Volta o corredor para a pose parada.
function stageIdle() {
  if (Stage.runner) Stage.runner.classList.remove('is-running');
}

// Erro: tropeço + poeira; interrompe a corrida.
function stageHurt() {
  if (!Stage.runner) return;
  Stage.runner.classList.remove('is-running');
  clearTimeout(Stage.idleTimer);
  spawnDust();
  oneShot('is-stumble', ACTION_MS.stumble);
}

// Posiciona a horda e ajusta a tensão. d01: 1 = longe (seguro), 0 = alcançado.
function stageSetChase(d01) {
  const d = Math.max(0, Math.min(1, d01));
  if (Stage.horde) {
    // de -54% (fora da tela) até 8% (encostando no corredor a ~56%)
    Stage.horde.style.left = (-54 + (1 - d) * 62) + '%';
  }
  if (Stage.danger) {
    // vinheta vermelha cresce quando a distância cai abaixo de 50%
    Stage.danger.style.opacity = d < 0.5 ? ((0.5 - d) / 0.5 * 0.85).toFixed(2) : '0';
  }
  if (Stage.root) Stage.root.classList.toggle('shake', d < 0.28);
}

// Susto ao ser pego (Clássico): tranco curto.
function stageGrab() {
  if (!Stage.root) return;
  Stage.root.classList.remove('grab');
  void Stage.root.offsetWidth;
  Stage.root.classList.add('grab');
  oneShot('is-stumble', ACTION_MS.stumble);
  clearTimeout(Stage.classTimers.grab);
  Stage.classTimers.grab = setTimeout(() => Stage.root.classList.remove('grab'), 460);
}

// ---- internos ----

function applyScroll() {
  if (Stage.scene) Stage.scene.style.setProperty('--scroll', Stage.scroll);
}

function oneShot(cls, dur) {
  const el = Stage.runner;
  el.classList.remove(cls);
  void el.offsetWidth; // reflow para reiniciar a animação
  el.classList.add(cls);
  clearTimeout(Stage.classTimers[cls]);
  Stage.classTimers[cls] = setTimeout(() => el.classList.remove(cls), dur + 40);
}

function triggerObstacle() {
  const o = Stage.obstacle;
  if (!o) return;
  o.classList.remove('go');
  void o.offsetWidth;
  o.classList.add('go');
  clearTimeout(Stage.classTimers.obstacle);
  Stage.classTimers.obstacle = setTimeout(() => o.classList.remove('go'), ACTION_MS.jump + 40);
}

function spawnSpeedLines() {
  if (!Stage.fx) return;
  for (let i = 0; i < 4; i++) {
    const l = document.createElement('div');
    l.className = 'speed-line';
    l.style.top = (24 + Math.random() * 90) + 'px';
    l.style.left = (40 + Math.random() * 28) + '%';
    l.style.width = (24 + Math.random() * 26) + 'px';
    l.style.animationDelay = (i * 40) + 'ms';
    Stage.fx.appendChild(l);
    setTimeout(() => l.remove(), 600);
  }
}

function spawnDust() {
  if (!Stage.fx) return;
  const d = document.createElement('div');
  d.className = 'dust';
  Stage.fx.appendChild(d);
  setTimeout(() => d.remove(), 460);
}

// Obstáculo original (barreira da pista) em SVG.
function renderObstacle() {
  return `
  <svg viewBox="0 0 40 44" class="obstacle-svg" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="40" rx="16" ry="4" fill="#000" opacity="0.25"/>
    <rect x="6" y="14" width="28" height="24" rx="4" fill="#d8472e" stroke="#8c2c1b" stroke-width="2"/>
    <rect x="6" y="20" width="28" height="6" fill="#f4f1e8"/>
    <rect x="6" y="30" width="28" height="6" fill="#f4f1e8"/>
    <rect x="17" y="6" width="6" height="12" rx="2" fill="#6b6f78"/>
  </svg>`;
}

// Horda de zumbis (5 figuras escalonadas).
function renderHorde() {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const delay = (i * 0.13).toFixed(2);
    const dy = (i % 2) * 4;
    s += `<div class="zombie" style="animation-delay:${delay}s; margin-bottom:${dy}px">${renderZombie()}</div>`;
  }
  return s;
}

// Zumbi original em SVG (braços esticados para a direita, atrás do corredor).
function renderZombie() {
  return `
  <svg viewBox="0 0 42 60" class="zombie-svg" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="21" cy="57" rx="13" ry="3" fill="#000" opacity="0.25"/>
    <rect x="14" y="40" width="6" height="17" rx="2" fill="#3f5a3a"/>
    <rect x="22" y="40" width="6" height="17" rx="2" fill="#35502f"/>
    <rect x="12" y="22" width="18" height="22" rx="4" fill="#4f7a45" stroke="#2f4a2a" stroke-width="1.5"/>
    <rect x="26" y="24" width="15" height="5" rx="2.5" fill="#5a8a4f"/>
    <rect x="26" y="31" width="12" height="5" rx="2.5" fill="#4f7a45"/>
    <circle cx="21" cy="14" r="9" fill="#6fa05f" stroke="#2f4a2a" stroke-width="1.5"/>
    <circle cx="18" cy="13" r="1.6" fill="#1a2417"/>
    <circle cx="24" cy="13" r="1.6" fill="#1a2417"/>
    <path d="M17 18 q4 2 8 0" stroke="#2f4a2a" stroke-width="1.2" fill="none"/>
  </svg>`;
}
