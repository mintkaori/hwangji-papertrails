// 황지 페이퍼트레일: keep the frame rate on modest GPUs (integrated graphics, older laptops, tablets).
//   * gpuTier(renderer): a starting quality from the GPU's name (WEBGL_debug_renderer_info) and the device: integrated
//     Intel HD / UHD and mobile GPUs start at 'low', Iris / Radeon APUs / Apple GPUs at 'med', the rest at 'high'.
//   * createGovernor(): watches the real frame time and walks a ladder - high -> med -> low -> low at 85 % and 70 %
//     render resolution - one rung down after ~2.5 s of slow frames (under ~45 fps), one rung back up after ~12 s of
//     fast ones (over ~57 fps). A rung that proved too slow right after climbing to it becomes the ceiling, so the
//     quality does not see-saw. The first seconds (loading, the opening fold, shader warm-up) are not judged, and
//     neither are frames after a hidden tab or a stall (> 250 ms).
// main.js applies a rung through renderer / post / lights / materials setQuality and the renderer's resolution scale;
// ?quality=low|med|high pins a level and turns the governor off.

export const LADDER = [
  { level: 'high', scale: 1 },
  { level: 'med', scale: 1 },
  { level: 'low', scale: 1 },
  { level: 'low', scale: 0.85 },
  { level: 'low', scale: 0.7 },
];

/** Starting quality for this device: 'low' | 'med' | 'high'. */
export function gpuTier(renderer) {
  let name = '';
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) || '').toLowerCase();
  } catch { name = ''; }
  const touch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 900;
  const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 8;
  const mem = (typeof navigator !== 'undefined' && navigator.deviceMemory) || 8;
  if (/swiftshader|llvmpipe|software|basic render|microsoft basic/.test(name)) return 'low';
  if (/mali|adreno|powervr|videocore|tegra/.test(name) || touch) return 'low';
  if (/nvidia|geforce|rtx|gtx|quadro|radeon (rx|pro)|radeon\(tm\) rx|intel\(r\) arc|intel arc/.test(name)) return cores <= 4 || mem <= 4 ? 'med' : 'high';
  if (/iris|radeon|vega|apple/.test(name)) return 'med';
  if (/intel|uhd|hd graphics/.test(name)) return 'low';
  return cores <= 4 || mem <= 4 ? 'med' : 'high';
}

/**
 * start: a quality level ('high' | 'med' | 'low'); apply(rung, index) is called when the governor changes rung.
 * Call tick() once per rendered frame.
 */
export function createGovernor({ start = 'high', apply, slowFps = 45, fastFps = 57, warmup = 6 }) {
  let i = Math.max(0, LADDER.findIndex((r) => r.level === start));
  let last = 0; let ema = 1000 / 60; let judged = -warmup; // seconds of judged time (negative: still warming up)
  let slow = 0; let fast = 0; let ceiling = 0; let climbedAt = -1e9; let clock = 0;
  const slowMs = 1000 / slowFps; const fastMs = 1000 / fastFps;
  function go(k, why) {
    if (k === i || k < 0 || k >= LADDER.length) return;
    const up = k < i;
    i = k; slow = 0; fast = 0; judged = -3; // let the new shaders compile before judging again
    if (up) climbedAt = clock;
    apply(LADDER[i], i, why);
  }
  return {
    tick(now = performance.now()) {
      const raw = last ? now - last : 16.7;
      last = now;
      if (raw > 250 || (typeof document !== 'undefined' && document.hidden)) { slow = 0; fast = 0; return; }
      const s = raw / 1000;
      clock += s;
      ema += (raw - ema) * 0.08;
      judged += s;
      if (judged < 0) return;
      if (ema > slowMs) { slow += s; fast = 0; } else if (ema < fastMs) { fast += s; slow = 0; } else { slow = Math.max(0, slow - s); fast = Math.max(0, fast - s); }
      if (slow > 2.5) {
        if (clock - climbedAt < 10) ceiling = Math.max(ceiling, i + 1); // the rung it just climbed to was too much
        go(i + 1, `${(1000 / ema).toFixed(0)} fps`);
      } else if (fast > 12 && i > ceiling) go(i - 1, `${(1000 / ema).toFixed(0)} fps`);
    },
    /** Jump to rung k now (debugging: __hj.governor.force(2)). */
    force(k) { go(Math.max(0, Math.min(LADDER.length - 1, k)), 'forced'); },
    get rung() { return LADDER[i]; },
    get index() { return i; },
    get fps() { return 1000 / ema; },
  };
}
