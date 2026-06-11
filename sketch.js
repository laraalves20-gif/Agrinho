/* ============================================================
   QUIZ AGRONEGÓCIO — sketch.js
   Lógica completa: perguntas, planta animada, áudio via Web
   Audio API, controle de telas e pontuação.
   ============================================================ */

"use strict";

// ── PERGUNTAS ────────────────────────────────────────────────
const QUESTIONS = [
  {
    question: "Qual é o principal produto agrícola exportado pelo Brasil?",
    options: ["Milho", "Soja", "Café", "Arroz"],
    correct: 1,
    explanation:
      "A soja é o principal produto agrícola de exportação do Brasil.",
  },
  {
    question:
      "O que significa a sigla 'GPS' aplicada ao agronegócio moderno?",
    options: [
      "Gestão de Produção Sustentável",
      "Sistema de Posicionamento Global",
      "Grão, Pastagem e Solo",
      "Grupo de Proteção Setorial",
    ],
    correct: 1,
    explanation:
      "GPS (Global Positioning System) é usado na agricultura de precisão para mapeamento e rastreamento.",
  },
  {
    question:
      "Qual prática agrícola ajuda a conservar a umidade do solo e reduzir a erosão?",
    options: [
      "Queimada",
      "Monocultura contínua",
      "Plantio direto",
      "Aração profunda",
    ],
    correct: 2,
    explanation:
      "O plantio direto preserva a palhada, mantém a umidade e protege o solo contra erosão.",
  },
  {
    question: "Qual dos seguintes é um exemplo de pecuária intensiva?",
    options: [
      "Criação de gado solto em grandes pastagens",
      "Confinamento de bovinos para engorda",
      "Pesca artesanal em rios",
      "Apicultura em floresta nativa",
    ],
    correct: 1,
    explanation:
      "No confinamento, o gado é mantido em espaço reduzido com alimentação controlada — característica da pecuária intensiva.",
  },
  {
    question: "O que é agricultura familiar?",
    options: [
      "Produção em grandes latifúndios mecanizados",
      "Cultivo feito apenas por cooperativas multinacionais",
      "Produção realizada em pequenas propriedades com mão de obra da própria família",
      "Exportação de commodities agrícolas para o exterior",
    ],
    correct: 2,
    explanation:
      "A agricultura familiar é caracterizada pelo trabalho predominante da família em pequenas e médias propriedades.",
  },
];

// ── ESTADO DO JOGO ───────────────────────────────────────────
let currentQ   = 0;
let score      = 0;
let plantStage = 0;   // 0-5 folhas / flores
let muted      = false;
let bgStarted  = false;
let audioCtx   = null;
let bgScheduled = false;

// ── WEB AUDIO API ────────────────────────────────────────────
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playCorrect() {
  if (muted) return;
  const ctx  = getAudioCtx();
  const now  = ctx.currentTime;
  const notes = [523, 659, 784, 1047];
  notes.forEach(function (freq, i) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0,    now + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.22);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.25);
  });
}

function playWrong() {
  if (muted) return;
  const ctx  = getAudioCtx();
  const now  = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);
  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc.start(now);
  osc.stop(now + 0.45);
}

function playChirp() {
  if (muted) return;
  const ctx   = getAudioCtx();
  const now   = ctx.currentTime;
  const notes = [880, 1100, 990, 1320];
  notes.forEach(function (freq, i) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.11);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.06, now + i * 0.11 + 0.07);
    gain.gain.setValueAtTime(0,    now + i * 0.11);
    gain.gain.linearRampToValueAtTime(0.07, now + i * 0.11 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.1);
    osc.start(now + i * 0.11);
    osc.stop(now + i * 0.11 + 0.12);
  });
}

function startBackground() {
  if (muted || bgScheduled) return;
  bgScheduled = true;
  var ctx = getAudioCtx();

  // Vento suave (ruído filtrado)
  try {
    var bufferSize = ctx.sampleRate * 2;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    var filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 350;
    filter.Q.value = 0.4;
    var windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0, ctx.currentTime);
    windGain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 2.5);
    noise.connect(filter);
    filter.connect(windGain);
    windGain.connect(ctx.destination);
    noise.start();
  } catch (e) {}

  // Pássaros periódicos
  function scheduleChirp() {
    if (muted) return;
    playChirp();
    setTimeout(scheduleChirp, 2800 + Math.random() * 3500);
  }
  setTimeout(scheduleChirp, 1400);
}

function stopBackground() {
  // Apenas impedimos futuros chirps marcando como mudo
  bgScheduled = false;
}

