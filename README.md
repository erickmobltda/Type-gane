# DEAD KEYS

Jogo de navegador para treinar digitação **rápida e com o dedo correto** em teclados
ergonômicos *split*. Você é um **sobrevivente fugindo de uma horda de zumbis** numa noite
de apocalipse: digitar rápido e certo abre distância; ir devagar ou errar muito faz a
horda **colar** em você — e te alcançar.

Roda **100% no navegador**, sem build e sem dependências — basta abrir `index.html`.

## Recursos

- **Seleção de teclado**: Sofle, Corne e Lily58, cada um com nome e diagrama (SVG) do modelo.
- **Treino de teclas soltas**: o jogo mostra qual tecla apertar **e com qual dedo**
  (nome do dedo + cor + destaque da mão/dedo na tela e da tecla no diagrama).
- **Fuga da horda**: uma "distância" cai com o tempo (zumbis se aproximam) e sobe a cada
  acerto; errar dá um tranco e faz o corredor **tropeçar**. Distância no fim = você é pego.
- **Dois modos**: *Clássico* (3 chances — ser pego tira uma) e *Treino livre* (sem vidas —
  ser pego encerra; erre à vontade no caminho).
- **Navegação por teclado** em todas as telas (1/2/3, setas, Enter, Esc, C/T).
- **HUD**: acertos, WPM, recorde pessoal (por teclado) e vidas. No fim de jogo: precisão,
  teclas mais erradas (com o dedo correto), dicas e **gráfico de evolução do WPM**.

## Como rodar

Abra `index.html` diretamente no navegador, ou sirva a pasta:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

## Estrutura

| Arquivo            | Responsabilidade                                            |
|--------------------|-------------------------------------------------------------|
| `index.html`       | Estrutura das telas (seleção, jogo, fim de jogo)            |
| `css/styles.css`   | Tema, HUD e animações                                       |
| `js/layouts.js`    | Dados dos teclados + geração das posições das teclas        |
| `js/fingers.js`    | Mapa de dedos (cor/nome) e guia de mãos em SVG              |
| `js/keyboard.js`   | Render do diagrama do teclado com destaque da tecla alvo    |
| `js/state.js`      | Estado do jogo, WPM e recorde (localStorage)                |
| `js/character.js`  | Personagem em SVG e animações                               |
| `js/game.js`       | Loop do jogo: sorteio, teclado, pontuação, vidas            |
| `js/main.js`       | Controle de telas e seleção de layout                       |

## Mapa de dedos

Segue a convenção de digitação por toque (QWERTY), adaptada à posição física das colunas
de cada teclado split. Como o navegador só recebe a tecla (não o dedo), o dedo correto é
guiado **visualmente** — o objetivo é treinar o hábito de usar o dedo designado.
