// 황지 페이퍼트레일: the words on the screen (DOM only).
// Every message is bare lettering on a soft dark halo - no cards, no boxes - so the paper world shows through, and the
// halo keeps it readable on the brightest page. It rises in letter by letter; when it is done the wind takes it: the
// letters lift and drift off to the right one after another, turning and fading, like paper scraps in a breeze.
// Also the 도감: a button with the count (top right, B), a little paper card that flies into it when something new is
// found, and the book itself - every place, festival, legend, creature and friend found so far, with a picture,
// the short line and the long story.

const FONT = "'Jua', 'BM JUA_TTF', 'BM JUA_OTF', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
const HALO = '0 0 1px rgba(34, 20, 8, 0.95), 0 0 3px rgba(34, 20, 8, 0.9), 0 1px 6px rgba(28, 16, 6, 0.75), 0 0 14px rgba(28, 16, 6, 0.45)';

const CSS = `
.hj-ui { position: fixed; pointer-events: none; user-select: none; z-index: 5; font-family: ${FONT};
  color: #fffaf0; text-shadow: ${HALO}; visibility: hidden; }
.hj-ui.on { visibility: visible; }
.hj-ui .w { display: inline-block; white-space: pre; opacity: 0; transform: translate(-0.12em, 0.42em); filter: blur(3px);
  transition: opacity 0.42s ease, transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.42s ease;
  transition-delay: calc(var(--i) * 14ms); }
.hj-ui.in .w { opacity: 1; transform: none; filter: none; }
.hj-ui.gust .w { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--r)) scale(0.86); filter: blur(2px);
  transition: opacity 0.75s ease-in, transform 1.05s cubic-bezier(0.55, 0, 0.85, 0.55), filter 0.75s ease-in;
  transition-delay: calc(var(--i) * 10ms); }
.hj-ui .row { display: block; }
.hj-ui .t { color: #ffe39a; }
.hj-ui .s { color: #f4e4c8; font-size: 0.72em; letter-spacing: 0.06em; }
.hj-narr { left: 0; right: 0; margin: 0 auto; top: 68vh; width: min(720px, 92vw); text-align: center;
  font-size: clamp(16px, 2.1vw, 19px); line-height: 1.45; }
.hj-narr .t { font-size: 1.32em; letter-spacing: 0.04em; }
.hj-season { left: 0; right: 0; margin: 0 auto; top: 24vh; width: 92vw; text-align: center; }
.hj-season .t { color: #fffaf0; font-size: clamp(34px, 6vw, 62px); letter-spacing: 0.08em; }
.hj-season .s { font-size: clamp(16px, 2.2vw, 22px); letter-spacing: 0.14em; }
.hj-badge { left: 16px; top: 12px; font-size: 15px; letter-spacing: 0.03em; }
.hj-badge .s { margin-left: 10px; font-size: 0.92em; }
.hj-sky { left: 16px; top: 38px; font-size: 14px; max-width: min(520px, 70vw); }
.hj-story { left: 0; right: 0; margin: 0 auto; bottom: 7vh; width: min(680px, 92vw); text-align: center;
  font-size: clamp(16px, 2vw, 19px); line-height: 1.55; }
.hj-story .t { font-size: 0.86em; letter-spacing: 0.06em; }
.hj-story .s { letter-spacing: 0.3em; }
.hj-bubble { left: 0; top: 0; width: min(300px, 70vw); text-align: center; font-size: 17px; line-height: 1.35; }
.hj-bubble .t { font-size: 0.8em; letter-spacing: 0.05em; }
.hj-bubble .s { font-size: 0.66em; }
.hj-dexbtn { right: 16px; top: 10px; font-size: 16px; pointer-events: auto; cursor: pointer; visibility: visible;
  padding: 4px 6px; transition: transform 0.25s ease; }
.hj-dexbtn:hover { transform: scale(1.06); }
.hj-dexbtn.bump { animation: hjBump 0.6s ease; }
.hj-dexbtn b { color: #ffe39a; font-weight: normal; margin-left: 6px; }
@keyframes hjBump { 0% { transform: scale(1); } 30% { transform: scale(1.32) rotate(-4deg); } 60% { transform: scale(0.94) rotate(2deg); } 100% { transform: scale(1); } }
.hj-fly { position: fixed; left: 0; top: 0; z-index: 7; pointer-events: none; width: 34px; height: 34px; margin: -17px 0 0 -17px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;
  background: radial-gradient(circle, rgba(255, 244, 214, 0.95) 0 55%, rgba(255, 220, 140, 0) 72%); box-shadow: 0 0 18px 6px rgba(255, 220, 140, 0.55); }
.hj-dex { position: fixed; inset: 0; z-index: 8; display: none; align-items: center; justify-content: center; pointer-events: auto;
  background: rgba(16, 10, 4, 0.6); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); font-family: ${FONT};
  color: #fffaf0; text-shadow: ${HALO}; cursor: default; }
.hj-dex.open { display: flex; animation: hjFade 0.35s ease; }
@keyframes hjFade { from { opacity: 0; } to { opacity: 1; } }
.hj-dex .book { width: min(1000px, 95vw); height: min(660px, 90vh); display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  grid-template-rows: auto auto minmax(0, 1fr); gap: 10px 22px; }
.hj-dex .head { grid-column: 1 / -1; display: flex; align-items: baseline; gap: 14px; }
.hj-dex .head h2 { margin: 0; font-weight: normal; font-size: 30px; color: #ffe39a; letter-spacing: 0.06em; }
.hj-dex .head span { font-size: 15px; color: #f4e4c8; }
.hj-dex .head .x { margin-left: auto; font-size: 15px; color: #f4e4c8; cursor: pointer; padding: 4px 8px; }
.hj-dex .tabs { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 6px 18px; }
.hj-dex .tabs button { font: inherit; font-size: 17px; color: #e9dcc4; background: none; border: none; padding: 2px 0 4px; cursor: pointer;
  text-shadow: ${HALO}; border-bottom: 2px solid transparent; }
.hj-dex .tabs button.on { color: #ffe39a; border-bottom-color: rgba(255, 227, 154, 0.8); }
.hj-dex .list { overflow-y: auto; padding-right: 6px; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px;
  align-content: start; scrollbar-width: thin; }
.hj-dex .item { display: flex; align-items: center; gap: 8px; padding: 6px 6px; border-radius: 10px; cursor: pointer; font-size: 15px;
  border: 1.5px solid rgba(255, 240, 210, 0.16); background: rgba(255, 245, 225, 0.05); }
.hj-dex .item:hover, .hj-dex .item.sel { border-color: rgba(255, 227, 154, 0.75); background: rgba(255, 245, 225, 0.12); }
.hj-dex .item.unknown { color: #a99a84; cursor: default; }
.hj-dex .item .pic { width: 40px; height: 40px; flex: none; }
.hj-dex .pic { background-repeat: no-repeat; filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.45)); }
.hj-dex .item.unknown .pic { filter: brightness(0) opacity(0.35); }
.hj-dex .detail { overflow-y: auto; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 4px 8px; }
.hj-dex .detail .pic { width: min(300px, 70%); height: 200px; margin: 6px 0 10px; }
.hj-dex .detail h3 { margin: 0; font-weight: normal; font-size: 28px; color: #ffe39a; letter-spacing: 0.04em; }
.hj-dex .detail .short { margin: 6px 0 12px; font-size: 18px; color: #fff3da; }
.hj-dex .detail p { margin: 0 0 10px; font-size: 17px; line-height: 1.65; max-width: 460px; }
.hj-dex .detail .where { font-size: 14px; color: #f4e4c8; letter-spacing: 0.04em; }
@media (max-width: 720px) {
  .hj-dex .book { grid-template-columns: 1fr; grid-template-rows: auto auto minmax(0, 0.9fr) minmax(0, 1.1fr); height: 92vh; }
  .hj-dex .detail .pic { height: 120px; }
}
`;

