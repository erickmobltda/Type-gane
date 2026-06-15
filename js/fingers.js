// fingers.js — mapa de dedos (nome em PT + cor) e render do guia de mãos em SVG.

const FINGERS = {
  pinky:  { name: 'Mindinho',  short: 'Min', color: '#e74c3c' },
  ring:   { name: 'Anelar',    short: 'Ane', color: '#e67e22' },
  middle: { name: 'Médio',     short: 'Méd', color: '#2ecc71' },
  index:  { name: 'Indicador', short: 'Ind', color: '#3498db' },
  thumb:  { name: 'Polegar',   short: 'Pol', color: '#9b59b6' },
};

// Ordem dos dedos da esquerda para a direita em cada mão (visual).
// Mão esquerda: mindinho, anelar, médio, indicador, polegar.
// Mão direita:  polegar, indicador, médio, anelar, mindinho.
const HAND_FINGER_ORDER = {
  L: ['pinky', 'ring', 'middle', 'index', 'thumb'],
  R: ['thumb', 'index', 'middle', 'ring', 'pinky'],
};

// Desenha as duas mãos estilizadas em SVG, destacando (hand, finger) ativo.
function renderHands(activeHand, activeFinger) {
  const w = 360, h = 180;
  let svg = `<svg viewBox="0 0 ${w} ${h}" class="hands-svg" xmlns="http://www.w3.org/2000/svg">`;
  svg += drawHand('L', 20, activeHand, activeFinger);
  svg += drawHand('R', 200, activeHand, activeFinger);
  svg += '</svg>';
  return svg;
}

function drawHand(hand, ox, activeHand, activeFinger) {
  const order = HAND_FINGER_ORDER[hand];
  const palmW = 140, palmTop = 110, palmH = 50;
  let s = `<g>`;
  // Palma
  s += `<rect x="${ox}" y="${palmTop}" width="${palmW}" height="${palmH}" rx="14"
         fill="#2b2118" stroke="#7a5c33" stroke-width="2"/>`;

  // Quatro dedos (todos menos o polegar) saem do topo da palma.
  const longFingers = order.filter((f) => f !== 'thumb');
  // Mantém a ordem visual física: para a mão direita o polegar fica à esquerda,
  // então os dedos longos ocupam a parte direita da palma.
  const startX = hand === 'L' ? ox + 8 : ox + 40;
  const slot = 23;
  // Alturas relativas (médio mais alto, mindinho mais baixo) por nome de dedo.
  const fingerHeights = { pinky: 46, ring: 64, middle: 72, index: 58, thumb: 40 };

  longFingers.forEach((f, i) => {
    const fx = startX + i * slot;
    const fh = fingerHeights[f];
    const fy = palmTop - fh + 4;
    const active = hand === activeHand && f === activeFinger;
    s += fingerRect(fx, fy, 16, fh, FINGERS[f].color, active);
  });

  // Polegar — lateral interna (perto do centro do teclado).
  const thumbActive = hand === activeHand && activeFinger === 'thumb';
  const thx = hand === 'L' ? ox + palmW - 18 : ox - 16;
  s += `<g transform="translate(${thx + 8} ${palmTop + 18}) rotate(${hand === 'L' ? -45 : 45})">`;
  s += fingerRect(-8, -34, 16, 40, FINGERS.thumb.color, thumbActive);
  s += `</g>`;

  // Rótulo da mão
  s += `<text x="${ox + palmW / 2}" y="${palmTop + palmH + 18}" text-anchor="middle"
         class="hand-label">${hand === 'L' ? 'Esquerda' : 'Direita'}</text>`;
  s += `</g>`;
  return s;
}

function fingerRect(x, y, w, h, color, active) {
  const fill = active ? color : '#3a2e22';
  const stroke = active ? '#fff7d6' : '#6b5234';
  const sw = active ? 3 : 1.5;
  const glow = active ? ' style="filter:url(#fingerGlow)"' : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"
           fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${glow}/>`;
}
