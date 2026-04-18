const scenes = Array.from(document.querySelectorAll(".scene"));
const sceneCounter = document.getElementById("scene-counter");
const sceneName = document.getElementById("scene-name");
const progressFill = document.getElementById("progress-fill");

const musicToggle = document.getElementById("music-toggle");
const welcomeMusicBtn = document.getElementById("welcome-music-btn");
const startBtn = document.getElementById("start-btn");
const storyNextBtn = document.getElementById("story-next-btn");
const memoryNextBtn = document.getElementById("memory-next-btn");
const teaseNextBtn = document.getElementById("tease-next-btn");
const celebrateBtn = document.getElementById("celebrate-btn");
const replayBtn = document.getElementById("replay-btn");

const memoryChips = Array.from(document.querySelectorAll(".memory-chip"));
const memoryTitle = document.getElementById("memory-title");
const memoryText = document.getElementById("memory-text");

const typingText = document.getElementById("typing-text");
const analysisValue = document.getElementById("analysis-value");
const analysisFill = document.getElementById("analysis-fill");
const analysisText = document.getElementById("analysis-text");
const teaseResponse = document.getElementById("tease-response");
const warmNote = document.getElementById("warm-note");
const replyButtons = Array.from(document.querySelectorAll("[data-reply]"));
const runnerZone = document.getElementById("runner-zone");
const runnerBtn = document.getElementById("runner-btn");

const fxCanvas = document.getElementById("fx-canvas");
const fxContext = fxCanvas.getContext("2d");

const sceneLabels = [
  "Welcome",
  "Our Story",
  "Memory Lane",
  "Teasing",
  "Celebration"
];

const memoryEntries = [
  {
    title: "First hello",
    text: "Sometimes the start is quiet, but you still feel it. That first hello already carried something sweet."
  },
  {
    title: "Carnival City",
    text: "That day felt light and easy. It was fun, warm, and the kind of memory that instantly became worth keeping."
  },
  {
    title: "Go-karts",
    text: "The racing part was serious for about two seconds, then the playful crashes made it way more iconic than competitive."
  },
  {
    title: "Birthday energy",
    text: "Today carries that same bright feeling. Soft joy, real laughter, and a little magic around your name."
  }
];

const replyMessages = {
  "not-answering": "That is a very cute way of saying the answer is absolutely too obvious to say out loud.",
  "mind-business": "Too late. The birthday scanner is already deep in the investigation.",
  "okay-fine": "That honesty is suspiciously adorable. The scanner likes this answer."
};

const typingMessage = "You had a crush for 5 years... what's his name?";

const state = {
  currentScene: 0,
  typingTimer: null,
  analysisStarted: false,
  typingStarted: false
};

const audioState = {
  context: null,
  masterGain: null,
  musicGain: null,
  sfxGain: null,
  musicTimer: null,
  musicOn: false
};

const effectsState = {
  particles: [],
  lastTime: 0,
  celebrationTimer: null
};

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  fxCanvas.width = window.innerWidth * ratio;
  fxCanvas.height = window.innerHeight * ratio;
  fxContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function makeParticle(x, y, palette, type) {
  const angle = Math.random() * Math.PI * 2;
  const speed = type === "firework" ? 3 + Math.random() * 4 : 2 + Math.random() * 2.6;

  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - (type === "firework" ? 1.9 : 0.4),
    size: type === "firework" ? 2 + Math.random() * 3 : 4 + Math.random() * 5,
    color: palette[Math.floor(Math.random() * palette.length)],
    gravity: type === "firework" ? 0.03 : 0.06,
    alpha: 1,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
    type
  };
}

function spawnBurst(x, y, count, palette, type) {
  for (let index = 0; index < count; index += 1) {
    effectsState.particles.push(makeParticle(x, y, palette, type));
  }
}

function launchConfetti(x, y) {
  spawnBurst(x, y, 40, ["#ff6996", "#ffd58f", "#ffffff", "#ff9f6f"], "confetti");
}

function launchFireworks(x, y) {
  spawnBurst(x, y, 28, ["#ff6996", "#ffd58f", "#fff7da", "#ffdbe7"], "firework");
}

function renderEffects(timestamp) {
  const delta = Math.min((timestamp - effectsState.lastTime) / 16.67 || 1, 2);
  effectsState.lastTime = timestamp;
  fxContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

  effectsState.particles = effectsState.particles.filter((particle) => particle.alpha > 0.02);

  effectsState.particles.forEach((particle) => {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.vy += particle.gravity * delta;
    particle.rotation += particle.spin * delta;
    particle.alpha -= particle.type === "firework" ? 0.017 * delta : 0.012 * delta;

    fxContext.save();
    fxContext.globalAlpha = particle.alpha;
    fxContext.translate(particle.x, particle.y);
    fxContext.rotate(particle.rotation);
    fxContext.fillStyle = particle.color;

    if (particle.type === "firework") {
      fxContext.beginPath();
      fxContext.arc(0, 0, particle.size, 0, Math.PI * 2);
      fxContext.fill();
    } else {
      fxContext.fillRect(-particle.size / 2, -particle.size / 3, particle.size, particle.size * 0.66);
    }

    fxContext.restore();
  });

  window.requestAnimationFrame(renderEffects);
}