function div(cls) { const d = document.createElement('div'); d.className = cls; return d; }

/** Fill `el` with rows of single-letter spans (each with its own wind path). rows: [{ text, cls }] (cls 't' title, 's' small). */
function letterize(el, rows) {
  el.innerHTML = '';
  let i = 0;
  for (const r of rows) {
    if (!r || !r.text) continue;
    const row = document.createElement('span');
    row.className = 'row' + (r.cls ? ' ' + r.cls : '');
    for (const ch of String(r.text)) {
      const w = document.createElement('span');
      w.className = 'w';
      w.textContent = ch;
      // the wind blows from the west: every letter drifts right and up, turning a little, a bit differently each
      const k = Math.random();
      w.style.setProperty('--i', String(i));
      w.style.setProperty('--dx', (60 + 90 * k + i * 0.6).toFixed(0) + 'px');
      w.style.setProperty('--dy', (-14 - 46 * Math.random()).toFixed(0) + 'px');
      w.style.setProperty('--r', (14 + 50 * Math.random() * (Math.random() < 0.5 ? -1 : 1)).toFixed(0) + 'deg');
      row.appendChild(w);
      i++;
    }
    el.appendChild(row);
  }
  return i;
}

export function createPaperUI() {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const made = [];

  /** A message slot: show(rows, hold) letters it in (and blows it away after `hold` s when hold > 0); gust() blows it now. */
  function slot(cls) {
    const el = div('hj-ui ' + cls);
    document.body.appendChild(el);
    made.push(el);
    let timer = 0; let out = 0; let count = 0; let shown = false;
    const clear = () => { clearTimeout(timer); clearTimeout(out); timer = out = 0; };
    return {
      el,
      get shown() { return shown; },
      show(rows, hold = 0) {
        clear();
        el.classList.remove('gust', 'in');
        count = letterize(el, rows);
        el.classList.add('on');
        void el.offsetWidth; // start the letters from their "before" state
        el.classList.add('in');
        shown = true;
        if (hold > 0) timer = setTimeout(() => this.gust(), hold * 1000);
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

  // ---- the 도감 button and the flying card --------------------------------------------------------------------------
  const btn = div('hj-ui hj-dexbtn');
  btn.innerHTML = '📖 도감<b>0</b>';
  document.body.appendChild(btn);
  made.push(btn);
  function setCount(n, total) { btn.querySelector('b').textContent = `${n} / ${total}`; }
  function bump() { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); }
  /** A little glowing card with `icon` flies from screen (x, y) into the 도감 button. */
  function flyToDex(x, y, icon) {
    const r = btn.getBoundingClientRect();
    const tx = r.left + r.width * 0.3; const ty = r.top + r.height * 0.5;
    const f = div('hj-fly');
    f.textContent = icon || '✨';
    document.body.appendChild(f);
    const mx = (x + tx) / 2 + (tx - x) * 0.1; const my = Math.min(y, ty) - 120; // a lifting arc, the way a scrap rides the wind
    const a = f.animate([
      { transform: `translate(${x}px, ${y}px) scale(0.4)`, opacity: 0 },
      { transform: `translate(${x}px, ${y - 30}px) scale(1.15)`, opacity: 1, offset: 0.18 },
      { transform: `translate(${mx}px, ${my}px) scale(1) rotate(-25deg)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${tx}px, ${ty}px) scale(0.45) rotate(10deg)`, opacity: 0.9 },
    ], { duration: 1150, easing: 'cubic-bezier(0.45, 0, 0.3, 1)' });
    a.onfinish = () => { f.remove(); bump(); };
  }

  // ---- the book ------------------------------------------------------------------------------------------------------
  const dex = div('hj-dex');
  dex.innerHTML = `<div class="book"><div class="head"><h2>📖 태백 도감</h2><span class="prog"></span><span class="x">닫기 ✕ (B)</span></div>
    <div class="tabs"></div><div class="list"></div><div class="detail"></div></div>`;
  document.body.appendChild(dex);
  made.push(dex);
  let book = null; // { tabs: [{ id, name, entries: [{ id, name, icon, short, detail, where, pic, known }] }], total, found }
  let tab = 0; let sel = null; let isOpen = false;
  const sheets = {}; // image src -> [w, h]
  function picStyle(el, pic, boxW, boxH) {
    if (!pic || !pic.src || !pic.rect || !sheets[pic.src]) { el.style.backgroundImage = 'none'; return; }
    const [x, y, w, h] = pic.rect; const [W, H] = sheets[pic.src];
    const s = Math.min(boxW / w, boxH / h);
    el.style.backgroundImage = `url("${pic.src}")`;
    el.style.backgroundSize = `${(W * s).toFixed(1)}px ${(H * s).toFixed(1)}px`;
    el.style.backgroundPosition = `${(-x * s + (boxW - w * s) / 2).toFixed(1)}px ${(-y * s + (boxH - h * s) / 2).toFixed(1)}px`;
  }
  function renderDetail() {
    const d = dex.querySelector('.detail');
    d.innerHTML = '';
    const e = sel;
    if (!e) { d.innerHTML = '<p class="where">왼쪽에서 하나를 골라 보세요.</p>'; return; }
    const pic = div('pic');
    d.appendChild(pic);
    const box = { w: Math.min(300, d.clientWidth * 0.7 || 300), h: window.innerWidth <= 720 ? 120 : 200 };
    pic.style.width = box.w + 'px'; pic.style.height = box.h + 'px';
    picStyle(pic, e.pic, box.w, box.h);
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
      b.onclick = () => { tab = i; sel = book.tabs[tab].entries.find((e) => e.known) || null; render(); };
      tabs.appendChild(b);
    });
    const list = dex.querySelector('.list');
    list.innerHTML = '';
    const t = book.tabs[tab];
    for (const e of t.entries) {
      const it = div('item' + (e.known ? '' : ' unknown') + (sel && sel.id === e.id ? ' sel' : ''));
      const pic = div('pic');
      picStyle(pic, e.pic, 40, 40);
      const name = document.createElement('span');
      name.textContent = e.known ? e.name : '???';
      it.append(pic, name);
      if (e.known) it.onclick = () => { sel = e; render(); };
      list.appendChild(it);
    }
    renderDetail();
  }
  function open(b) {
    book = b;
    if (!sel || !book.tabs[tab].entries.some((e) => e.id === sel.id && e.known)) sel = book.tabs[tab].entries.find((e) => e.known) || null;
    isOpen = true;
    dex.classList.add('open');
    render();
  }
  function close() { isOpen = false; dex.classList.remove('open'); }
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
