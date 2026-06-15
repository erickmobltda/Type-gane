// main.js — bootstrap, controle de telas, seleção de teclado/modo e navegação por teclado.

const Screens = {
  current: 'select',
  show(name) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.add('active');
    this.current = name;
  },
};

// Estado da tela de seleção (navegável por teclado).
const SelectUI = { mode: 'classic', focus: 0 };
const MODES = [
  { id: 'classic', name: 'Clássico', desc: '3 vidas · erro tira vida · acaba ao zerar', key: 'C' },
  { id: 'free', name: 'Treino livre', desc: 'erre à vontade · acaba após 5s sem digitar', key: 'T' },
];

// Último jogo iniciado (para "jogar de novo").
let lastGame = { layoutId: LAYOUT_IDS[0], mode: 'classic' };

// ---------- Tela de seleção ----------

function initSelectScreen() {
  renderModeSelect();

  const container = document.getElementById('layout-cards');
  container.innerHTML = '';

  LAYOUT_IDS.forEach((id, idx) => {
    const layout = buildLayout(id);
    const card = document.createElement('div');
    card.className = 'layout-card';
    card.setAttribute('role', 'button');
    card.dataset.idx = String(idx);
    card.innerHTML = `
      <div class="layout-card-badge">${idx + 1}</div>
      <div class="layout-card-img">${renderKeyboard(layout, { compact: true })}</div>
      <div class="layout-card-info">
        <h3>${layout.name}</h3>
        <p>${layout.desc}</p>
        <span class="layout-card-pr">Recorde: ${loadPR(id)} WPM</span>
      </div>`;
    card.addEventListener('click', () => startSelected(idx));
    card.addEventListener('mousemove', () => { SelectUI.focus = idx; updateSelectHighlight(); });
    container.appendChild(card);
  });

  updateSelectHighlight();
}

function renderModeSelect() {
  const wrap = document.getElementById('mode-select');
  wrap.innerHTML = MODES.map((m) => `
    <div class="mode-pill" data-mode="${m.id}" role="button">
      <span class="mode-key">${m.key}</span>
      <span class="mode-name">${m.name}</span>
      <span class="mode-desc">${m.desc}</span>
    </div>`).join('');
  wrap.querySelectorAll('.mode-pill').forEach((el) => {
    el.addEventListener('click', () => setMode(el.dataset.mode));
  });
  updateModeHighlight();
}

function setMode(mode) {
  SelectUI.mode = mode === 'free' ? 'free' : 'classic';
  updateModeHighlight();
}

function updateModeHighlight() {
  document.querySelectorAll('.mode-pill').forEach((el) => {
    el.classList.toggle('selected', el.dataset.mode === SelectUI.mode);
  });
}

function updateSelectHighlight() {
  document.querySelectorAll('.layout-card').forEach((el) => {
    el.classList.toggle('focused', Number(el.dataset.idx) === SelectUI.focus);
  });
}

function startSelected(idx) {
  const layoutId = LAYOUT_IDS[idx];
  lastGame = { layoutId, mode: SelectUI.mode };
  saveLast(layoutId, SelectUI.mode); // lembra entre sessões
  Screens.show('game');
  startGame(layoutId, SelectUI.mode);
}

function handleSelectKeys(e) {
  const k = e.key;
  if (k === '1' || k === '2' || k === '3') {
    const idx = Number(k) - 1;
    if (idx < LAYOUT_IDS.length) { e.preventDefault(); startSelected(idx); }
  } else if (k === 'ArrowRight') {
    e.preventDefault(); SelectUI.focus = (SelectUI.focus + 1) % LAYOUT_IDS.length; updateSelectHighlight();
  } else if (k === 'ArrowLeft') {
    e.preventDefault(); SelectUI.focus = (SelectUI.focus - 1 + LAYOUT_IDS.length) % LAYOUT_IDS.length; updateSelectHighlight();
  } else if (k === 'ArrowUp' || k === 'ArrowDown') {
    e.preventDefault(); setMode(SelectUI.mode === 'classic' ? 'free' : 'classic');
  } else if (k === 'c' || k === 'C') {
    setMode('classic');
  } else if (k === 't' || k === 'T') {
    setMode('free');
  } else if (k === 'Enter' || k === ' ') {
    e.preventDefault(); startSelected(SelectUI.focus);
  }
}

// ---------- Tela de fim de jogo ----------

