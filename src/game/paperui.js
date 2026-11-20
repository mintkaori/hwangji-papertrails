// 황지 페이퍼트레일: the words on the screen (DOM only).
// Every message sits on a soft translucent panel (warm dark paper, a little blur), so it stays readable on the brightest
// page while the paper world still shows through. The letters rise in one by one; when the message is done the wind
// takes it: the letters lift and drift off to the right one after another, turning and fading, like paper scraps in a
// breeze, and the panel fades away under them.
// Also the 도감: a button with the count (bottom centre, B), a little picture card that pops out of the thing that was
// found and flies into it, and the book itself - every place, festival, legend, creature and friend found so far,
// with a picture, the short line and the long story.

const FONT = "'Jua', 'BM JUA_TTF', 'BM JUA_OTF', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
/** The discoveries are lettered like a printed storybook (Gowun Batang, index.html) in dark ink with a paper glow. */
const BOOK = "'Gowun Batang', 'Nanum Myeongjo', 'AppleMyungjo', 'Batang', serif";
const INK_HALO = '0 0 2px rgba(255, 250, 238, 0.95), 0 0 7px rgba(255, 248, 232, 0.9), 0 0 16px rgba(255, 246, 226, 0.75), 0 0 30px rgba(255, 244, 220, 0.5)';
const SOFT = '0 1px 2px rgba(20, 12, 4, 0.55)';
const PANEL = 'rgba(34, 22, 12, 0.66)';
const PANEL_HOVER = 'rgba(52, 34, 18, 0.8)';
const RIM = 'inset 0 0 0 1.5px rgba(255, 233, 196, 0.22)';
const DROP = '0 8px 24px rgba(10, 6, 2, 0.28)';
const BLUR = '-webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);';

