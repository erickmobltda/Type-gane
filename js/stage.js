// stage.js — cena 2D de fuga noturna: o sobrevivente foge e a HORDA persegue.
// A posição da horda reflete a "distância" (chase). Erro = tropeço + a horda
// avança um tranco. Ser alcançado = a horda encosta e agarra. Reaproveita
// renderRunner() (character.js).

const Stage = {
  root: null, runner: null, obstacle: null, scene: null, fx: null,
  horde: null, danger: null,
  scroll: 0,
  idleTimer: null,
  classTimers: {},
};

const STAGE_STEP = 26;
const STAGE_DASH_STEP = 70;
const STAGE_IDLE_MS = 460;
const ACTION_MS = { jump: 620, dash: 500, stumble: 420, grab: 520 };

function stageInit(containerEl) {
  containerEl.innerHTML = `
    <div class="stage-scene">
      <div class="layer sky"></div>
      <div class="layer moon"></div>
      <div class="layer ruins"></div>
      <div class="layer fog"></div>
      <div class="layer ground"></div>
    </div>
    <div class="stage-actors">
      <div id="stage-horde" class="horde">${renderHorde()}</div>
      <div id="stage-obstacle" class="obstacle">${renderObstacle()}</div>
      <div id="stage-runner" class="runner">${renderRunner()}</div>
      <div id="stage-fx" class="stage-fx"></div>
    </div>
    <div class="vignette"></div>
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
  Stage.root.classList.remove('shake', 'grabbing');
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

function stageIdle() {
  if (Stage.runner) Stage.runner.classList.remove('is-running');
}

// Erro: o sobrevivente tropeça e a horda dá um tranco para frente.
function stageHurt() {
  if (!Stage.runner) return;
  Stage.runner.classList.remove('is-running');
  clearTimeout(Stage.idleTimer);
  spawnDust();
  oneShot('is-stumble', ACTION_MS.stumble);
  stageLurch();
}

// Tranco da horda (avanço breve, além do reposicionamento por distância).
function stageLurch() {
  const h = Stage.horde;
  if (!h) return;
  h.classList.remove('lurch');
  void h.offsetWidth;
  h.classList.add('lurch');
  clearTimeout(Stage.classTimers.lurch);
  Stage.classTimers.lurch = setTimeout(() => h.classList.remove('lurch'), 320);
}

// Posiciona a horda e ajusta a tensão. d01: 1 = longe (seguro), 0 = encostando.
function stageSetChase(d01) {
  const d = Math.max(0, Math.min(1, d01));
  if (Stage.horde) {
    // -54% (fora da tela) até 16% (encostando no sobrevivente, ~56%)
    Stage.horde.style.left = (-54 + (1 - d) * 70) + '%';
    Stage.horde.classList.toggle('near', d < 0.2);
  }
  if (Stage.danger) {
    Stage.danger.style.opacity = d < 0.55 ? (((0.55 - d) / 0.55) * 0.9).toFixed(2) : '0';
  }
  if (Stage.root) Stage.root.classList.toggle('shake', d < 0.24);
}

// Ser alcançado: a horda encosta de fato e agarra (susto + sacudida).
function stageGrab() {
  if (!Stage.root) return;
  if (Stage.horde) {
    Stage.horde.style.left = '30%'; // sobrepõe o sobrevivente
    Stage.horde.classList.add('lunge');
  }
  Stage.root.classList.remove('grabbing');
  void Stage.root.offsetWidth;
  Stage.root.classList.add('grabbing', 'shake');
  oneShot('is-grabbed', ACTION_MS.grab);
  clearTimeout(Stage.classTimers.grab);
  Stage.classTimers.grab = setTimeout(() => {
    Stage.root.classList.remove('grabbing');
    if (Stage.horde) Stage.horde.classList.remove('lunge');
  }, 480);
}

// ---- internos ----
function applyScroll() {
  if (Stage.scene) Stage.scene.style.setProperty('--scroll', Stage.scroll);
}

function oneShot(cls, dur) {
  const el = Stage.runner;
  el.classList.remove(cls);
  void el.offsetWidth;
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

// Lápide caída na fuga (obstáculo).
function renderObstacle() {
  return `
  <svg viewBox="0 0 40 46" class="obstacle-svg" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="42" rx="15" ry="4" fill="#000" opacity="0.35"/>
    <path d="M8 46 L8 18 Q8 6 20 6 Q32 6 32 18 L32 46 Z" fill="#4d5256" stroke="#23262a" stroke-width="2"/>
    <path d="M20 12 L20 22 M15 16 L25 16" stroke="#23262a" stroke-width="2"/>
    <path d="M11 30 h18 M11 35 h14" stroke="#2b2f33" stroke-width="1.4"/>
    <path d="M26 6 L23 46" stroke="#23262a" stroke-width="1" opacity="0.5"/>
  </svg>`;
}

// Horda: 6 figuras variadas (3 tipos), tamanhos e ritmos diferentes.
function renderHorde() {
  let s = '';
  const n = 6;
  for (let i = 0; i < n; i++) {
    const v = i % 3;
    const dur = (0.8 + (i % 4) * 0.13).toFixed(2);
    const delay = (i * 0.17).toFixed(2);
    const dy = (i % 2) * 5;
    const h = 56 + (i % 3) * 7;            // alturas 56 / 63 / 70
    const w = Math.round(h * 0.72);
    s += `<div class="zombie" style="--zdur:${dur}s; --zdelay:${delay}s; width:${w}px; height:${h}px; margin-bottom:${dy}px">${renderZombie(v)}</div>`;
  }
  return s;
}

const ZVAR = [
  { skin: '#869174', cloth: '#39463a', clothD: '#1f271e' },
  { skin: '#7e8a82', cloth: '#3a3340', clothD: '#221d28' },
  { skin: '#97a07c', cloth: '#46382e', clothD: '#261d16' },
];

// Zumbi macabro em SVG (curvado, braços/garras esticados, olhos fundos, sangue).
function renderZombie(variant) {
  const c = ZVAR[variant % 3];
  return `
  <svg viewBox="0 0 46 66" class="zombie-svg" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="23" cy="62" rx="13" ry="3" fill="#000" opacity="0.35"/>
    <rect x="16" y="44" width="6" height="18" rx="2" fill="${c.clothD}"/>
    <rect x="24" y="44" width="6" height="18" rx="2" fill="${c.cloth}"/>
    <rect x="22" y="59" width="10" height="4" rx="2" fill="#13100e"/>
    <path d="M12 24 L30 21 L32 46 L14 47 Z" fill="${c.cloth}" stroke="${c.clothD}" stroke-width="1.5"/>
    <path d="M17 30 h7 M17 34 h8 M18 38 h6" stroke="#6e1417" stroke-width="1.3" opacity="0.85"/>
    <path d="M26 41 q1 4 -1 8" stroke="#6e1417" stroke-width="2" fill="none"/>
    <g class="z-arm">
      <rect x="28" y="22" width="15" height="5" rx="2.5" fill="${c.skin}" transform="rotate(-7 28 24)"/>
      <path d="M43 20 l3 -1 M43 23 l3 0 M43 26 l3 1" stroke="${c.skin}" stroke-width="2" stroke-linecap="round"/>
    </g>
    <rect x="29" y="31" width="13" height="5" rx="2.5" fill="${c.skin}"/>
    <path d="M42 30 l3 -1 M42 33 l3 0 M42 36 l3 1" stroke="${c.skin}" stroke-width="2" stroke-linecap="round"/>
    <g transform="rotate(-8 22 14)">
      <circle cx="22" cy="14" r="9" fill="${c.skin}" stroke="${c.clothD}" stroke-width="1.5"/>
      <ellipse cx="18" cy="13" rx="2.2" ry="2.6" fill="#0b0e09"/>
      <ellipse cx="25" cy="13" rx="2.2" ry="2.6" fill="#0b0e09"/>
      <circle cx="18" cy="13" r="0.8" fill="#cfe06a"/>
      <circle cx="25" cy="13" r="0.8" fill="#cfe06a"/>
      <path d="M17 18 q5 4 9 0 l-1 4 q-3 2 -7 0 z" fill="#22090c"/>
      <path d="M19 20 l1 2 M22 21 l0 2 M25 20 l-1 2" stroke="#b9b0a0" stroke-width="0.8"/>
      <path d="M20 22 q1 3 0 5" stroke="#7a1417" stroke-width="1.3" fill="none"/>
    </g>
  </svg>`;
}