function ensureAudio() {
  if (audioState.context) {
    if (audioState.context.state === "suspended") {
      audioState.context.resume();
    }
    return audioState.context;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  const context = new AudioContextClass();
  const masterGain = context.createGain();
  const musicGain = context.createGain();
  const sfxGain = context.createGain();

  masterGain.gain.value = 0.18;
  musicGain.gain.value = 0.18;
  sfxGain.gain.value = 0.22;

  musicGain.connect(masterGain);
  sfxGain.connect(masterGain);
  masterGain.connect(context.destination);

  audioState.context = context;
  audioState.masterGain = masterGain;
  audioState.musicGain = musicGain;
  audioState.sfxGain = sfxGain;

  return context;
}

function playTone(frequency, duration, gainValue, type, when = 0) {
  const context = ensureAudio();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startTime = context.currentTime + when;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(audioState.musicGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.04);
}

function playClickSound() {
  const context = ensureAudio();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startTime = context.currentTime;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(620, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(420, startTime + 0.12);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

  oscillator.connect(gain);
  gain.connect(audioState.sfxGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.22);
}

function playSparkleSound() {
  const context = ensureAudio();
  if (!context) {
    return;
  }

  [784, 988, 1174].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startTime = context.currentTime + index * 0.04;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.08, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

    oscillator.connect(gain);
    gain.connect(audioState.sfxGain);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.22);
  });
}

function startMusicLoop() {
  if (audioState.musicTimer) {
    window.clearInterval(audioState.musicTimer);
  }

  const chords = [
    [261.63, 329.63, 392.0],
    [293.66, 369.99, 440.0],
    [220.0, 261.63, 329.63],
    [246.94, 329.63, 392.0]
  ];

  let step = 0;

  const playStep = () => {
    if (!audioState.musicOn) {
      return;
    }

    const chord = chords[step % chords.length];
    chord.forEach((note, index) => {
      playTone(note, 1.6, index === 0 ? 0.034 : 0.025, "sine", index * 0.08);
    });
    playTone(chord[1] * 2, 0.42, 0.016, "triangle", 0.28);
    step += 1;
  };

  playStep();
  audioState.musicTimer = window.setInterval(playStep, 1800);
}

function setMusicState(nextState) {
  ensureAudio();
  audioState.musicOn = nextState;

  if (audioState.musicOn) {
    startMusicLoop();
  } else if (audioState.musicTimer) {
    window.clearInterval(audioState.musicTimer);
    audioState.musicTimer = null;
  }

  const label = `Soft Music: ${audioState.musicOn ? "On" : "Off"}`;
  musicToggle.textContent = label;
  welcomeMusicBtn.textContent = audioState.musicOn ? "Pause Soft Music" : "Play Soft Music";
  musicToggle.setAttribute("aria-pressed", String(audioState.musicOn));
}

function updateProgress(index) {
  const totalScenes = scenes.length;
  sceneCounter.textContent = `Scene ${index + 1} of ${totalScenes}`;
  sceneName.textContent = sceneLabels[index];
  progressFill.style.width = `${((index + 1) / totalScenes) * 100}%`;
}

function showScene(index) {
  state.currentScene = index;
  scenes.forEach((scene, sceneIndex) => {
    scene.classList.toggle("is-active", sceneIndex === index);
  });
  updateProgress(index);

  if (index === 3) {
    startTyping();
  }

  if (index === 4) {
    startCelebration();
  } else {
    stopCelebration();
  }
}

function updateMemory(index, withEffects = true) {
  const entry = memoryEntries[index];

  memoryChips.forEach((chip, chipIndex) => {
    chip.classList.toggle("is-active", chipIndex === index);
  });

  memoryTitle.textContent = entry.title;
  memoryText.textContent = entry.text;

  if (withEffects) {
    const chipBounds = memoryChips[index].getBoundingClientRect();
    launchConfetti(chipBounds.left + chipBounds.width / 2, chipBounds.top + chipBounds.height / 2);
    playSparkleSound();
  }
}

function resetRunnerButton() {
  runnerBtn.style.left = "50%";
  runnerBtn.style.top = "12px";
  runnerBtn.style.transform = "translateX(-50%)";
}

