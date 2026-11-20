// WebGL renderer setup.
// The scene is rendered by post.js into an HDR multisampled target; tone mapping, grading and the sRGB
// encode happen in the final composite pass, so the renderer itself does no tone mapping and no canvas MSAA.
import * as THREE from 'three';
import { qualitySettings } from '../core/config.js';

export function createRenderer({ canvas, quality = 'high' }) {
  let q = qualitySettings(quality);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = q.shadows;
  // Basic = raw depth in a sampler2D. materials.js runs its own PCSS on it (blocker search +
  // receiver-plane depth bias + wide PCF); the stock filter is never used by paper materials.
  renderer.shadowMap.type = THREE.BasicShadowMap;

  let scale = 1; // render resolution factor below the quality's own pixel ratio (render/governor.js)
  const ratio = () => Math.max(0.5, Math.min(window.devicePixelRatio || 1, q.maxDpr) * scale);
  return {
    renderer,
    /** CSS-pixel size of the canvas; pixel ratio is clamped by the quality level (and the resolution scale). */
    setSize(width, height) {
      renderer.setPixelRatio(ratio());
      renderer.setSize(width, height, false);
    },
    setQuality(level) {
      q = qualitySettings(level);
      renderer.shadowMap.enabled = q.shadows;
      renderer.setPixelRatio(ratio());
    },
    /** Render at `s` x the quality's pixel ratio (1 = full); call setSize afterwards. */
    setScale(s) { scale = s > 0 ? s : 1; renderer.setPixelRatio(ratio()); },
    dispose() { renderer.dispose(); },
  };
}
