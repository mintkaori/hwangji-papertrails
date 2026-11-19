// 황지 페이퍼트레일: wet paper. Rain soaks the page: every raindrop that lands leaves a dark round spot that dries
// away in a couple of seconds (life/life.js stamps them where its drops splash), and a long shower darkens the whole
// sheet a little, which then dries slowly once the rain has stopped. Wet paper is darker and a touch richer in colour.
// One small R8 texture, addressed as a torus in world space (no re-centring: a spot dries long before its texel is
// reused 24 units away), read by the page (world/book.js) and the tile batches (world/world.js).
import * as THREE from 'three';

/** GLSL: wetAt(world xz, up-facing 0..1) and wetPaper(colour, wetness). */
export const WET_GLSL = /* glsl */ `
uniform sampler2D uWetTex;
uniform vec4 uWet; // x: 1 / span of the torus (world units), y: soak of the whole sheet, z: drop-spot strength
float wetAt(vec2 p, float up) {
  float spot = texture2D(uWetTex, p * uWet.x).r;
  return clamp(uWet.y * 0.4 + spot * uWet.z * up, 0.0, 1.0);
}
vec3 wetPaper(vec3 c, float w) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(l), c, 1.0 + 0.3 * w) * (1.0 - 0.36 * w);
}
`;

export function createWet() {
  const N = 256; const SPAN = 24; // ~0.09 world units a texel: a drop is a spot of a few texels
  const data = new Uint8Array(N * N);
  const tex = new THREE.DataTexture(data, N, N, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter;
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  const uniforms = { uWetTex: { value: tex }, uWet: { value: new THREE.Vector4(1 / SPAN, 0, 1, 0) } };
  let soak = 0; let dirty = false; let acc = 0; let any = false;

  /** A drop landed at world (x, z): a soft wet spot (radius ~0.1-0.2 units). */
  function drop(x, z, strength = 1) {
    const u = (((x / SPAN) % 1) + 1) % 1 * N - 0.5; const v = (((z / SPAN) % 1) + 1) % 1 * N - 0.5;
    const i0 = Math.floor(u); const j0 = Math.floor(v);
    for (let dj = -1; dj <= 2; dj++) {
      for (let di = -1; di <= 2; di++) {
        const du = i0 + di - u; const dv = j0 + dj - v;
        const w = 1 - (du * du + dv * dv) / 1.7;
        if (w <= 0) continue;
        const k = (((j0 + dj) % N + N) % N) * N + (((i0 + di) % N + N) % N);
        const val = Math.min(255, Math.round(255 * w * strength));
        if (val > data[k]) data[k] = val;
      }
    }
    dirty = true; any = true;
  }

  /** rain 0..1 = rain density where the traveller is (life.js). */
  function update(dt, rain) {
    // the sheet soaks up quickly in rain and dries slowly afterwards
    const target = Math.min(1, Math.max(0, rain) * 1.3);
    soak += (target - soak) * (1 - Math.exp(-dt / (target > soak ? 4 : 30)));
    uniforms.uWet.value.y = soak;
    // the spots dry: ~2 s to half
    acc += dt;
    if (any && acc > 0.05) {
      const f = Math.exp(-acc / 2.4);
      let left = false;
      for (let k = 0; k < data.length; k++) { const d = data[k]; if (d) { const n = (d * f) | 0; data[k] = n; if (n) left = true; } }
      any = left; dirty = true; acc = 0;
    } else if (!any) acc = 0;
    if (dirty) { tex.needsUpdate = true; dirty = false; }
  }

  return {
    uniforms,
    drop,
    update,
    get soak() { return soak; },
    /** Chain wetAt / wetPaper into a material's fragment shader (uniforms + GLSL). */
    patch(shader) {
      shader.uniforms.uWetTex = uniforms.uWetTex;
      shader.uniforms.uWet = uniforms.uWet;
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + WET_GLSL);
    },
  };
}
