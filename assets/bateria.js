// Cargar sonidos de batería
const sounds = {
  kick: new Howl({ src: ['/drums/kicks/kick.wav'] }),
  snare: new Howl({ src: ['/drums/Snares/snare.wav'] }),
  hihat: new Howl({ src: ['/drums/Hats/hat.wav'] }),
  tom: new Howl({ src: ['/drums/Toms/tom_f.wav'] }),
  ride: new Howl({ src: ['/drums/Rides/ride.wav'] }),
  crash: new Howl({ src: ['/drums/Crashes/crash.wav'] }),
  tom1: new Howl({ src: ['/drums/Toms/tom_1.wav'] }),
  tom2: new Howl({ src: ['/drums/Toms/tom_2.wav'] }),
  click: new Howl({ src: ['/drums/metronome/metronome.mp3'] })
};

// Variables de grabación
let isRecording = false;
let recordedSounds = [];
let recordingStartTime = 0;
let recordedChunks = [];
let mediaRecorder;
let audioURL;
let playbackAudio = null;

// Reproducir sonido y grabar evento
document.querySelectorAll('.pad').forEach(pad => {
  pad.addEventListener('click', () => {
    const sound = pad.dataset.sound;
    if (sounds[sound]) {
      sounds[sound].play();
      recordSound(sound);
    }
  });
});

// Control con teclas para pads y grabación
document.addEventListener('keydown', e => {
  // Control grabación con 1,2,3
  if (e.key === '1') startRecording();
  if (e.key === '2') stopRecording();
  if (e.key === '3') playRecording();

  // Reproducir sonidos con teclas definidas en pads
  const pad = [...document.querySelectorAll('.pad')].find(p => p.dataset.key === e.key.toUpperCase());
  if (pad) pad.click();
});

// Función para registrar sonidos durante grabación
function recordSound(name) {
  if (isRecording) {
    const time = Date.now() - recordingStartTime;
    recordedSounds.push({ sound: name, time });
  }
}

// Iniciar grabación
function startRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") return; // evitar duplicar grabación
  recordedSounds = [];
  isRecording = true;
  recordingStartTime = Date.now();
  recordedChunks = [];

  // Crear contexto y destino para grabación del audio generado por Howler
  const audioContext = Howler.ctx;
  const destination = audioContext.createMediaStreamDestination();

  // Conectar Howler master gain a destino de grabación
  Howler.masterGain.connect(destination);

  // Crear MediaRecorder con stream del destino
  mediaRecorder = new MediaRecorder(destination.stream);

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    audioURL = URL.createObjectURL(blob);
    document.getElementById('download-recording').disabled = false;
    document.getElementById('play-recording').disabled = false;
  };

  mediaRecorder.start();

  // Actualizar botones
  document.getElementById('start-recording').disabled = true;
  document.getElementById('stop-recording').disabled = false;
  document.getElementById('play-recording').disabled = true;
  document.getElementById('download-recording').disabled = true;
}

// Detener grabación
function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state !== "recording") return;
  isRecording = false;
  mediaRecorder.stop();

  document.getElementById('start-recording').disabled = false;
  document.getElementById('stop-recording').disabled = true;
}

// Escuchar previo
function playRecording() {
  if (!audioURL) return alert("No hay grabación para reproducir");
  if (playbackAudio) {
    playbackAudio.pause();
    playbackAudio = null;
  }
  playbackAudio = new Audio(audioURL);
  playbackAudio.play();
}

// Descargar grabación
document.getElementById('download-recording').addEventListener('click', () => {
  if (!audioURL) return alert("No hay grabación para descargar");
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = audioURL;
  a.download = 'grabacion.webm'; // .webm por compatibilidad (MP3 requiere codificación server-side)
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Metrónomo
let metronomeInterval = null;
document.getElementById('toggle-metronome').addEventListener('click', () => {
  if (metronomeInterval) {
    clearInterval(metronomeInterval);
    metronomeInterval = null;
    document.getElementById('toggle-metronome').innerText = 'Iniciar';
  } else {
    const bpm = parseInt(document.getElementById('bpm-input').value, 10);
    const interval = 60000 / bpm;
    metronomeInterval = setInterval(() => {
      sounds.click.play();
    }, interval);
    document.getElementById('toggle-metronome').innerText = 'Detener';
  }
});
