// stage.js — cena 2D side-scroller (estilo Mario World).
// O herói anda enquanto o jogador digita; a cada acerto dá um passo e, em marcos,
// ataca um inimigo, pula ou solta um especial. Sem digitar por um instante → idle.
// Reaproveita renderHero() (character.js) para o sprite do herói.

const Stage = {
  root: null, hero: null, enemy: null, scene: null, fx: null,
  scroll: 0,
  idleTimer: null,
  classTimers: {}, // timers para remover classes "one-shot"
};

const STAGE_STEP = 26;       // px de rolagem por acerto
const STAGE_IDLE_MS = 460;   // tempo parado até voltar ao idle
const ACTION_MS = { attack: 360, jump: 560, special: 760, hurt: 360 };

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
      <div id="stage-enemy" class="enemy">${renderEnemy()}</div>
      <div id="stage-hero" class="hero hero-stage">${renderHero()}</div>
      <div id="stage-fx" class="stage-fx"></div>
    </div>`;

  Stage.root = containerEl;
  Stage.scene = containerEl.querySelector('.stage-scene');
  Stage.hero = containerEl.querySelector('#stage-hero');
  Stage.enemy = containerEl.querySelector('#stage-enemy');
  Stage.fx = containerEl.querySelector('#stage-fx');

  Stage.scroll = 0;
  applyScroll();
  clearTimeout(Stage.idleTimer);
  Object.values(Stage.classTimers).forEach(clearTimeout);
  Stage.classTimers = {};
  Stage.hero.className = 'hero hero-stage';
}

// Avança um passo + dispara a animação da ação ('walk' | 'attack' | 'jump' | 'special').
function stageStep(action) {
  if (!Stage.hero) return;

  // rola o cenário (com transição CSS → parece contínuo ao digitar rápido)
  Stage.scroll += STAGE_STEP;
  applyScroll();

  // mantém o ciclo de caminhada enquanto houver digitação
  Stage.hero.classList.add('is-walking');
  clearTimeout(Stage.idleTimer);
  Stage.idleTimer = setTimeout(stageIdle, STAGE_IDLE_MS);

  if (action === 'attack') {
    triggerEnemyHit(false);
    oneShot('is-attack', ACTION_MS.attack);
  } else if (action === 'jump') {
    oneShot('is-jump', ACTION_MS.jump);
  } else if (action === 'special') {
    triggerEnemyHit(true);
    spawnProjectile();
    oneShot('is-special', ACTION_MS.special);
  }
  // 'walk' não precisa de classe extra: o passo + is-walking já bastam.
}

// Volta o herói para a pose parada.
function stageIdle() {
  if (Stage.hero) Stage.hero.classList.remove('is-walking');
}

// Dano: knockback + flash, e some o combo de caminhada.
function stageHurt() {
  if (!Stage.hero) return;
  Stage.hero.classList.remove('is-walking');
  clearTimeout(Stage.idleTimer);
  oneShot('is-hurt', ACTION_MS.hurt);
}

// ---- internos ----

function applyScroll() {
  if (Stage.scene) Stage.scene.style.setProperty('--scroll', Stage.scroll);
}

// Adiciona uma classe transitória ao herói e a remove após `dur` (permite repetir).
function oneShot(cls, dur) {
  const el = Stage.hero;
  el.classList.remove(cls);
  void el.offsetWidth; // reflow para reiniciar a animação
  el.classList.add(cls);
  clearTimeout(Stage.classTimers[cls]);
  Stage.classTimers[cls] = setTimeout(() => el.classList.remove(cls), dur + 40);
}

// Mostra o inimigo à frente e o "derrota" (poof). special=true dá um destaque maior.
function triggerEnemyHit(special) {
  const e = Stage.enemy;
  if (!e) return;
  e.classList.remove('show', 'struck', 'special');
  void e.offsetWidth;
  e.classList.add('show');
  if (special) e.classList.add('special');
  // pequeno atraso para o golpe "alcançar" o inimigo
  clearTimeout(Stage.classTimers.enemy);
  Stage.classTimers.enemy = setTimeout(() => {
    e.classList.add('struck');
    setTimeout(() => e.classList.remove('show', 'struck', 'special'), 420);
  }, 140);
}

// Projétil luminoso do especial.
function spawnProjectile() {
  if (!Stage.fx) return;
  const p = document.createElement('div');
  p.className = 'projectile';
  Stage.fx.appendChild(p);
  setTimeout(() => p.remove(), 700);
}

// Inimigo original simples (slime) em SVG.
function renderEnemy() {
  return `
  <svg viewBox="0 0 60 56" class="enemy-svg" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="30" cy="50" rx="20" ry="5" fill="#000" opacity="0.25"/>
    <path d="M8 44 Q6 18 30 16 Q54 18 52 44 Z" fill="#9b59b6" stroke="#6f3d86" stroke-width="2"/>
    <path d="M8 44 Q6 30 30 30 Q54 30 52 44 Z" fill="#b06fce" opacity="0.6"/>
    <circle cx="22" cy="34" r="4" fill="#fff"/><circle cx="22" cy="35" r="2" fill="#241a2e"/>
    <circle cx="38" cy="34" r="4" fill="#fff"/><circle cx="38" cy="35" r="2" fill="#241a2e"/>
    <path d="M24 42 Q30 46 36 42" stroke="#3a2347" stroke-width="2" fill="none"/>
  </svg>`;
}
