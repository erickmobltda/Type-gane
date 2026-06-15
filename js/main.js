// main.js — bootstrap, controle de telas e tela de seleção de layout.

const Screens = {
  current: 'select',
  show(name) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.add('active');
    this.current = name;
  },
};

function initSelectScreen() {
  const container = document.getElementById('layout-cards');
  container.innerHTML = '';

  LAYOUT_IDS.forEach((id) => {
    const layout = buildLayout(id);
    const card = document.createElement('button');
    card.className = 'layout-card';
    card.type = 'button';
    card.innerHTML = `
      <div class="layout-card-img">${renderKeyboard(layout, { compact: true })}</div>
      <div class="layout-card-info">
        <h3>${layout.name}</h3>
        <p>${layout.desc}</p>
        <span class="layout-card-pr">Recorde: ${loadPR(id)} WPM</span>
      </div>`;
    card.addEventListener('click', () => {
      Screens.show('game');
      startGame(id);
    });
    container.appendChild(card);
  });
}

function showGameOver(state, isNewPr) {
  document.getElementById('over-hits').textContent = state.hits;
  document.getElementById('over-misses').textContent = state.misses;
  document.getElementById('over-wpm').textContent = Math.round(state.wpm);
  document.getElementById('over-pr').textContent = state.pr;
  document.getElementById('over-newpr').classList.toggle('hidden', !isNewPr);
  Screens.show('over');
}

function wireButtons() {
  document.getElementById('btn-quit').addEventListener('click', () => {
    stopGame();
    initSelectScreen(); // atualiza recordes exibidos
    Screens.show('select');
  });
  document.getElementById('btn-restart').addEventListener('click', () => {
    Screens.show('game');
    startGame(Game.state.layoutId);
  });
  document.getElementById('btn-change').addEventListener('click', () => {
    initSelectScreen();
    Screens.show('select');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSelectScreen();
  wireButtons();
  Screens.show('select');
});
