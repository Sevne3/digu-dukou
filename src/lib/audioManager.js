// Global audio manager with playlist and notification sounds
let audioCtx = null;
let masterGain = null;
let isPlaying = false;
let timeoutId = null;
let reverbNode = null;
let initialized = false;
let currentTrack = 0;
let droneNodes = [];
let listeners = [];
let chordCount = 0;

const CHORDS_PER_TRACK = 6;

const PLAYLIST = [
  {
    id: "dawn",
    name: "晨曦",
    emoji: "🌅",
    desc: "温柔苏醒",
    drone: 65.41,
    droneVol: 0.02,
    intervals: [4, 7, 12], // Major triad + octave
    baseNote: 261.63,
    bpm: 52,
    vol: 0.06,
    style: "warm",
  },
  {
    id: "garden",
    name: "花园",
    emoji: "🌸",
    desc: "宁静午后",
    drone: 55.0,
    droneVol: 0.015,
    intervals: [3, 7, 10],
    baseNote: 293.66,
    bpm: 58,
    vol: 0.055,
    style: "bright",
  },
  {
    id: "dusk",
    name: "暮色",
    emoji: "🌆",
    desc: "温柔黄昏",
    drone: 49.0,
    droneVol: 0.025,
    intervals: [4, 7, 11],
    baseNote: 220.0,
    bpm: 46,
    vol: 0.065,
    style: "mellow",
  },
  {
    id: "starry",
    name: "星空",
    emoji: "🌙",
    desc: "安然入梦",
    drone: 43.65,
    droneVol: 0.02,
    intervals: [4, 7, 12],
    baseNote: 174.61,
    bpm: 40,
    vol: 0.07,
    style: "ethereal",
  },
];

// ===== Utility Functions =====
function createNoiseBuffer(ctx, duration) {
  const sr = ctx.sampleRate;
  const len = sr * duration;
  const buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 0.3);
    }
  }
  return buf;
}

function createReverb(ctx) {
  const len = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 0.6);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

function getChordFreqs(base, intervals) {
  return intervals.map(i => base * Math.pow(2, i / 12));
}

// ===== Play a single warm chord =====
function playWarmChord(ctx, dest, reverb, freqs, time, duration, volume, style) {
  const now = time || ctx.currentTime;
  const dur = duration || 4.5;
  const vol = volume || 0.05;

  freqs.forEach((freq, i) => {
    // Layer 1: Main sine
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = freq;

    // Layer 2: Detuned sine (warmth)
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = freq * 1.003;

    // Layer 3: Soft triangle (body)
    const osc3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    osc3.type = "triangle";
    osc3.frequency.value = freq * 0.5;

    const attack = 0.3 + i * 0.05;
    g1.gain.setValueAtTime(0, now);
    g1.gain.linearRampToValueAtTime(vol * 0.6, now + attack);
    g1.gain.linearRampToValueAtTime(vol * 0.35, now + dur * 0.6);
    g1.gain.linearRampToValueAtTime(0, now + dur);

    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(vol * 0.3, now + attack + 0.1);
    g2.gain.linearRampToValueAtTime(vol * 0.15, now + dur * 0.6);
    g2.gain.linearRampToValueAtTime(0, now + dur);

    g3.gain.setValueAtTime(0, now);
    g3.gain.linearRampToValueAtTime(vol * 0.15, now + attack + 0.2);
    g3.gain.linearRampToValueAtTime(0, now + dur + 0.5);

    // Connect layers
    osc1.connect(g1);
    osc2.connect(g2);
    osc3.connect(g3);

    // 50% reverb, 50% direct
    const revG = ctx.createGain();
    revG.gain.value = 0.5;
    g1.connect(revG);
    g2.connect(revG);
    g3.connect(revG);
    revG.connect(reverb);

    const dirG = ctx.createGain();
    dirG.gain.value = 0.5;
    g1.connect(dirG);
    g2.connect(dirG);
    g3.connect(dirG);
    dirG.connect(dest);

    osc1.start(now);
    osc1.stop(now + dur + 0.5);
    osc2.start(now);
    osc2.stop(now + dur + 0.5);
    osc3.start(now);
    osc3.stop(now + dur + 1);
  });
}

// ===== Play a gentle chime =====
function playChime(ctx, dest, freq, time) {
  const now = time || ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.02, now + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
  osc.connect(g);
  g.connect(dest);
  osc.start(now);
  osc.stop(now + 3);
}

// ===== Play a gentle melody note =====
function playMelodyNote(ctx, dest, freq, time) {
  const now = time || ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.02, now + 0.1);
  g.gain.linearRampToValueAtTime(0.015, now + 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 2);
  osc.connect(g);
  g.connect(dest);
  osc.start(now);
  osc.stop(now + 2.5);
}

