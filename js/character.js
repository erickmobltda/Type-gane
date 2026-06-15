// character.js — herói "elfo" original (estilo aventura, inspirado mas NÃO igual ao Link).
// Desenhado em SVG. Estados visuais via classes no contêiner: idle / attack / hurt.

function renderHero() {
  // Personagem original: elfo de túnica verde, gorro pontudo, espada e escudo.
  return `
  <svg viewBox="0 0 120 150" class="hero-svg" xmlns="http://www.w3.org/2000/svg">
    <!-- sombra -->
    <ellipse cx="60" cy="142" rx="30" ry="6" fill="#000" opacity="0.3"/>

    <!-- pernas (agrupadas para o ciclo de caminhada) -->
    <g class="hero-legs">
      <g class="leg leg-l">
        <rect x="48" y="108" width="10" height="26" rx="4" fill="#7a5a32"/>
        <rect x="46" y="130" width="14" height="8" rx="3" fill="#4a3416"/>
      </g>
      <g class="leg leg-r">
        <rect x="62" y="108" width="10" height="26" rx="4" fill="#7a5a32"/>
        <rect x="60" y="130" width="14" height="8" rx="3" fill="#4a3416"/>
      </g>
    </g>

    <!-- túnica verde -->
    <path d="M40 70 L80 70 L84 116 L36 116 Z" fill="#2f8f3e" stroke="#1f6e2c" stroke-width="2"/>
    <path d="M40 70 L80 70 L78 84 L42 84 Z" fill="#3aa84c"/>
    <!-- cinto -->
    <rect x="38" y="98" width="44" height="8" fill="#5a3d1c"/>
    <rect x="56" y="98" width="8" height="8" fill="#d4af37"/>

    <!-- braço/escudo (esquerdo) -->
    <g class="hero-shield">
      <rect x="26" y="78" width="12" height="26" rx="5" fill="#3aa84c"/>
      <ellipse cx="26" cy="92" rx="13" ry="16" fill="#3f6fb0" stroke="#d4af37" stroke-width="2.5"/>
      <path d="M26 80 L26 104 M16 92 L36 92" stroke="#d4af37" stroke-width="2"/>
    </g>

    <!-- cabeça -->
    <circle cx="60" cy="54" r="18" fill="#f0c89a"/>
    <!-- orelhas pontudas -->
    <path d="M44 52 L36 46 L46 58 Z" fill="#f0c89a"/>
    <path d="M76 52 L84 46 L74 58 Z" fill="#f0c89a"/>
    <!-- cabelo -->
    <path d="M44 46 Q60 34 76 46 L74 52 Q60 42 46 52 Z" fill="#caa24a"/>
    <!-- gorro verde pontudo -->
    <path d="M44 46 Q60 24 78 40 L96 14 Q70 20 60 36 Q52 34 44 46 Z" fill="#2f8f3e" stroke="#1f6e2c" stroke-width="1.5"/>
    <!-- olhos -->
    <circle cx="54" cy="55" r="2.4" fill="#243a2a"/>
    <circle cx="66" cy="55" r="2.4" fill="#243a2a"/>

    <!-- braço/espada (direito) — gira na animação de ataque -->
    <g class="hero-sword">
      <rect x="82" y="78" width="12" height="22" rx="5" fill="#3aa84c"/>
      <g class="hero-blade">
        <rect x="86" y="40" width="5" height="44" rx="2" fill="#dfe7ee" stroke="#9fb2c4" stroke-width="1"/>
        <polygon points="86,40 91,40 88.5,30" fill="#eef4fa"/>
        <rect x="80" y="82" width="18" height="5" rx="2" fill="#d4af37"/>
      </g>
    </g>
  </svg>`;
}