function moveRunnerButton() {
  const zoneRect = runnerZone.getBoundingClientRect();
  const buttonWidth = runnerBtn.offsetWidth;
  const buttonHeight = runnerBtn.offsetHeight;
  const maxX = Math.max(zoneRect.width - buttonWidth - 18, 10);
  const maxY = Math.max(zoneRect.height - buttonHeight - 18, 10);

  const nextX = 9 + Math.random() * maxX;
  const nextY = 9 + Math.random() * maxY;

  runnerBtn.style.transform = "none";
  runnerBtn.style.left = `${nextX}px`;
  runnerBtn.style.top = `${nextY}px`;
}

function resetTeaseScene() {
  window.clearInterval(state.typingTimer);
  state.analysisStarted = false;
  state.typingStarted = false;
  typingText.textContent = "";
  analysisValue.textContent = "Waiting...";
  analysisFill.style.width = "0%";
  analysisText.textContent = "Pick a response and let the very serious birthday scanner investigate.";
  teaseResponse.textContent = "";
  warmNote.hidden = true;
  teaseNextBtn.disabled = true;
  resetRunnerButton();
}

function startTyping() {
  if (state.typingStarted) {
    return;
  }

  state.typingStarted = true;
  typingText.textContent = "";
  let index = 0;

  state.typingTimer = window.setInterval(() => {
    typingText.textContent += typingMessage.charAt(index);
    index += 1;

    if (index >= typingMessage.length) {
      window.clearInterval(state.typingTimer);
    }
  }, 42);
}

function startAnalysis(replyText) {
  teaseResponse.textContent = replyText;

  if (state.analysisStarted) {
    return;
  }

  state.analysisStarted = true;
  let value = 0;

  const timer = window.setInterval(() => {
    value += 4.1;
    analysisFill.style.width = `${Math.min(value, 99.9)}%`;

    if (value >= 99.9) {
      value = 99.9;
      analysisValue.textContent = `${value.toFixed(1)}%`;
      analysisText.textContent = "Crush detected: 99.9%";
      warmNote.hidden = false;
      teaseNextBtn.disabled = false;
      launchFireworks(window.innerWidth * 0.55, window.innerHeight * 0.38);
      playSparkleSound();
      window.clearInterval(timer);
      return;
    }

    analysisValue.textContent = `${value.toFixed(1)}%`;
    analysisText.textContent = value > 52
      ? "The scanner is finding a very suspicious amount of blush energy..."
      : "Checking smiles, memories, and other highly suspicious details...";
  }, 35);
}

function startCelebration() {
  launchConfetti(window.innerWidth * 0.5, window.innerHeight * 0.18);
  launchFireworks(window.innerWidth * 0.28, window.innerHeight * 0.22);
  launchFireworks(window.innerWidth * 0.72, window.innerHeight * 0.2);
  playSparkleSound();

  if (effectsState.celebrationTimer) {
    return;
  }

  effectsState.celebrationTimer = window.setInterval(() => {
    launchFireworks(
      window.innerWidth * (0.22 + Math.random() * 0.56),
      window.innerHeight * (0.15 + Math.random() * 0.2)
    );
  }, 1900);
}

function stopCelebration() {
  if (effectsState.celebrationTimer) {
    window.clearInterval(effectsState.celebrationTimer);
    effectsState.celebrationTimer = null;
  }
}

function registerButtonSounds() {
  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      playClickSound();
    });
  });
}

startBtn.addEventListener("click", () => {
  setMusicState(true);
  showScene(1);
  launchConfetti(window.innerWidth * 0.5, window.innerHeight * 0.24);
});

welcomeMusicBtn.addEventListener("click", () => {
  setMusicState(!audioState.musicOn);
});

musicToggle.addEventListener("click", () => {
  setMusicState(!audioState.musicOn);
});

storyNextBtn.addEventListener("click", () => {
  showScene(2);
});

memoryChips.forEach((chip, index) => {
  chip.addEventListener("click", () => {
    updateMemory(index);
  });
});

memoryNextBtn.addEventListener("click", () => {
  showScene(3);
});

replyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    startAnalysis(replyMessages[button.dataset.reply]);
  });
});

runnerBtn.addEventListener("mouseenter", moveRunnerButton);
runnerBtn.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  moveRunnerButton();
  startAnalysis("Even the 'Definitely not him' button started running away. That feels very telling.");
});

teaseNextBtn.addEventListener("click", () => {
  showScene(4);
});

celebrateBtn.addEventListener("click", () => {
  launchConfetti(window.innerWidth * 0.5, window.innerHeight * 0.18);
  launchFireworks(window.innerWidth * 0.3, window.innerHeight * 0.2);
  launchFireworks(window.innerWidth * 0.72, window.innerHeight * 0.18);
  playSparkleSound();
});

replayBtn.addEventListener("click", () => {
  resetTeaseScene();
  showScene(0);
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
window.requestAnimationFrame(renderEffects);
registerButtonSounds();
resetTeaseScene();
updateMemory(0, false);
showScene(0);
