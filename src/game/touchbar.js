// 황지 페이퍼트레일: the touch toolbar. Phones and tablets have no keyboard, so the actions of Tab / N / M / V get round
// paper buttons in the top-right corner (inside the notch / status-bar safe area): 지도, 밤 / 낮, 음악, 시점. Only made
// where the main pointer is a finger (isTouchUI); a mouse-and-keyboard screen keeps its clean page.

const FONT = "'Jua', 'BM JUA_TTF', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

const CSS = `
.hj-tbar { position: fixed; z-index: 6; top: calc(10px + env(safe-area-inset-top, 0px)); right: calc(10px + env(safe-area-inset-right, 0px));
  display: flex; flex-direction: column; gap: 8px; pointer-events: none; font-family: ${FONT}; }
.hj-tbar button { pointer-events: auto; width: 52px; height: 52px; padding: 0; border: 0; border-radius: 50%; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
  background: rgba(34, 22, 12, 0.78); color: #fff6e6; font: inherit; -webkit-tap-highlight-color: transparent;
  box-shadow: 0 6px 16px rgba(10, 6, 2, 0.3), inset 0 0 0 1.5px rgba(255, 227, 154, 0.4); touch-action: manipulation;
  transition: transform 0.15s ease, background 0.2s ease; }
.hj-tbar button:active { transform: scale(0.9); background: rgba(60, 40, 20, 0.9); }
.hj-tbar .ic { font-size: 21px; line-height: 1; }
.hj-tbar .lb { font-size: 11px; line-height: 1; letter-spacing: 0.02em; color: #ffe7b0; }
@media (orientation: landscape) and (max-height: 520px) {
  .hj-tbar { flex-direction: row; }
  .hj-tbar button { width: 46px; height: 46px; }
}
`;

/** True where the main pointer is a finger (phones, tablets) - the screens that need buttons for the keys. */
export function isTouchUI() {
  if (typeof window === 'undefined' || typeof matchMedia !== 'function') return false;
  return matchMedia('(hover: none) and (pointer: coarse)').matches;
}

/**
 * items: [{ id, icon, label, tap() }]. Returns { el, set(id, icon, label), dispose() }.
 * Taps do not reach the page under the buttons (no walk target, no map close).
 */
export function createTouchBar({ items = [] } = {}) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const el = document.createElement('div');
  el.className = 'hj-tbar';
  const btns = {};
  for (const it of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', it.label);
    b.innerHTML = `<span class="ic"></span><span class="lb"></span>`;
    b.querySelector('.ic').textContent = it.icon;
    b.querySelector('.lb').textContent = it.label;
    // the action runs on pointerup (a tap), and the pointer never reaches the canvas or the map's page handlers
    const stop = (e) => { e.stopPropagation(); };
    b.addEventListener('pointerdown', stop);
    b.addEventListener('pointermove', stop);
    b.addEventListener('pointerup', (e) => { e.stopPropagation(); e.preventDefault(); it.tap(); });
    b.addEventListener('click', (e) => e.preventDefault());
    btns[it.id] = b;
    el.appendChild(b);
  }
  document.body.appendChild(el);
  return {
    el,
    /** Change a button's icon and label (e.g. 밤 -> 낮 once it is night). */
    set(id, icon, label) {
      const b = btns[id];
      if (!b) return;
      if (icon) b.querySelector('.ic').textContent = icon;
      if (label) { b.querySelector('.lb').textContent = label; b.setAttribute('aria-label', label); }
    },
    dispose() { el.remove(); style.remove(); },
  };
}
