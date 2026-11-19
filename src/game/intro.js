// 황지 페이퍼트레일: the opening story. When the page opens, a short guide to the Taebaek trip rises in at the top
// centre, line by line, and is read aloud - by the recorded voice lines (public/sounds/intro_N.mp3: ElevenLabs TTS,
// Korean voice 'sena', eleven_multilingual_v2; used when voiceFiles is on) or, if they cannot play, by the browser's
// own Korean voice (Web Speech). Browsers only let a page speak after a click or a key, so until then the lines go on
// by reading time with a small note under them; the first click or key reads the line that is up aloud, and the rest
// follow with the voice. If INTRO changes, record the lines again. main.js: ?intro=0 skips it.

export const INTRO = [
  '안녕! 하늘과 가까운 고원도시, 태백에 온 걸 환영해.',
  '우리 여행은 황지중앙초등학교 앞에서 시작해.',
  '길을 따라 멀리 걸어가면 여름, 가을, 겨울의 태백이 차례로 펼쳐져.',
  '멋진 장소나 친구를 가까이에서 만나면 도감에 쏙 담겨. B를 눌러 펼쳐 봐!',
  '자, 그럼 태백 여행을 떠나 볼까?',
];

/** ui: game/paperui.js; sfx: audio/sfx.js (gestures, mute, voice files). */
export function createIntro({ ui, sfx = null, lines = INTRO, delay = 1.4, voiceFiles = false }) {
  const slot = ui.slot('hj-intro panel');
  const S = typeof window !== 'undefined' && window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined' ? window.speechSynthesis : null;
  let k = -1; let timer = 0; let startT = 0; let token = 0;
  let started = false; let done = false; let voiced = false; let gestured = false; let speaking = false;
  const muted = () => !!(sfx && sfx.muted);
  const canSpeak = () => gestured || !!(navigator.userActivation && navigator.userActivation.hasBeenActive);
  const fileOf = (i) => 'intro_' + (i + 1);
  const hasFile = (i) => voiceFiles && !!sfx && sfx.has(fileOf(i));

  // the best Korean voice the browser has (natural / online voices first)
  let koVoice = null;
  function pickVoice() {
    if (!S) return null;
    const vs = S.getVoices().filter((v) => /^ko([-_]|$)/i.test(v.lang || ''));
    if (!vs.length) return null;
    const score = (v) => (/natural|neural|online/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0) + (/sunhi|heami|yuna|seoyeon/i.test(v.name) ? 1 : 0) + (v.localService ? 0 : 1);
    return vs.sort((a, b) => score(b) - score(a))[0];
  }
  const onVoices = () => { koVoice = pickVoice(); };
  if (S) { onVoices(); if (S.addEventListener) S.addEventListener('voiceschanged', onVoices); }
  const canVoice = (i) => !muted() && (hasFile(i) || !!koVoice);

  function schedule(sec) { clearTimeout(timer); timer = setTimeout(next, sec * 1000); }
  function quiet() {
    if (sfx && k >= 0) sfx.stop(fileOf(k));
    if (S && speaking) S.cancel();
    speaking = false;
  }

  /** Read line i aloud; true when a voice started (the next line is then timed from its end). */
  function speak(i, my) {
    if (!canSpeak() || !canVoice(i)) return false;
    if (hasFile(i)) {
      const d = sfx.play(fileOf(i));
      if (d > 0) { schedule(d + 0.7); return true; }
    }
    if (!S || !koVoice) return false;
    const u = new SpeechSynthesisUtterance(lines[i]);
    u.voice = koVoice; u.lang = koVoice.lang || 'ko-KR'; u.rate = 1; u.pitch = 1.08; u.volume = 0.95;
    const end = () => { if (my === token) { speaking = false; schedule(0.6); } };
    u.onend = end; u.onerror = end;
    S.cancel();
    speaking = true;
    S.speak(u);
    schedule(Math.max(4, lines[i].length * 0.22 + 2.5)); // in case the voice never says it has ended
    return true;
  }

  function show(i) {
    const my = ++token;
    quiet();
    const v = speak(i, my);
    if (v) voiced = true;
    const note = !v && !canSpeak() && canVoice(i) ? { text: '🔊 화면을 누르면 목소리로 들려줄게요', cls: 's' } : null;
    slot.show([{ text: lines[i] }, note]);
    if (!v) schedule(Math.max(3.4, lines[i].length * 0.13)); // reading time
  }
  function next() {
    k++;
    if (k >= lines.length) { finish(); return; }
    show(k);
  }
  function finish() {
    if (done) return;
    done = true;
    clearTimeout(timer); clearTimeout(startT);
    quiet();
    slot.gust();
  }

  // the first click or key: read the line that is up now aloud, and the rest with it
  async function onGesture() {
    const first = !gestured;
    gestured = true;
    if (!first || !started || done || voiced || k < 0 || !canVoice(k)) return;
    const at = k;
    if (hasFile(at)) await sfx.ready(fileOf(at), 1500);
    if (done || voiced || k !== at) return;
    show(k);
  }
  const offGesture = sfx ? sfx.onGesture(onGesture) : null;
  if (!sfx) { window.addEventListener('pointerdown', onGesture, true); window.addEventListener('keydown', onGesture, true); }

  return {
    /** Begin the story (once), a moment after the page has opened. */
    start() {
      if (started || done) return;
      started = true;
      startT = setTimeout(next, delay * 1000);
    },
    /** Blow the story away now. */
    skip: finish,
    get done() { return done; },
    dispose() {
      finish();
      if (offGesture) offGesture();
      else { window.removeEventListener('pointerdown', onGesture, true); window.removeEventListener('keydown', onGesture, true); }
      if (S && S.removeEventListener) S.removeEventListener('voiceschanged', onVoices);
    },
  };
}
