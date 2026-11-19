// 황지 페이퍼트레일: the UI sounds - short ElevenLabs sound effects in public/sounds/ (the 도감 card popping out of a
// find and landing in the book, the book opening and closing, a page turning, a mascot's speech bubble, a new season).
// They play through the paper audio's AudioContext into its master gain, so ?mute=1 and the master mute hold.
// Browsers only start audio inside a user gesture: any key or click (not just walking) unlocks it here.
const GAIN = { discover: 0.55, collect: 0.6, open: 0.55, close: 0.4, page: 0.42, talk: 0.32, season: 0.42 };
const FILE = { open: 'book_open', close: 'book_close' };

/** extra: more file names (without .mp3) to load, e.g. voice lines. */
export function createSfx({ audio, base = './sounds/', extra = [] }) {
  const raw = new Map(); const buf = new Map(); const decoding = new Set(); const playing = new Map();
  const fail = new Set();
  const ids = [...Object.keys(GAIN), ...extra];
  for (const id of ids) {
    fetch(base + (FILE[id] || id) + '.mp3')
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((a) => { if (a) { raw.set(id, a); decodeAll(); } else fail.add(id); })
      .catch(() => fail.add(id));
  }
  function decodeAll() {
    const ctx = audio.context;
    if (!ctx) return;
    for (const [id, a] of raw) {
      if (buf.has(id) || decoding.has(id)) continue;
      decoding.add(id);
      ctx.decodeAudioData(a.slice(0)).then((b) => { buf.set(id, b); }).catch(() => fail.add(id)).finally(() => decoding.delete(id));
    }
  }
  const live = () => { const c = audio.context; return !!c && c.state === 'running' && !audio.muted; };

  const unlockers = new Set();
  function onGesture() {
    if (audio.muted) return;
    audio.unlock();
    decodeAll();
    for (const fn of unlockers) fn();
  }
  window.addEventListener('pointerdown', onGesture, true);
  window.addEventListener('keydown', onGesture, true);

  return {
    /** Play a sound now; returns its length in seconds (0 when it cannot play yet: no gesture, muted, not loaded). */
    play(id, gain = 1) {
      if (!live()) return 0;
      const b = buf.get(id);
      if (!b) { decodeAll(); return 0; }
      const ctx = audio.context;
      const src = ctx.createBufferSource();
      src.buffer = b;
      const g = ctx.createGain();
      g.gain.value = (GAIN[id] ?? 1) * gain;
      src.connect(g).connect(audio.output || ctx.destination);
      src.onended = () => { if (playing.get(id) === src) playing.delete(id); };
      src.start();
      playing.set(id, src);
      return b.duration;
    },
    /** Stop a sound that is still playing. */
    stop(id) { const s = playing.get(id); if (s) { try { s.stop(); } catch { /* ended */ } playing.delete(id); } },
    /** The file exists (it may still be decoding). */
    has(id) { return raw.has(id) || buf.has(id); },
    /** Resolves true once `id` can play (gesture made, decoded), false after `ms`. */
    ready(id, ms = 1500) {
      return new Promise((done) => {
        const t0 = performance.now();
        const look = () => {
          if (live() && buf.has(id)) return done(true);
          if (fail.has(id) || performance.now() - t0 > ms) return done(false);
          decodeAll();
          setTimeout(look, 60);
        };
        look();
      });
    },
    get live() { return live(); },
    get muted() { return audio.muted; },
    /** fn() after every key or click (the page may make sound from now on). */
    onGesture(fn) { unlockers.add(fn); return () => unlockers.delete(fn); },
    dispose() {
      window.removeEventListener('pointerdown', onGesture, true);
      window.removeEventListener('keydown', onGesture, true);
      unlockers.clear();
    },
  };
}
