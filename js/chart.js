// chart.js — gráfico SVG simples da evolução do WPM entre partidas.

// history: [{ wpm, acc, mode, t }] do mais antigo ao mais recente.
function renderWpmChart(history) {
  if (!history || history.length === 0) {
    return '<p class="over-none">Sem histórico ainda — jogue para começar a registrar.</p>';
  }

  const W = 320, H = 130;
  const pad = { l: 30, r: 10, t: 12, b: 22 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const vals = history.map((h) => h.wpm);
  const maxV = Math.max(10, ...vals);
  const n = history.length;

  const x = (i) => pad.l + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v) => pad.t + plotH - (v / maxV) * plotH;

  let svg = `<svg viewBox="0 0 ${W} ${H}" class="wpm-chart" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">`;

  // linhas de grade (0, metade, máximo) + rótulos do eixo Y
  [0, Math.round(maxV / 2), maxV].forEach((v) => {
    const gy = y(v);
    svg += `<line x1="${pad.l}" y1="${gy}" x2="${W - pad.r}" y2="${gy}" stroke="#2f4434" stroke-width="1"/>`;
    svg += `<text x="${pad.l - 5}" y="${gy + 3}" text-anchor="end" class="chart-axis">${v}</text>`;
  });

  if (n === 1) {
    svg += `<circle cx="${x(0)}" cy="${y(vals[0])}" r="5" fill="#d4af37"/>`;
    svg += `<text x="${W / 2}" y="${H - 4}" text-anchor="middle" class="chart-axis">jogue mais para ver a curva</text>`;
    return svg + '</svg>';
  }

  // área sob a curva
  const linePts = history.map((h, i) => `${x(i)},${y(h.wpm)}`).join(' ');
  const areaPts = `${pad.l},${pad.t + plotH} ${linePts} ${x(n - 1)},${pad.t + plotH}`;
  svg += `<polygon points="${areaPts}" fill="#d4af37" opacity="0.12"/>`;
  svg += `<polyline points="${linePts}" fill="none" stroke="#d4af37" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;

  // pontos (último destacado)
  history.forEach((h, i) => {
    const last = i === n - 1;
    svg += `<circle cx="${x(i)}" cy="${y(h.wpm)}" r="${last ? 4.5 : 2.6}"
             fill="${last ? '#fff7d6' : '#caa24a'}" stroke="#d4af37" stroke-width="${last ? 2 : 1}"/>`;
  });
  // valor do último ponto
  const lv = vals[n - 1];
  svg += `<text x="${x(n - 1)}" y="${y(lv) - 8}" text-anchor="middle" class="chart-last">${lv}</text>`;

  svg += `<text x="${W / 2}" y="${H - 4}" text-anchor="middle" class="chart-axis">partidas (antigas → recentes)</text>`;
  return svg + '</svg>';
}