const CSS = `
.hj-ui { position: fixed; pointer-events: none; user-select: none; z-index: 5; font-family: ${FONT}; box-sizing: border-box;
  color: #fffaf0; text-shadow: ${SOFT}; visibility: hidden; }
.hj-ui.on { visibility: visible; }
/* the translucent panel behind a message: it fades in with the letters and drifts off with the wind */
.hj-ui.panel::before { content: ''; position: absolute; inset: 0; z-index: -1; border-radius: 16px; background: ${PANEL}; ${BLUR}
  box-shadow: ${DROP}, ${RIM}; opacity: 0; transform: scale(0.97);
  transition: opacity 0.35s ease, transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
.hj-ui.panel.in::before { opacity: 1; transform: none; }
.hj-ui.panel.gust::before { opacity: 0; transform: translate(26px, -6px) scale(0.98);
  transition: opacity 0.8s ease-in 0.12s, transform 1s ease-in 0.1s; }
.hj-ui .w { display: inline-block; white-space: pre; opacity: 0; transform: translate(-0.12em, 0.42em); filter: blur(3px);
  transition: opacity 0.42s ease, transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.42s ease;
  transition-delay: calc(var(--i) * 14ms); }
.hj-ui.in .w { opacity: 1; transform: none; filter: none; }
.hj-ui.gust .w { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--r)) scale(0.86); filter: blur(2px);
  transition: opacity 0.75s ease-in, transform 1.05s cubic-bezier(0.55, 0, 0.85, 0.55), filter 0.75s ease-in;
  transition-delay: calc(var(--i) * 10ms); }
.hj-ui .row { display: block; }
.hj-ui .wd { display: inline-block; white-space: nowrap; }
.hj-ui .t { color: #ffe39a; }
.hj-ui .s { color: #f2dfc0; font-size: 0.72em; letter-spacing: 0.05em; }
/* the opening story: top centre, the biggest words on the screen */
.hj-intro { left: 0; right: 0; margin: 0 auto; top: max(64px, 9vh); width: max-content; max-width: min(860px, 92vw);
  padding: 16px 30px 14px; text-align: center; font-size: clamp(20px, 2.7vw, 28px); line-height: 1.5; }
.hj-intro::before { border-radius: 20px; }
.hj-intro .s { margin-top: 8px; font-size: 0.62em; }
/* a discovery: no box - big storybook lettering in ink, written in by hand (.write) and blown away by the wind */
.hj-narr { left: 0; right: 0; margin: 0 auto; top: 52vh; width: min(920px, 94vw); text-align: center; font-family: ${BOOK};
  color: #3b2716; text-shadow: ${INK_HALO}; font-size: clamp(19px, 2.5vw, 27px); line-height: 1.45; }
.hj-narr .t { color: #33200f; font-weight: 700; font-size: clamp(34px, 4.8vw, 56px); letter-spacing: 0.05em; line-height: 1.2; margin-bottom: 8px; }
/* handwriting: each letter is inked in from the left, one after another (--step apart), the fresh ink a little lighter */
.hj-ui.write .w { opacity: 1; transform: none; filter: none; color: #86603e; clip-path: inset(-45% 160% -45% -60%);
  transition: clip-path 0.22s cubic-bezier(0.35, 0.1, 0.55, 1), color 0.9s ease;
  transition-delay: calc(var(--i) * var(--step, 60ms)); }
.hj-ui.write.in .w { clip-path: inset(-45% -60% -45% -60%); color: inherit; }
.hj-ui.write.gust .w { clip-path: inset(-45% -60% -45% -60%); color: inherit; opacity: 0; filter: blur(2px);
  transform: translate(var(--dx), var(--dy)) rotate(var(--r)) scale(0.86);
  transition: opacity 0.75s ease-in, transform 1.05s cubic-bezier(0.55, 0, 0.85, 0.55), filter 0.75s ease-in;
  transition-delay: calc(var(--i) * 10ms); }
.hj-season { left: 0; right: 0; margin: 0 auto; top: 24vh; width: max-content; max-width: 92vw; padding: 14px 40px 16px; text-align: center; }
.hj-season::before { border-radius: 24px; }
.hj-season .t { color: #fffaf0; font-size: clamp(36px, 6vw, 64px); letter-spacing: 0.08em; }
.hj-season .s { font-size: clamp(17px, 2.2vw, 23px); letter-spacing: 0.14em; }
.hj-badge { left: 14px; top: 12px; padding: 7px 15px 6px; font-size: 17px; letter-spacing: 0.03em; white-space: nowrap; }
.hj-badge::before, .hj-sky::before { border-radius: 999px; }
.hj-sky { left: 14px; top: 54px; padding: 7px 15px 6px; font-size: 16px; max-width: min(580px, 84vw); }
.hj-story { left: 0; right: 0; margin: 0 auto; bottom: 88px; width: max-content; max-width: min(720px, 92vw);
  padding: 14px 26px 12px; text-align: center; font-size: clamp(18px, 2.2vw, 21px); line-height: 1.6; }
.hj-story .t { font-size: 0.88em; letter-spacing: 0.06em; }
.hj-story .s { letter-spacing: 0.3em; margin-top: 4px; }
/* a mascot talking: a speech bubble with a tail pointing down at it */
.hj-bubble { left: 0; top: 0; width: max-content; max-width: min(340px, 74vw); padding: 10px 17px 9px; text-align: center;
  font-size: 19px; line-height: 1.4; }
.hj-bubble::before { border-radius: 14px; }
.hj-bubble::after { content: ''; position: absolute; left: 50%; bottom: -10px; margin-left: -10px; width: 0; height: 0;
  border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid ${PANEL};
  opacity: 0; transition: opacity 0.35s ease; }
.hj-bubble.in::after { opacity: 1; }
.hj-bubble.gust::after { opacity: 0; transition: opacity 0.6s ease-in; }
.hj-bubble .t { font-size: 0.82em; letter-spacing: 0.05em; }
.hj-bubble .s { font-size: 0.68em; margin-top: 3px; }
/* the 도감 button, bottom centre */
.hj-dexbtn { left: 0; right: 0; bottom: 16px; margin: 0 auto; width: max-content; display: flex; align-items: center; gap: 10px;
  padding: 9px 20px 8px; border-radius: 999px; font-size: 19px; pointer-events: auto; cursor: pointer; visibility: visible;
  background: ${PANEL}; ${BLUR} box-shadow: ${DROP}, inset 0 0 0 1.5px rgba(255, 227, 154, 0.45);
  transition: transform 0.25s ease, box-shadow 0.3s ease, background 0.25s ease; }
.hj-dexbtn:hover { transform: translateY(-2px) scale(1.04); background: ${PANEL_HOVER}; box-shadow: ${DROP}, inset 0 0 0 2px rgba(255, 227, 154, 0.85); }
.hj-dexbtn b { color: #ffe39a; font-weight: normal; }
.hj-dexbtn kbd { font: inherit; font-size: 0.7em; line-height: 1.3; color: #2b1c0e; background: #ffe39a; border-radius: 6px; padding: 1px 7px 0; text-shadow: none; }
.hj-dexbtn.glow { box-shadow: ${DROP}, inset 0 0 0 2px rgba(255, 227, 154, 0.95), 0 0 26px 6px rgba(255, 214, 120, 0.55); }
.hj-dexbtn.bump { animation: hjBump 0.7s ease; }
@keyframes hjBump { 0% { transform: scale(1); } 30% { transform: scale(1.22) rotate(-3deg); } 60% { transform: scale(0.96) rotate(1.5deg); } 100% { transform: scale(1); } }
/* the card that pops out of a new find and flies into the book */
.hj-fly { position: fixed; left: 0; top: 0; z-index: 7; pointer-events: none; width: 96px; margin: -50px 0 0 -48px; box-sizing: border-box;
  display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 6px 6px; border-radius: 14px;
  background: rgba(255, 249, 236, 0.97); color: #3a2614; font-family: ${FONT}; text-align: center; will-change: transform, opacity;
  box-shadow: 0 0 0 2px rgba(255, 214, 120, 0.95), 0 0 26px 8px rgba(255, 220, 140, 0.6), 0 8px 18px rgba(0, 0, 0, 0.3); }
.hj-fly .frame { display: flex; align-items: center; justify-content: center; font-size: 40px; line-height: 1; }
.hj-fly .pic { background-repeat: no-repeat; flex: none; }
.hj-fly .nm { font-size: 14px; line-height: 1.15; max-width: 86px; word-break: keep-all; }
/* the book */
.hj-dex { position: fixed; inset: 0; z-index: 8; display: none; align-items: center; justify-content: center; pointer-events: auto;
  background: rgba(14, 9, 4, 0.5); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); font-family: ${FONT};
  color: #fffaf0; cursor: default; }
.hj-dex.open { display: flex; animation: hjFade 0.3s ease; }
@keyframes hjFade { from { opacity: 0; } to { opacity: 1; } }
.hj-dex .book { width: min(1040px, 95vw); height: min(700px, 90vh); box-sizing: border-box; padding: 22px 26px 20px; border-radius: 22px;
  background: rgba(38, 25, 14, 0.94); box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45), inset 0 0 0 1.5px rgba(255, 227, 154, 0.35);
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); grid-template-rows: auto auto minmax(0, 1fr); gap: 14px 24px;
  animation: hjBookIn 0.38s cubic-bezier(0.2, 0.8, 0.2, 1); }
@keyframes hjBookIn { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: none; } }
.hj-dex .head { grid-column: 1 / -1; display: flex; align-items: center; gap: 16px; }
.hj-dex .head h2 { margin: 0; font-weight: normal; font-size: 32px; color: #ffe39a; letter-spacing: 0.06em; }
.hj-dex .head .prog { font-size: 18px; color: #f2dfc0; }
.hj-dex .head .x { margin-left: auto; font-size: 17px; color: #2b1c0e; background: #ffe39a; border-radius: 999px; padding: 7px 16px 6px; cursor: pointer; }
.hj-dex .head .x:hover { background: #fff0c2; }
.hj-dex .tabs { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px 10px; }
.hj-dex .tabs button { font: inherit; font-size: 19px; color: #f0e3cb; background: rgba(255, 245, 225, 0.07); cursor: pointer;
  border: 1.5px solid rgba(255, 240, 210, 0.18); border-radius: 999px; padding: 6px 16px 5px; }
.hj-dex .tabs button:hover { border-color: rgba(255, 227, 154, 0.7); }
.hj-dex .tabs button.on { color: #2b1c0e; background: #ffe39a; border-color: #ffe39a; }
.hj-dex .list { overflow-y: auto; padding-right: 6px; display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px;
  align-content: start; scrollbar-width: thin; }
.hj-dex .item { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 12px; cursor: pointer; font-size: 17px; line-height: 1.25;
  border: 1.5px solid rgba(255, 240, 210, 0.14); background: rgba(255, 245, 225, 0.06); }
.hj-dex .item:hover, .hj-dex .item.sel { border-color: rgba(255, 227, 154, 0.85); background: rgba(255, 245, 225, 0.14); }
.hj-dex .item.unknown { color: #b3a48d; cursor: default; }
.hj-dex .item.unknown:hover { border-color: rgba(255, 240, 210, 0.14); background: rgba(255, 245, 225, 0.06); }
.hj-dex .frame { display: flex; align-items: center; justify-content: center; flex: none; }
.hj-dex .pic { background-repeat: no-repeat; flex: none; filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.45)); }
.hj-dex .item.unknown .pic { filter: brightness(0) opacity(0.35); }
.hj-dex .detail { overflow-y: auto; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 14px 18px;
  border-radius: 16px; background: rgba(255, 245, 225, 0.05); }
.hj-dex .detail .frame { margin: 4px 0 12px; }
.hj-dex .detail h3 { margin: 0; font-weight: normal; font-size: 30px; color: #ffe39a; letter-spacing: 0.04em; }
.hj-dex .detail .short { margin: 8px 0 14px; font-size: 20px; color: #fff3da; }
.hj-dex .detail p { margin: 0 0 12px; font-size: 19px; line-height: 1.75; max-width: 520px; color: #fdf4e3; }
.hj-dex .detail .where { margin-top: 4px; font-size: 17px; color: #ffe39a; letter-spacing: 0.03em; background: rgba(255, 227, 154, 0.1);
  padding: 6px 14px 5px; border-radius: 999px; }
@media (max-width: 720px) {
  .hj-dex .book { grid-template-columns: 1fr; grid-template-rows: auto auto minmax(0, 0.9fr) minmax(0, 1.1fr); height: 92vh; padding: 16px; }
  .hj-dex .head h2 { font-size: 26px; }
  .hj-dex .detail p { font-size: 17px; }
  .hj-badge { font-size: 15px; }
  .hj-dexbtn { font-size: 17px; padding: 8px 16px 7px; }
}
`;

