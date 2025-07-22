// Sonidos batería y metrónomo
const sounds = {
  kick: 'sounds/kick.wav',
  snare: 'sounds/snare.wav',
  hihat: 'sounds/hihat.wav',
  tom: 'sounds/tom.wav',
  click: 'sounds/click.wav' // sonido metrónomo
};

const audioElements = {};
for (const key in sounds) {
  const audio = new Audio(sounds[key]);
  audioElements[key] = audio;
}

function playSound(name) {
  if (!audioElements[name]) return;
  const soundClone = audioElements[name].cloneNode();
  soundClone.play();
}

// Eventos pads batería
document.querySelectorAll('.pad').forEach(pad => {
  pad.addEventListener('click', () => {
    playSound(pad.dataset.sound);
    pad.classList.add('active');
    setTimeout(() => pad.classList.remove('active'), 150);
  });
});

// Eventos teclado para pads
window.addEventListener('keydown', (e) => {
  const key = e.key.toUpperCase();
  const pad = document.querySelector(`.pad[data-key="${key}"]`);
  if (pad && !pad.classList.contains('active')) {
    pad.classList.add('active');
    playSound(pad.dataset.sound);
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toUpperCase();
  const pad = document.querySelector(`.pad[data-key="${key}"]`);
  if (pad) {
    pad.classList.remove('active');
  }
});

// Metrónomo
const bpmInput = document.getElementById('bpm-input');
const toggleBtn = document.getElementById('toggle-metronome');

let metronomeInterval = null;

function startMetronome() {
  if (metronomeInterval) return;

  const bpm = parseInt(bpmInput.value);
  if (isNaN(bpm) || bpm < 40 || bpm > 240) {
    alert("Introduce un BPM entre 40 y 240");
    return;
  }

  const intervalMs = 60000 / bpm;

  metronomeInterval = setInterval(() => {
    playSound('click');
  }, intervalMs);

  toggleBtn.textContent = 'Detener Metrónomo';
  toggleBtn.classList.add('off');
}

function stopMetronome() {
  if (!metronomeInterval) return;

  clearInterval(metronomeInterval);
  metronomeInterval = null;

  toggleBtn.textContent = 'Iniciar Metrónomo';
  toggleBtn.classList.remove('off');
}

toggleBtn.addEventListener('click', () => {
  if (metronomeInterval) {
    stopMetronome();
  } else {
    startMetronome();
  }
});
