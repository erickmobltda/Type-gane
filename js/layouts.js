// layouts.js — definição em DADOS dos teclados split e geração das posições (SVG).
// Cada layout vira uma lista de teclas { char, label, finger, hand, x, y, w, h }.

const UNIT = 50;     // espaçamento entre teclas (px)
const KEY = 44;      // tamanho da tecla (px)
const HALF_GAP = 1.7; // vão central entre as metades (em unidades de tecla)

// Dedo por coluna (mão esquerda, da coluna externa -> interna).
const FINGER_BY_COL_L = ['pinky', 'pinky', 'ring', 'middle', 'index', 'index'];
// Stagger vertical por coluna (em unidades; >0 = mais para baixo).
// Médio mais alto, mindinho/índice interno mais baixos — formato ergonômico.
const STAGGER_L = [0.35, 0.35, 0.10, 0.0, 0.20, 0.32];

// Mão direita é o espelho.
const FINGER_BY_COL_R = [...FINGER_BY_COL_L].reverse(); // index,index,middle,ring,pinky,pinky
const STAGGER_R = [...STAGGER_L].reverse();

// Rótulos de exibição para teclas não-alfabéticas.
const SPECIAL_LABELS = {
  tab: '⇥', esc: 'Esc', sh: '⇧', ctl: 'Ctrl', gui: '◆', bspc: '⌫',
  ent: '⏎', spc: '␣', lwr: 'Lo', rse: 'Ra', alt: 'Alt', "\\": '\\',
  del: 'Del', app: '☰',
};

// Definição crua de cada teclado: linhas (cada célula = char/código) por metade.
const KEYBOARDS = {
  corne: {
    name: 'Corne',
    desc: '42 teclas · 3×6 + 3 polegares',
    hasNumberRow: false,
    hasEncoder: false,
    rows: [
      { L: ['tab', 'q', 'w', 'e', 'r', 't'], R: ['y', 'u', 'i', 'o', 'p', 'bspc'] },
      { L: ['esc', 'a', 's', 'd', 'f', 'g'], R: ['h', 'j', 'k', 'l', ';', "'"] },
      { L: ['sh', 'z', 'x', 'c', 'v', 'b'], R: ['n', 'm', ',', '.', '/', 'sh'] },
    ],
    thumbs: { L: ['gui', 'lwr', 'spc'], R: ['ent', 'rse', 'alt'] },
  },
  lily58: {
    name: 'Lily58',
    desc: '58 teclas · linha numérica + 3×6 + 4 polegares',
    hasNumberRow: true,
    hasEncoder: false,
    rows: [
      { L: ['esc', '1', '2', '3', '4', '5'], R: ['6', '7', '8', '9', '0', 'bspc'] },
      { L: ['tab', 'q', 'w', 'e', 'r', 't'], R: ['y', 'u', 'i', 'o', 'p', '\\'] },
      { L: ['ctl', 'a', 's', 'd', 'f', 'g'], R: ['h', 'j', 'k', 'l', ';', "'"] },
      { L: ['sh', 'z', 'x', 'c', 'v', 'b'], R: ['n', 'm', ',', '.', '/', 'sh'] },
    ],
    thumbs: { L: ['gui', 'spc'], R: ['ent', 'alt'] },
  },
  sofle: {
    name: 'Sofle',
    desc: '58 teclas · linha numérica + 3×6 + 5 polegares + encoder',
    hasNumberRow: true,
    hasEncoder: true,
    rows: [
      { L: ['esc', '1', '2', '3', '4', '5'], R: ['6', '7', '8', '9', '0', 'bspc'] },
      { L: ['tab', 'q', 'w', 'e', 'r', 't'], R: ['y', 'u', 'i', 'o', 'p', 'bspc'] },
      { L: ['ctl', 'a', 's', 'd', 'f', 'g'], R: ['h', 'j', 'k', 'l', ';', "'"] },
      { L: ['sh', 'z', 'x', 'c', 'v', 'b'], R: ['n', 'm', ',', '.', '/', 'sh'] },
    ],
    thumbs: { L: ['gui', 'lwr', 'spc'], R: ['ent', 'rse'] },
  },
};

// Gera a lista de teclas posicionadas para um id de layout.
function buildLayout(id) {
  const def = KEYBOARDS[id];
  if (!def) throw new Error('Layout desconhecido: ' + id);

  const keys = [];
  const leftWidth = 6 * UNIT;                 // largura de uma metade
  const rightOriginCol = 6 + HALF_GAP;        // coluna inicial da metade direita

  def.rows.forEach((row, r) => {
    // Metade esquerda
    row.L.forEach((code, c) => {
      keys.push(makeKey(code, 'L', FINGER_BY_COL_L[c], c * UNIT, (r + STAGGER_L[c]) * UNIT));
    });
    // Metade direita
    row.R.forEach((code, c) => {
      const x = (rightOriginCol + c) * UNIT;
      keys.push(makeKey(code, 'R', FINGER_BY_COL_R[c], x, (r + STAGGER_R[c]) * UNIT));
    });
  });

  // Polegares — arco abaixo das metades, próximos do centro.
  const thumbRowY = (def.rows.length + 0.35) * UNIT;
  placeThumbs(keys, def.thumbs.L, 'L', 3 * UNIT, thumbRowY, +1);
  const rightThumbStart = (rightOriginCol + 2) * UNIT;
  placeThumbs(keys, def.thumbs.R, 'R', rightThumbStart, thumbRowY, -1);

  // viewBox
  const xs = keys.map((k) => k.x);
  const ys = keys.map((k) => k.y);
  const minX = Math.min(...xs) - 8;
  const minY = Math.min(...ys) - 8;
  const maxX = Math.max(...xs) + KEY + 8;
  const maxY = Math.max(...ys) + KEY + 8;

  return {
    id,
    name: def.name,
    desc: def.desc,
    hasEncoder: def.hasEncoder,
    keys,
    viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (rightOriginCol * UNIT) / 2 + (6 * UNIT) / 2 - UNIT, // referência do encoder
  };
}

function placeThumbs(keys, codes, hand, startX, y, dir) {
  // Distribui as teclas de polegar em arco suave a partir de startX.
  codes.forEach((code, i) => {
    const x = startX + dir * i * (UNIT * 0.95);
    const lift = Math.abs(i) * 6; // leve curva
    keys.push(makeKey(code, hand, 'thumb', x, y + lift));
  });
}

function makeKey(code, hand, finger, x, y) {
  const isLetter = /^[a-z]$/.test(code);
  const label = isLetter ? code.toUpperCase() : (SPECIAL_LABELS[code] || code.toUpperCase());
  return {
    char: code,        // o que precisa ser digitado (para teclas reais)
    label,             // texto exibido na tecla
    finger,
    hand,
    x, y, w: KEY, h: KEY,
    isLetter,
  };
}

// Conjunto de teclas "jogáveis" (letras a–z) de um layout construído.
function letterPool(layout) {
  return layout.keys.filter((k) => k.isLetter);
}

const LAYOUT_IDS = ['sofle', 'corne', 'lily58'];