// ===== Schedule next chord =====
function scheduleNext(ctx, master, reverb) {
  if (!isPlaying || !ctx) return;

  const track = PLAYLIST[currentTrack];
  const now = ctx.currentTime;
  const base = track.baseNote * Math.pow(0.5 + Math.random() * 0.5, chordCount > 2 ? 0 : 1);

  // Transpose base note slightly
  const transpositions = [1, 1.25, 1.5, 1, 0.75, 1.25];
  const transpose = transpositions[chordCount % transpositions.length];
  const freqs = getChordFreqs(base * transpose, track.intervals);

  playWarmChord(ctx, master, reverb, freqs, now + 0.3, 4.5, track.vol, track.style);

  // Melody note (random)
  if (Math.random() < 0.3) {
    setTimeout(() => {
      if (!isPlaying) return;
      const melFreq = freqs[Math.floor(Math.random() * freqs.length)] * 1.5;
      try { playMelodyNote(ctx, master, melFreq, ctx.currentTime); } catch {}
    }, (1000 + Math.random() * 1500));
  }

  // Occasional chime
  if (Math.random() < 0.2) {
    setTimeout(() => {
      if (!isPlaying) return;
      const chimeFreq = freqs[freqs.length - 1] * 2;
      try { playChime(ctx, master, chimeFreq, ctx.currentTime); } catch {}
    }, (2000 + Math.random() * 2000));
  }

  chordCount++;
  if (chordCount >= CHORDS_PER_TRACK) {
    chordCount = 0;
    currentTrack = (currentTrack + 1) % PLAYLIST.length;
    updateDrone(ctx);
    notify();
  }

  const bpm = track.bpm || 50;
  const intervalMs = (60 / bpm) * 1000 * 3.5;
  timeoutId = setTimeout(() => scheduleNext(ctx, master, reverb), intervalMs);
}

function updateDrone(ctx) {
  if (!ctx || !isPlaying) return;
  const track = PLAYLIST[currentTrack];
  // Update existing drone or create new
  if (droneNodes.length > 0) {
    droneNodes.forEach(n => {
      try { n.osc.frequency.setTargetAtTime(track.drone, ctx.currentTime, 2); } catch {}
    });
  }
}

function startDrone(ctx, reverb) {
  const track = PLAYLIST[currentTrack];
  const now = ctx.currentTime;

  // Drone with slight detuning for warmth
  const drones = [
    { freq: track.drone, detune: 0, vol: track.droneVol },
    { freq: track.drone * 2, detune: 0.5, vol: track.droneVol * 0.3 },
  ];

  drones.forEach(d => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = d.freq;
    osc.detune.value = d.detune;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(d.vol, now + 3);
    osc.connect(g);
    g.connect(reverb);
    osc.start();
    droneNodes.push({ osc, gain: g, freq: d.freq });
  });
}

function startWindNoise(ctx, master) {
  const sr = ctx.sampleRate;
  const buf = createNoiseBuffer(ctx, 4);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.003, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.006, ctx.currentTime + 2);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 500;
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start();
  return { src, gain: g, filter };
}

let windNode = null;

// ===== Public API =====
export function getAudioState() {
  return { isPlaying, initialized, currentTrack, currentTrackName: PLAYLIST[currentTrack]?.name || "", currentTrackEmoji: PLAYLIST[currentTrack]?.emoji || "", style: PLAYLIST[currentTrack]?.style || "", playlist: PLAYLIST };
}

export function getPlaylist() { return PLAYLIST; }
export function getCurrentTrack() { return PLAYLIST[currentTrack]; }

export function subscribe(callback) {
  listeners.push(callback);
  return () => { listeners = listeners.filter(l => l !== callback); };
}

function notify() {
  const track = PLAYLIST[currentTrack];
  listeners.forEach(l => l({ isPlaying, initialized, currentTrack, currentTrackName: track.name, currentTrackEmoji: track.emoji, style: track.style, playlist: PLAYLIST }));
}

export function startAudio(trackIndex) {
  if (isPlaying) {
    if (trackIndex !== undefined && trackIndex !== currentTrack) { switchTrack(trackIndex); }
    return;
  }
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0.10;
    master.connect(ctx.destination);
    masterGain = master;

    const reverb = createReverb(ctx);
    reverb.connect(master);
    reverbNode = reverb;

    if (trackIndex !== undefined) currentTrack = trackIndex;
    chordCount = 0;
    droneNodes = [];

    startDrone(ctx, reverb);
    windNode = startWindNoise(ctx, master);
    isPlaying = true;
    initialized = true;
    notify();
    scheduleNext(ctx, master, reverb);
  } catch (e) { console.log("Audio init failed:", e); }
}

export function stopAudio() {
  isPlaying = false;
  if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
  droneNodes.forEach(n => { try { n.osc.stop(); } catch {} });
  droneNodes = [];
  if (windNode) { try { windNode.src.stop(); } catch {} windNode = null; }
  if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
  masterGain = null; reverbNode = null;
  notify();
}

export function toggleAudio(trackIndex) {
  if (isPlaying) { stopAudio(); } else { startAudio(trackIndex); }
}

export function switchTrack(trackIndex) {
  if (trackIndex < 0 || trackIndex >= PLAYLIST.length) return;
  currentTrack = trackIndex;
  chordCount = 0;
  // Reschedule
  if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
  updateDrone(audioCtx);
  notify();
  if (isPlaying && audioCtx) {
    scheduleNext(audioCtx, masterGain, reverbNode);
  }
}

export function nextTrack() { switchTrack((currentTrack + 1) % PLAYLIST.length); }
export function prevTrack() { switchTrack((currentTrack - 1 + PLAYLIST.length) % PLAYLIST.length); }

// ===== Notification Sound =====
export function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    // Pleasant two-tone chime
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = now + i * 0.15;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 2);
    });

    setTimeout(() => ctx.close(), 2000);
  } catch {}
}
