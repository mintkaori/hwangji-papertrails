// 황지 페이퍼트레일: the UI sounds - short ElevenLabs sound effects in public/sounds/ (the 도감 card popping out of a
// find and landing in the book, a pencil writing the find's name, the book opening and closing, a page turning, a
// mascot's speech bubble, a new season).
// They play through the paper audio's AudioContext into its master gain, so ?mute=1 and the master mute hold.
// Browsers only start audio inside a user gesture: any key or click (not just walking) unlocks it here.
const GAIN = { discover: 0.55, collect: 0.6, write: 0.5, open: 0.55, close: 0.4, page: 0.42, talk: 0.32, season: 0.42 };
const FILE = { open: 'book_open', close: 'book_close' };

/**
 * extra: more file names (without .mp3) to load, e.g. voice lines. voices: folder of the mascots' recorded lines
 * (<who>/<hash>.mp3 listed in index.json, game/talk.js) - fetched one by one when a mascot says the line.
 */
export function createSfx({ audio, base = './sounds/', extra = [], voices = './voices/' }) {
  const raw = new Map(); const buf = new Map(); const decoding = new Set(); const playing = new Map();
  const fail = new Set();
  let voiceSet = new Set();
  fetch(voices + 'index.json').then((r) => (r.ok ? r.json() : [])).then((list) => { voiceSet = new Set(list); }).catch(() => {});
  const voiceBuf = new Map(); // key -> AudioBuffer (the most recent few)
  let voiceToken = 0;
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
      g.gain.value = (GAIN[id] ?? (id.startsWith('intro_') ? 0.85 : 1)) * gain;
      src.connect(g).connect(audio.output || ctx.destination);
      const voice = { src, g };
      src.onended = () => { if (playing.get(id) === voice) playing.delete(id); };
      src.start();
      playing.set(id, voice);
      return b.duration;
    },
    /** Stop a sound that is still playing - at once, or fading out over `fade` seconds. */
    stop(id, fade = 0) {
      const v = playing.get(id);
      if (!v) return;
      playing.delete(id);
      const ctx = audio.context;
      try {
        if (fade > 0 && ctx) {
          const t = ctx.currentTime;
          v.g.gain.cancelScheduledValues(t);
          v.g.gain.setValueAtTime(v.g.gain.value, t);
          v.g.gain.linearRampToValueAtTime(0, t + fade);
          v.src.stop(t + fade + 0.02);
        } else v.src.stop();
      } catch { /* already ended */ }
    },
    /**
     * A mascot says a recorded line (key = talk.js voiceKey): the one speaking before is cut short. Resolves to the
     * line's length in seconds, or 0 when there is no recording or no sound yet. A line asked for while an older one
     * was still loading wins: the older one is never played.
     */
    async speak(key, gain = 1) {
      const my = ++voiceToken;
      this.stop('voice', 0.08);
      if (!voiceSet.has(key) || !live()) return 0;
      let b = voiceBuf.get(key);
      if (!b) {
        try {
          const r = await fetch(voices + key + '.mp3');
          if (!r.ok) return 0;
          const a = await r.arrayBuffer();
          if (!audio.context) return 0;
          b = await audio.context.decodeAudioData(a);
        } catch { return 0; }
        voiceBuf.set(key, b);
        if (voiceBuf.size > 24) voiceBuf.delete(voiceBuf.keys().next().value);
      }
      if (my !== voiceToken || !live()) return 0;
      const ctx = audio.context;
      const src = ctx.createBufferSource();
      src.buffer = b;
      const g = ctx.createGain();
      g.gain.value = 0.9 * gain;
      src.connect(g).connect(audio.output || ctx.destination);
      const voice = { src, g };
      src.onended = () => { if (playing.get('voice') === voice) playing.delete('voice'); };
      src.start();
      playing.set('voice', voice);
      return b.duration;
    },
    /** The mascot stops talking (fading out over `fade` s). */
    hush(fade = 0.25) { voiceToken++; this.stop('voice', fade); },
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