function div(cls) { const d = document.createElement('div'); d.className = cls; return d; }

/**
 * Fill `el` with rows of single-letter spans (each with its own wind path). rows: [{ text, cls }] (cls 't' title,
 * 's' small). The letters of a word are held together, so a long line wraps between words, never inside one.
 */
function letterize(el, rows) {
  el.innerHTML = '';
  let i = 0;
  for (const r of rows) {
    if (!r || !r.text) continue;
    const row = document.createElement('span');
    row.className = 'row' + (r.cls ? ' ' + r.cls : '');
    for (const tok of String(r.text).match(/\s+|\S+/g) || []) {
      const space = /^\s/.test(tok);
      const host = space ? row : row.appendChild(Object.assign(document.createElement('span'), { className: 'wd' }));
      for (const ch of tok) {
        const w = document.createElement('span');
        w.className = 'w';
        w.textContent = ch;
        // the wind blows from the west: every letter drifts right and up, turning a little, a bit differently each
        const k = Math.random();
        w.style.setProperty('--i', String(i));
        w.style.setProperty('--dx', (60 + 90 * k + i * 0.6).toFixed(0) + 'px');
        w.style.setProperty('--dy', (-14 - 46 * Math.random()).toFixed(0) + 'px');
        w.style.setProperty('--r', (14 + 50 * Math.random() * (Math.random() < 0.5 ? -1 : 1)).toFixed(0) + 'deg');
        host.appendChild(w);
        i++;
      }
    }
    el.appendChild(row);
  }
  return i;
}