// ── SVG DA PLANTA ────────────────────────────────────────────
function buildPlantSVG(stage, wilting) {
  var stemH   = 40 + Math.min(stage, 5) * 22;
  var stemTop = 172 - stemH;

  var stemColor   = wilting ? "#7A6045" : "#2E7D32";
  var leafColor   = wilting ? "#8B7355" : "#4CAF50";
  var petalColor  = wilting ? "#BDBDBD" : "#FFEB3B";
  var centerColor = wilting ? "#9E9E9E" : "#FF9800";

  var saturate = wilting ? "saturate(0.3) brightness(0.85)" : "saturate(1) brightness(1)";
  var tiltStem = wilting ? "rotate(-8, 70, 172)" : "";

  var svg = '<svg viewBox="0 0 140 180" width="140" height="140" style="filter:' + saturate + ';transition:filter 0.6s">';

  // Solo
  svg += '<ellipse cx="70" cy="172" rx="55" ry="12" fill="#8B6914" opacity="0.7"/>';
  svg += '<ellipse cx="70" cy="168" rx="45" ry="8"  fill="#A0802A" opacity="0.5"/>';

  // Caule
  if (stage === 0) {
    // Broto simples
    svg += '<rect x="67" y="148" width="6" height="20" rx="3" fill="' + stemColor + '"/>';
    svg += '<ellipse cx="70" cy="146" rx="7" ry="9" fill="' + leafColor + '"/>';
  } else {
    svg += '<rect x="67" y="' + stemTop + '" width="6" height="' + stemH + '" rx="3" fill="' + stemColor + '" transform="' + tiltStem + '"/>';

    // Pares de folhas
    var leafPairs = [
      { y: 172 - 35,  rx: 20, ry: 10, rot: 20 },
      { y: 172 - 60,  rx: 18, ry: 9,  rot: 25 },
      { y: 172 - 85,  rx: 16, ry: 8,  rot: 30 },
      { y: 172 - 108, rx: 14, ry: 7,  rot: 35 },
    ];
    for (var p = 0; p < Math.min(stage, 4); p++) {
      var lp = leafPairs[p];
      var rotL = wilting ?  lp.rot : -lp.rot;
      var rotR = wilting ? -lp.rot :  lp.rot;
      // Folha esquerda
      svg += '<ellipse cx="' + (wilting ? 46 : 42) + '" cy="' + lp.y + '" rx="' + lp.rx + '" ry="' + lp.ry + '" fill="' + leafColor + '" transform="rotate(' + rotL + ',' + (wilting ? 66 : 62) + ',' + lp.y + ')"/>';
      // Folha direita
      svg += '<ellipse cx="' + (wilting ? 94 : 98) + '" cy="' + lp.y + '" rx="' + lp.rx + '" ry="' + lp.ry + '" fill="' + leafColor + '" transform="rotate(' + rotR + ',' + (wilting ? 74 : 78) + ',' + lp.y + ')"/>';
    }

    // Flor no topo
    var flowerY = stemTop - 10;
    var angles = [0, 60, 120, 180, 240, 300];
    var petalR = stage >= 3 ? 10 : 7;
    var petalRy = stage >= 3 ? 6 : 4;
    angles.forEach(function (a) {
      var rad = a * Math.PI / 180;
      var px  = 70 + Math.cos(rad) * 13;
      var py  = flowerY + Math.sin(rad) * 13;
      svg += '<ellipse cx="' + px + '" cy="' + py + '" rx="' + petalR + '" ry="' + petalRy + '" fill="' + petalColor + '" transform="rotate(' + a + ',70,' + flowerY + ')"/>';
    });
    var cR = stage >= 2 ? 9 : 6;
    svg += '<circle cx="70" cy="' + flowerY + '" r="' + cR + '" fill="' + centerColor + '"/>';
  }

  svg += '</svg>';
  return svg;
}

function renderPlant(containerId, stage, wilting, floating) {
  var el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = buildPlantSVG(stage, wilting);
  el.className = "plant-wrap" + (floating ? " anim-float" : "");
}

// ── CONSTRUÇÃO DA CERCA (SVG dinâmico) ───────────────────────
function buildFence() {
  var svg  = document.getElementById("fence");
  var html = "";
  for (var i = 0; i < 22; i++) {
    var x = i * 40;
    html += '<g transform="translate(' + x + ',0)">'
          + '<rect x="0"  y="6" width="5" height="44" rx="2" fill="#8D6E63"/>'
          + '<rect x="11" y="6" width="5" height="44" rx="2" fill="#8D6E63"/>'
          + '<rect x="-2" y="13" width="25" height="5" rx="2" fill="#A1887F"/>'
          + '<rect x="-2" y="28" width="25" height="5" rx="2" fill="#A1887F"/>'
          + '</g>';
  }
  svg.innerHTML = html;
}

// ── TROCA DE TELAS ───────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(function (s) {
    s.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

// ── ATUALIZA UI DO QUIZ ──────────────────────────────────────
function renderQuestion() {
  var q = QUESTIONS[currentQ];

  // Progresso
  document.getElementById("progress-bar").style.width =
    ((currentQ / QUESTIONS.length) * 100) + "%";
  document.getElementById("label-question").textContent =
    "Pergunta " + (currentQ + 1) + " de " + QUESTIONS.length;
  document.getElementById("label-score").textContent =
    "⭐ " + score + (score === 1 ? " acerto" : " acertos");

  // Planta
  renderPlant("plant-quiz", plantStage, false, false);

  // Esconde feedback e próxima
  var fb = document.getElementById("feedback-box");
  fb.className = "hidden";
  fb.textContent = "";

  document.getElementById("next-wrap").classList.add("hidden");

  // Pergunta
  document.getElementById("question-text").textContent = q.question;

  // Opções
  var letters = ["A", "B", "C", "D"];
  var opts    = document.getElementById("options");
  opts.innerHTML = "";
  q.options.forEach(function (opt, i) {
    var btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerHTML = '<span class="letter">' + letters[i] + '.</span>' + opt;
    btn.addEventListener("click", function () { handleAnswer(i); });
    opts.appendChild(btn);
  });
}

