// character.js — o sobrevivente (humano apavorado fugindo) em SVG.
// Estados via classes no contêiner: is-running / is-jump / is-dash / is-stumble / is-grabbed.
// viewBox 120x150 (mantém o posicionamento do palco). Olha para trás, em pânico.

function renderRunner() {
  return `
  <svg viewBox="0 0 120 150" class="runner-svg" xmlns="http://www.w3.org/2000/svg">
    <!-- sombra -->
    <ellipse cx="60" cy="143" rx="25" ry="5" fill="#000" opacity="0.4"/>

    <!-- mochila (atrás) -->
    <rect x="40" y="74" width="14" height="26" rx="5" fill="#1f2a2e" stroke="#10171a" stroke-width="1.5"/>

    <!-- braço de trás -->
    <g class="arm arm-l">
      <rect x="44" y="74" width="9" height="22" rx="4" fill="#244249"/>
      <rect x="43" y="92" width="10" height="9" rx="4" fill="#d8a883"/>
    </g>

    <!-- pernas -->
    <g class="runner-legs">
      <g class="leg leg-l">
        <rect x="50" y="100" width="11" height="20" rx="4" fill="#2c4258"/>
        <rect x="51" y="116" width="9" height="16" rx="3" fill="#263a4e"/>
        <rect x="46" y="129" width="17" height="9" rx="3" fill="#16161a"/>
      </g>
      <g class="leg leg-r">
        <rect x="62" y="100" width="11" height="20" rx="4" fill="#33506a"/>
        <rect x="63" y="116" width="9" height="16" rx="3" fill="#2c4258"/>
        <rect x="58" y="129" width="17" height="9" rx="3" fill="#1d1d22"/>
      </g>
    </g>

    <!-- jaqueta (tronco) -->
    <path d="M45 68 L74 68 L77 104 L43 104 Z" fill="#2f5560" stroke="#19343b" stroke-width="2"/>
    <path d="M45 68 L74 68 L73 80 L46 80 Z" fill="#367080"/>
    <rect x="58" y="69" width="3" height="35" fill="#1c3a42"/>

    <!-- cabeça (olhando para trás, em pânico) -->
    <circle cx="58" cy="52" r="14" fill="#e7c6a0"/>
    <!-- orelha -->
    <circle cx="70" cy="54" r="3" fill="#dcb792"/>
    <!-- cabelo -->
    <path d="M44 50 Q46 35 60 36 Q73 37 72 50 L72 45 Q66 41 58 42 Q49 43 46 52 Z" fill="#241d18"/>
    <path d="M45 50 Q47 40 58 40 Q60 44 52 46 Q47 48 46 53 Z" fill="#2e2620"/>
    <!-- olho arregalado + sobrancelha tensa -->
    <ellipse cx="51" cy="52" rx="2.6" ry="3.2" fill="#fff"/>
    <circle cx="50.5" cy="52.5" r="1.6" fill="#13202a"/>
    <path d="M47 46 L55 48" stroke="#241d18" stroke-width="1.6" stroke-linecap="round"/>
    <!-- boca gritando -->
    <ellipse cx="52" cy="60" rx="3" ry="3.6" fill="#2e1116"/>
    <!-- gota de suor -->
    <path d="M63 47 q2 3 0 5 q-2 -2 0 -5 Z" fill="#9fdce6" opacity="0.85"/>

    <!-- braço da frente (esticado, fugindo) -->
    <g class="arm arm-r">
      <rect x="66" y="72" width="9" height="22" rx="4" fill="#3a7484"/>
      <rect x="65" y="90" width="10" height="9" rx="4" fill="#eccaa6"/>
    </g>
  </svg>`;
}