/** sound(id): play a UI sound ('discover', 'collect', 'open', 'close', 'page'); a no-op by default. */
export function createPaperUI({ sound = () => {} } = {}) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const made = [];

  /**
   * A message slot (cls: its class names; add 'panel' for the translucent panel): show(rows, hold) letters it in (and
   * blows it away after `hold` s when hold > 0); gust() blows it now.
   */
  function slot(cls) {
    const el = div('hj-ui ' + cls);
    document.body.appendChild(el);
    made.push(el);
    let timer = 0; let out = 0; let count = 0; let shown = false;
    const clear = () => { clearTimeout(timer); clearTimeout(out); timer = out = 0; };
    return {
      el,
      get shown() { return shown; },
      /** Returns the number of letters (a written slot takes count x --step to write). */
      show(rows, hold = 0) {
        clear();
        el.classList.remove('gust', 'in');
        count = letterize(el, rows);
        el.classList.add('on');
        void el.offsetWidth; // start the letters from their "before" state
        el.classList.add('in');
        shown = true;
        if (hold > 0) timer = setTimeout(() => this.gust(), hold * 1000);
        return count;
      },
      gust() {
        if (!shown) return;
        clear();
        shown = false;
        el.classList.add('gust');
        out = setTimeout(() => { el.classList.remove('on', 'in', 'gust'); el.innerHTML = ''; }, 1100 + count * 10);
      },
      /** Put it away without the wind (it is being replaced at once). */
      hideNow() { clear(); shown = false; el.classList.remove('on', 'in', 'gust'); el.innerHTML = ''; },
    };
  }

  // ---- the book's pictures (cut from sprite sheets with CSS) ---------------------------------------------------------
  const sheets = {}; // image src -> [w, h]
  /**
   * Make `el` show exactly the sprite pic.rect, scaled to fit boxW x boxH: el takes the sprite's scaled size (so no
   * neighbouring art of the sheet shows); its parent (a .frame of the box size) centres it. False when not loaded.
   */
  function picStyle(el, pic, boxW, boxH) {
    if (!pic || !pic.src || !pic.rect || !sheets[pic.src]) { el.style.backgroundImage = 'none'; el.style.width = el.style.height = '0px'; return false; }
    const [x, y, w, h] = pic.rect; const [W, H] = sheets[pic.src];
    const s = Math.min(boxW / w, boxH / h);
    el.style.width = (w * s).toFixed(1) + 'px';
    el.style.height = (h * s).toFixed(1) + 'px';
    el.style.backgroundImage = `url("${pic.src}")`;
    el.style.backgroundSize = `${(W * s).toFixed(1)}px ${(H * s).toFixed(1)}px`;
    el.style.backgroundPosition = `${(-x * s).toFixed(1)}px ${(-y * s).toFixed(1)}px`;
    return true;
  }
  /** A box of boxW x boxH with the sprite centred in it. */
  function framed(pic, boxW, boxH) {
    const frame = div('frame');
    frame.style.width = boxW + 'px'; frame.style.height = boxH + 'px';
    const p = div('pic');
    frame.appendChild(p);
    const ok = picStyle(p, pic, boxW, boxH);
    return { frame, ok };
  }

  // ---- the 도감 button and the flying card --------------------------------------------------------------------------
  const btn = div('hj-ui hj-dexbtn');
  btn.innerHTML = '<span>📖 도감</span><b>0</b><kbd>B</kbd>';
  btn.title = '도감 열기 (B)';
  document.body.appendChild(btn);
  made.push(btn);
  function setCount(n, total) { btn.querySelector('b').textContent = `${n} / ${total}`; }
  function bump() { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); }
  let flying = 0;
  /**
   * A new find: a picture card pops out of screen point (x, y) - where the thing is - and rises, waits a moment so it
   * can be seen, then swoops into the 도감 button. card: { name, icon, pic }; onLand() runs when it is in the book.
   */
  function flyToDex(x, y, card = {}, onLand = null) {
    const f = div('hj-fly');
    const { frame, ok } = framed(card.pic, 80, 64);
    if (!ok) frame.textContent = card.icon || '✨';
    const nm = div('nm');
    nm.textContent = card.name || '';
    f.append(frame, nm);
    document.body.appendChild(f);
    const W = window.innerWidth; const H = window.innerHeight;
    const sx = Math.min(W - 56, Math.max(56, x)); const sy = Math.min(H - 140, Math.max(120, y)); // keep the card on screen
    const r = btn.getBoundingClientRect();
    const tx = r.left + r.width / 2; const ty = r.top + r.height / 2;
    const up = sy - 64; // it rises out of the thing that was found ...
    const mx = (sx + tx) / 2 + (sx < tx ? -1 : 1) * Math.min(140, Math.abs(tx - sx) * 0.3); const my = Math.min(up, ty) - 60; // ... and arcs into the book
    flying++;
    btn.classList.add('glow');
    sound('discover');
    const a = f.animate([
      { transform: `translate(${sx}px, ${sy}px) scale(0.2)`, opacity: 0, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.25)' },
      { transform: `translate(${sx}px, ${up}px) scale(1.08)`, opacity: 1, offset: 0.16, easing: 'ease-out' },
      { transform: `translate(${sx}px, ${up}px) scale(1)`, opacity: 1, offset: 0.24, easing: 'ease-in-out' },
      { transform: `translate(${sx}px, ${up - 8}px) scale(1)`, opacity: 1, offset: 0.5, easing: 'cubic-bezier(0.45, 0, 0.6, 1)' }, // a moment to see it
      { transform: `translate(${mx}px, ${my}px) scale(0.8) rotate(-8deg)`, opacity: 1, offset: 0.76, easing: 'cubic-bezier(0.4, 0, 0.7, 1)' },
      { transform: `translate(${tx}px, ${ty}px) scale(0.26) rotate(6deg)`, opacity: 0.8 },
    ], { duration: 2700, fill: 'forwards' });
    a.onfinish = () => {
      f.remove();
      if (--flying <= 0) { flying = 0; btn.classList.remove('glow'); }
      bump();
      sound('collect');
      if (onLand) onLand();
    };
  }

  // ---- the book ------------------------------------------------------------------------------------------------------
  const dex = div('hj-dex');
  dex.innerHTML = `<div class="book"><div class="head"><h2>📖 태백 도감</h2><span class="prog"></span><span class="x">닫기 ✕ (B)</span></div>
    <div class="tabs"></div><div class="list"></div><div class="detail"></div></div>`;
  document.body.appendChild(dex);
  made.push(dex);
  let book = null; // { tabs: [{ id, name, entries: [{ id, name, icon, short, detail, where, pic, known }] }], total, found }
  let tab = 0; let sel = null; let isOpen = false;
  function renderDetail() {
    const d = dex.querySelector('.detail');
    d.innerHTML = '';
    const e = sel;
    if (!e) { d.innerHTML = '<p class="where">아직 찾은 것이 없어요. 가까이 다가가 보세요!</p>'; return; }
    const box = { w: Math.round(Math.min(320, d.clientWidth * 0.7 || 320)), h: window.innerWidth <= 720 ? 120 : 210 };
    d.appendChild(framed(e.pic, box.w, box.h).frame);
    const h = document.createElement('h3'); h.textContent = `${e.icon || ''} ${e.name}`;
    const sh = div('short'); sh.textContent = e.short || '';
    d.append(h, sh);
    for (const para of String(e.detail || '').split('\n')) { if (!para) continue; const p = document.createElement('p'); p.textContent = para; d.appendChild(p); }
    if (e.where) { const w = div('where'); w.textContent = e.where; d.appendChild(w); }
  }
  function render() {
    if (!book) return;
    dex.querySelector('.prog').textContent = `${book.found} / ${book.total} 발견`;
    const tabs = dex.querySelector('.tabs');
    tabs.innerHTML = '';
    book.tabs.forEach((t, i) => {
      const b = document.createElement('button');
      const n = t.entries.filter((e) => e.known).length;
      b.textContent = `${t.name} ${n}/${t.entries.length}`;
      if (i === tab) b.className = 'on';
      b.onclick = () => { if (tab !== i) sound('page'); tab = i; sel = book.tabs[tab].entries.find((e) => e.known) || null; render(); };
      tabs.appendChild(b);
    });
    const list = dex.querySelector('.list');
    list.innerHTML = '';
    const t = book.tabs[tab];
    for (const e of t.entries) {
      const it = div('item' + (e.known ? '' : ' unknown') + (sel && sel.id === e.id ? ' sel' : ''));
      const name = document.createElement('span');
      name.textContent = e.known ? e.name : '???';
      it.append(framed(e.pic, 48, 48).frame, name);
      if (e.known) it.onclick = () => { if (sel !== e) sound('page'); sel = e; render(); };
      list.appendChild(it);
    }
    renderDetail();
  }
  function open(b) {
    book = b;
    if (!sel || !book.tabs[tab].entries.some((e) => e.id === sel.id && e.known)) sel = book.tabs[tab].entries.find((e) => e.known) || null;
    if (!isOpen) sound('open');
    isOpen = true;
    dex.classList.add('open');
    render();
  }
  function close() { if (isOpen) sound('close'); isOpen = false; dex.classList.remove('open'); }
  dex.addEventListener('pointerdown', (e) => { if (e.target === dex || e.target.classList.contains('x')) close(); });

  /** Preload a sprite sheet's size so pictures can be cut from it with CSS. */
  function sheet(src) {
    if (sheets[src]) return;
    const img = new Image();
    img.onload = () => { sheets[src] = [img.naturalWidth, img.naturalHeight]; if (isOpen) render(); };
    img.src = src;
  }

  return {
    slot,
    setCount,
    flyToDex,
    sheet,
    button: btn,
    open,
    close,
    get isOpen() { return isOpen; },
    /** Focus an entry (id) in the open book. */
    select(id) { if (!book) return; for (let i = 0; i < book.tabs.length; i++) { const e = book.tabs[i].entries.find((q) => q.id === id); if (e) { tab = i; sel = e.known ? e : sel; render(); return; } } },
    dispose() { for (const el of made) el.remove(); style.remove(); },
  };
}