// ── RESPOSTA ─────────────────────────────────────────────────
function handleAnswer(idx) {
  var q       = QUESTIONS[currentQ];
  var correct = q.correct;
  var isRight = idx === correct;

  // Desabilita todos os botões
  document.querySelectorAll(".option-btn").forEach(function (b, i) {
    b.disabled = true;
    if (i === correct) b.classList.add("correct");
    else if (i === idx && !isRight) b.classList.add("wrong");
  });

  if (isRight) {
    playCorrect();
    score++;
    plantStage = Math.min(plantStage + 1, 5);
    renderPlant("plant-quiz", plantStage, false, false);
    document.getElementById("plant-quiz").classList.add("anim-bounce");
    setTimeout(function () {
      document.getElementById("plant-quiz").classList.remove("anim-bounce");
    }, 600);
    showFeedback(true);
  } else {
    playWrong();
    renderPlant("plant-quiz", plantStage, true, false);
    document.getElementById("plant-quiz").classList.add("anim-shake");
    setTimeout(function () {
      document.getElementById("plant-quiz").classList.remove("anim-shake");
      renderPlant("plant-quiz", plantStage, false, false);
    }, 600);
    showFeedback(false);
  }

  // Progresso após resposta
  document.getElementById("progress-bar").style.width =
    (((currentQ + 1) / QUESTIONS.length) * 100) + "%";
  document.getElementById("label-score").textContent =
    "⭐ " + score + (score === 1 ? " acerto" : " acertos");

  // Explicação e botão próxima
  document.getElementById("explanation-text").textContent = "💡 " + q.explanation;
  var nextWrap = document.getElementById("next-wrap");
  nextWrap.classList.remove("hidden");
  document.getElementById("btn-next").textContent =
    currentQ + 1 >= QUESTIONS.length ? "Ver Resultado 🏁" : "Próxima Pergunta →";
}

function showFeedback(correct) {
  var fb = document.getElementById("feedback-box");
  fb.className = correct ? "correct" : "wrong";
  fb.textContent = correct
    ? "Você é um jovem agricultor! 🌱"
    : "Você precisa melhorar seus conhecimentos. 📚";
}

// ── PRÓXIMA PERGUNTA ─────────────────────────────────────────
function nextQuestion() {
  currentQ++;
  if (currentQ >= QUESTIONS.length) {
    showResult();
  } else {
    renderQuestion();
  }
}

// ── TELA DE RESULTADO ────────────────────────────────────────
function showResult() {
  var wilting = score < 3;
  renderPlant("plant-result", score, wilting, true);

  var emoji, title, titleClass;
  if (score === 5) {
    emoji      = "🏆";
    title      = "Parabéns, Mestre do Agronegócio!";
    titleClass = "title-gold";
  } else if (score >= 3) {
    emoji      = "🌾";
    title      = "Bom trabalho, jovem agricultor!";
    titleClass = "title-green";
  } else {
    emoji      = "📚";
    title      = "Continue estudando, o campo te espera!";
    titleClass = "title-orange";
  }

  document.getElementById("result-emoji").textContent = emoji;
  var titleEl = document.getElementById("result-title");
  titleEl.textContent = title;
  titleEl.className = titleClass;

  document.getElementById("score-number").textContent =
    score + "/" + QUESTIONS.length;

  var starsEl = document.getElementById("stars");
  starsEl.innerHTML = "";
  for (var i = 0; i < QUESTIONS.length; i++) {
    var span = document.createElement("span");
    span.textContent = i < score ? "⭐" : "☆";
    starsEl.appendChild(span);
  }

  showScreen("screen-result");
}

// ── REINICIAR ─────────────────────────────────────────────────
function restartGame() {
  currentQ   = 0;
  score      = 0;
  plantStage = 0;
  renderPlant("plant-intro", 0, false, true);
  showScreen("screen-intro");
}

// ── INICIAR JOGO ──────────────────────────────────────────────
function startGame() {
  if (!bgStarted) {
    bgStarted = true;
    startBackground();
  }
  renderQuestion();
  showScreen("screen-quiz");
}

// ── MUTE ──────────────────────────────────────────────────────
function toggleMute() {
  muted = !muted;
  var btn = document.getElementById("btn-mute");
  if (muted) {
    btn.textContent = "🔇 Unmute";
    stopBackground();
  } else {
    btn.textContent = "🔊 Mute";
    startBackground();
  }
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  buildFence();
  renderPlant("plant-intro", 0, false, true);

  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-next").addEventListener("click", nextQuestion);
  document.getElementById("btn-restart").addEventListener("click", restartGame);
  document.getElementById("btn-mute").addEventListener("click", toggleMute);
});