function showGameOver(state, isNewPr) {
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

  document.getElementById('over-title').textContent =
    state.mode === 'free' ? 'Tempo esgotado!' : 'Fim de jogo';
  document.getElementById('over-hits').textContent = state.hits;
  document.getElementById('over-misses').textContent = state.misses;
  document.getElementById('over-acc').textContent = accuracy(state) + '%';
  document.getElementById('over-wpm').textContent = Math.round(state.wpm);
  document.getElementById('over-pr').textContent = state.pr;
  document.getElementById('over-newpr').classList.toggle('hidden', !isNewPr);

  // Evolução do WPM: registra esta partida e desenha a curva do teclado.
  const hist = addHistory(state);
  document.getElementById('over-chart').innerHTML = renderWpmChart(hist);
  const wpms = hist.map((h) => h.wpm);
  const best = Math.max(...wpms);
  const avg = Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length);
  document.getElementById('over-chart-cap').textContent =
    `· melhor ${best} · média ${avg} · ${hist.length} jogo(s)`;

  document.getElementById('over-missed').innerHTML =
    `<h3 class="over-sub">Teclas que você mais errou</h3>
     <div class="missed-list">${renderMissedKeys(state)}</div>`;
  document.getElementById('over-tips').innerHTML =
    `<h3 class="over-sub">Dicas para melhorar</h3>
     <ul>${buildTips(state).map((t) => `<li>${t}</li>`).join('')}</ul>`;

  Screens.show('over');
}

function keyInfo(layoutId, char) {
  return buildLayout(layoutId).keys.find((k) => k.char === char);
}

function renderMissedKeys(state) {
  const top = topMissedKeys(state, 6);
  if (!top.length) return '<p class="over-none">Nenhum erro registrado 🎉</p>';
  return top.map(({ char, count }) => {
    const k = keyInfo(state.layoutId, char);
    const f = k ? FINGERS[k.finger] : null;
    const color = f ? f.color : '#ccc';
    const fname = f ? `${f.name} · ${k.hand === 'L' ? 'esq.' : 'dir.'}` : '';
    return `<div class="missed-chip">
      <span class="missed-key" style="border-color:${color};color:${color}">${char.toUpperCase()}</span>
      <span class="missed-meta"><strong>${count}×</strong>${fname ? ' · ' + fname : ''}</span>
    </div>`;
  }).join('');
}

function buildTips(state) {
  const tips = [];
  const top = topMissedKeys(state, 6);

  if (!top.length) {
    tips.push('Zero erros! Aumente o ritmo ou tente um teclado diferente para evoluir.');
  } else {
    // Qual dedo concentra mais erros?
    const byFinger = {};
    top.forEach(({ char, count }) => {
      const k = keyInfo(state.layoutId, char);
      if (k) byFinger[k.finger] = (byFinger[k.finger] || 0) + count;
    });
    const worst = Object.entries(byFinger).sort((a, b) => b[1] - a[1])[0];
    if (worst) {
      const f = FINGERS[worst[0]];
      tips.push(`Seu dedo que mais erra é o <strong style="color:${f.color}">${f.name}</strong>. Faça séries lentas focando nele.`);
    }
    const letters = top.map((t) => t.char.toUpperCase()).join(', ');
    tips.push(`Repita devagar as teclas mais difíceis (${letters}) até acertar sem pensar.`);
  }

  tips.push('Volte sempre os dedos à fileira do meio (home row) depois de cada tecla.');
  tips.push('Precisão antes de velocidade: digite sem olhar para o teclado.');
  return tips;
}

function handleOverKeys(e) {
  const k = e.key;
  if (k === 'Enter' || k === 'r' || k === 'R') {
    e.preventDefault();
    Screens.show('game');
    startGame(lastGame.layoutId, lastGame.mode);
  } else if (k === 'Escape' || k === 'c' || k === 'C') {
    e.preventDefault();
    initSelectScreen();
    Screens.show('select');
  }
}

// ---------- Botões (mouse) ----------

function wireButtons() {
  document.getElementById('btn-quit').addEventListener('click', () => {
    stopGame();
    initSelectScreen();
    Screens.show('select');
  });
  document.getElementById('btn-restart').addEventListener('click', () => {
    Screens.show('game');
    startGame(lastGame.layoutId, lastGame.mode);
  });
  document.getElementById('btn-change').addEventListener('click', () => {
    initSelectScreen();
    Screens.show('select');
  });
}

// ---------- Despacho global de teclado por tela ----------
// (a tela de jogo tem seu próprio listener em game.js)
function globalKeys(e) {
  if (Screens.current === 'select') handleSelectKeys(e);
  else if (Screens.current === 'over') handleOverKeys(e);
}

document.addEventListener('DOMContentLoaded', () => {
  // Restaura o último teclado/modo usados (localStorage).
  const last = loadLast();
  if (last) {
    SelectUI.mode = last.mode === 'free' ? 'free' : 'classic';
    const idx = LAYOUT_IDS.indexOf(last.layoutId);
    if (idx >= 0) SelectUI.focus = idx;
    lastGame = { layoutId: last.layoutId, mode: SelectUI.mode };
  }

  initSelectScreen();
  wireButtons();
  document.addEventListener('keydown', globalKeys);
  Screens.show('select');
});
