// stage.js — cena 2D de corrida infinita (estilo Chrome Dino / Canabalt).
// O corredor avança enquanto o jogador digita; em marcos PULA um obstáculo
// ou solta um DASH (especial). Sem digitar por um instante → idle.
// Erro = tropeço. Reaproveita renderRunner() (character.js) para o sprite.

const Stage = {
  root: null, runner: null, obstacle: null, scene: null, fx: null,
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
      <div id="stage-obstacle" class="obstacle">${renderObstacle()}</div>
      <div id="stage-runner" class="runner">${renderRunner()}</div>
      <div id="stage-fx" class="stage-fx"></div>
    </div>`;

  Stage.root = containerEl;
  Stage.scene = containerEl.querySelector('.stage-scene');
  Stage.runner = containerEl.querySelector('#stage-runner');
  Stage.obstacle = containerEl.querySelector('#stage-obstacle');
  Stage.fx = containerEl.querySelector('#stage-fx');

  Stage.scroll = 0;
  applyScroll();
  clearTimeout(Stage.idleTimer);
  Object.values(Stage.classTimers).forEach(clearTimeout);
  Stage.classTimers = {};
  Stage.runner.className = 'runner';
}

// Avança um passo + dispara a ação ('run' | 'jump' | 'dash').
function stageStep(action) {
  if (!Stage.runner) return;

  Stage.scroll += STAGE_STEP + (action === 'dash' ? STAGE_DASH_STEP : 0);
  applyScroll();

  // mantém o ciclo de corrida enquanto houver digitação
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
  // 'run' não precisa de classe extra.
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

// ---- internos ----

function applyScroll() {
  if (Stage.scene) Stage.scene.style.setProperty('--scroll', Stage.scroll);
}

// Adiciona uma classe transitória ao corredor e a remove após `dur` (permite repetir).
function oneShot(cls, dur) {
  const el = Stage.runner;
  el.classList.remove(cls);
  void el.offsetWidth; // reflow para reiniciar a animação
  el.classList.add(cls);
  clearTimeout(Stage.classTimers[cls]);
  Stage.classTimers[cls] = setTimeout(() => el.classList.remove(cls), dur + 40);
}

// Faz um obstáculo cruzar a pista (sincronizado com o pulo).
function triggerObstacle() {
  const o = Stage.obstacle;
  if (!o) return;
  o.classList.remove('go');
  void o.offsetWidth;
  o.classList.add('go');
  clearTimeout(Stage.classTimers.obstacle);
  Stage.classTimers.obstacle = setTimeout(() => o.classList.remove('go'), ACTION_MS.jump + 40);
}

// Linhas de velocidade do dash.
function spawnSpeedLines() {
  if (!Stage.fx) return;
  for (let i = 0; i < 4; i++) {
    const l = document.createElement('div');
    l.className = 'speed-line';
    l.style.top = (24 + Math.random() * 90) + 'px';
    l.style.left = (45 + Math.random() * 30) + '%';
    l.style.width = (24 + Math.random() * 26) + 'px';
    l.style.animationDelay = (i * 40) + 'ms';
    Stage.fx.appendChild(l);
    setTimeout(() => l.remove(), 600);
  }
}

// Nuvem de poeira no tropeço.
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
