// Animation loop with a capped variable timestep.
// 황지 페이퍼트레일: setCap(fps) draws at most `fps` frames a second (a phone that cannot hold 60 gets a steady 30 instead
// of a stutter). A skipped vsync draws nothing, so the browser keeps showing the last frame - never a blank one.

export function createLoop({ update, render, maxDt = 1 / 20 }) {
  let raf = 0;
  let running = false;
  let last = 0;
  let time = 0;
  let frame = 0;
  let minGap = 0; // ms between drawn frames (0 = every vsync)

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (minGap > 0 && last && now - last < minGap - 4) return;
    const raw = last ? now - last : 1000 / 60;
    last = now;
    const dt = Math.min(raw / 1000, maxDt);
    time += dt;
    frame++;
    update(dt);
    render(dt);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    },
    stop() { running = false; cancelAnimationFrame(raf); },
    /** Draw at most `fps` frames per second (0 / null = every vsync). */
    setCap(fps) { minGap = fps > 0 ? 1000 / fps : 0; },
    get time() { return time; },
    get frame() { return frame; },
  };
}
