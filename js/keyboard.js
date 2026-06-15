// keyboard.js — render do diagrama SVG de um teclado, com destaque da tecla alvo.

// Gera o SVG de um layout já construído.
// opts:
//   targetChar — char a destacar (cor do dedo)
//   compact    — true para miniatura (cards de seleção): sem rótulos pequenos
function renderKeyboard(layout, opts = {}) {
  const { targetChar = null, compact = false } = opts;
  const cls = compact ? 'kbd-svg kbd-compact' : 'kbd-svg';
  let svg = `<svg viewBox="${layout.viewBox}" class="${cls}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">`;

  // Encoder (knob) do Sofle, desenhado entre as metades.
  if (layout.hasEncoder) {
    const cx = 6.85 * UNIT, cy = 1.4 * UNIT;
    svg += `<circle cx="${cx}" cy="${cy}" r="${KEY * 0.55}" fill="#1d160f" stroke="#caa24a" stroke-width="2"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${KEY * 0.30}" fill="#2b2118" stroke="#8c6a2e" stroke-width="1.5"/>`;
  }

  layout.keys.forEach((k) => {
    const finger = FINGERS[k.finger];
    const isTarget = targetChar != null && k.char === targetChar;
    const fill = isTarget ? finger.color : (k.isLetter ? '#241c13' : '#1a140d');
    const stroke = isTarget ? '#fff7d6' : '#5e4a2c';
    const sw = isTarget ? 3.5 : 1.4;
    const glow = isTarget ? ' filter="url(#keyGlow)"' : '';

    // Faixa de cor do dedo na base da tecla (sempre visível, ajuda a memorizar).
    svg += `<g${glow}>`;
    svg += `<rect x="${k.x}" y="${k.y}" width="${k.w}" height="${k.h}" rx="7"
             fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    if (!isTarget) {
      svg += `<rect x="${k.x}" y="${k.y + k.h - 6}" width="${k.w}" height="6" rx="3"
               fill="${finger.color}" opacity="0.85"/>`;
    }
    if (!compact) {
      const txtColor = isTarget ? '#1a140d' : '#e8dcc0';
      const fs = k.label.length > 1 ? 12 : 18;
      svg += `<text x="${k.x + k.w / 2}" y="${k.y + k.h / 2 + (fs / 3)}"
               text-anchor="middle" font-size="${fs}" font-weight="700"
               fill="${txtColor}" font-family="monospace">${escapeXml(k.label)}</text>`;
    }
    svg += `</g>`;
  });

  svg += '</svg>';
  return svg;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
