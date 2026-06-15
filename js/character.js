// character.js — corredor protagonista (robô esportivo original) em SVG.
// Estados visuais via classes no contêiner: is-running / is-jump / is-dash / is-stumble.
// viewBox 120x150 (mantém o posicionamento do palco).

function renderRunner() {
  return `
  <svg viewBox="0 0 120 150" class="runner-svg" xmlns="http://www.w3.org/2000/svg">
    <!-- sombra -->
    <ellipse cx="60" cy="142" rx="28" ry="6" fill="#000" opacity="0.3"/>

    <!-- braço de trás -->
    <g class="arm arm-l">
      <rect x="45" y="78" width="9" height="26" rx="4.5" fill="#39414f"/>
      <rect x="44" y="100" width="11" height="9" rx="4" fill="#2b323d"/>
    </g>

    <!-- pernas (agrupadas para o ciclo de corrida) -->
    <g class="runner-legs">
      <g class="leg leg-l">
        <rect x="50" y="104" width="11" height="28" rx="5" fill="#3a4250"/>
        <rect x="47" y="128" width="18" height="9" rx="4" fill="#e8722e"/>
      </g>
      <g class="leg leg-r">
        <rect x="62" y="104" width="11" height="28" rx="5" fill="#4a5364"/>
        <rect x="59" y="128" width="18" height="9" rx="4" fill="#ff8a45"/>
      </g>
    </g>

    <!-- tronco (robô) -->
    <rect x="46" y="72" width="28" height="38" rx="9" fill="#4a5364" stroke="#2b323d" stroke-width="2"/>
    <rect x="49" y="78" width="22" height="9" rx="4" fill="#3a4250"/>
    <circle cx="60" cy="94" r="5" fill="#2ee6c4"/>
    <circle cx="60" cy="94" r="5" fill="none" stroke="#1a8f7c" stroke-width="1.5"/>

    <!-- cabeça com visor -->
    <rect x="49" y="44" width="23" height="22" rx="9" fill="#5a6374" stroke="#2b323d" stroke-width="2"/>
    <rect x="52" y="50" width="19" height="8" rx="4" fill="#2ee6c4"/>
    <rect x="52" y="50" width="19" height="8" rx="4" fill="none" stroke="#1a8f7c" stroke-width="1"/>
    <!-- antena -->
    <line x1="60" y1="44" x2="60" y2="36" stroke="#8a93a4" stroke-width="2"/>
    <circle cx="60" cy="34" r="3" fill="#ff8a45"/>

    <!-- braço da frente (por cima) -->
    <g class="arm arm-r">
      <rect x="66" y="78" width="9" height="26" rx="4.5" fill="#5a6374"/>
      <rect x="65" y="100" width="11" height="9" rx="4" fill="#3a4250"/>
    </g>
  </svg>`;
}
