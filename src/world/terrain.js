// 황지 페이퍼트레일: hills and slopes. The page is no longer flat everywhere: deterministic hills rise around landmark
// tiles (천제단 on its summit, 매봉산 바람의 언덕, 삼수령, 주목 군락 ...) and here and there in the outer season rings,
// so a road climbs over them and runs down the other side. Water stays level (a hill ends short of any water cell:
// rivers, ponds, bridges) and the 황지 neighbourhood around the start stays flat.
//
// One height field, every reader on the same numbers: a float texture over a window of cells around the traveller
// (rebuilt when he has walked a few cells; texels are fixed in the world and hills are a pure function of the seed and
// the solved cells, so nothing shifts when it is rebuilt) is sampled by the page shader (world/book.js), the tile
// batches and their shadow depth (world/world.js); heightAt() reads the same texels for the traveller, the animals,
// the scraps and the particles (through world.heightAt).
import * as THREE from 'three';
import { CONFIG, TILE_SIZE } from '../core/config.js';
import { MODELS } from '../core/models.js';
import { biomeAt } from '../core/biomes.js';

/** GLSL: terrainH(world xz) and its gradient. Bilinear over texelFetch, exactly like heightAt() below. */
export const TERRAIN_GLSL = /* glsl */ `
uniform sampler2D uTerrain;
uniform vec4 uTerrainP; // xy: world x / z of texel (0, 0); z: texels per world unit; w: texels across
float terrainH(vec2 p) {
  vec2 f = (p - uTerrainP.xy) * uTerrainP.z;
  float n = uTerrainP.w - 1.0;
  if (f.x <= 0.0 || f.y <= 0.0 || f.x >= n || f.y >= n) return 0.0;
  ivec2 i = ivec2(f);
  vec2 t = f - vec2(i);
  float a = texelFetch(uTerrain, i, 0).r;
  float b = texelFetch(uTerrain, i + ivec2(1, 0), 0).r;
  float c = texelFetch(uTerrain, i + ivec2(0, 1), 0).r;
  float d = texelFetch(uTerrain, i + ivec2(1, 1), 0).r;
  return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
}
vec2 terrainGrad(vec2 p) {
  const float e = 0.22;
  return vec2(terrainH(p + vec2(e, 0.0)) - terrainH(p - vec2(e, 0.0)), terrainH(p + vec2(0.0, e)) - terrainH(p - vec2(0.0, e))) / (2.0 * e);
}
`;

/** GLSL (vertex, after begin_vertex): lift a batched tile vertex onto the terrain (world-up offset in object space). */
export const TERRAIN_BATCH_VERTEX = /* glsl */ `
#ifdef USE_BATCHING
{
  mat4 tM = modelMatrix * batchingMatrix;
  vec3 tW = ( tM * vec4( transformed, 1.0 ) ).xyz;
  transformed.y += terrainH( tW.xz ) / max( 1e-4, length( tM[ 1 ].xyz ) );
}
#endif
`;

const DEFAULTS = {
  enabled: true,
  samples: 6, // texels per tile
  window: 40, // tiles across the height texture (centred on the traveller)
  shift: 3, // rebuild when the traveller is this many cells from the window centre
  flatRadius: 6.5, // tiles: no hill reaches inside this circle around the start (the 황지 neighbourhood)
  maxHeight: 1.3,
  radius: [1.8, 2.8], // tiles
  waterGap: 0.9, // tiles between a hill's foot and the centre of the nearest water cell
  /** biome -> [hill centres per cell, min height, max height] */
  biomes: { heartland: [0.025, 0.22, 0.4], desert: [0.075, 0.35, 0.65], pinewood: [0.05, 0.3, 0.55], snow: [0.085, 0.5, 0.85], blossom: [0.07, 0.4, 0.7] },
  /** landmark model -> [height, radius in tiles]: the place stands on top of its hill */
  landmarks: { tb_cheonjedan: [1.08, 3.0], mb_wind: [0.78, 2.7], mb_samsu: [0.62, 2.4], tb_yew: [0.55, 2.3], gd_flowers: [0.48, 2.2], gd_azalea: [0.5, 2.2], fv_snow: [0.35, 2.0] },
};

function hash(seed, x, z, k) {
  let h = (Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(z | 0, 0x165667b1) ^ Math.imul((seed | 0) + k * 0x9e3779b9, 0x85ebca77)) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12; h = Math.imul(h, 0x297a2d39) >>> 0; h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export function createTerrain({ wfc }) {
  const C = { ...DEFAULTS, ...((CONFIG.world && CONFIG.world.terrain) || {}) };
  const seed = wfc.seed | 0;
  const S = C.samples;
  const STEP = TILE_SIZE / S;
  const WIN = C.window;
  const NT = WIN * S + 1;
  const data = new Float32Array(NT * NT);
  const tex = new THREE.DataTexture(data, NT, NT, THREE.RedFormat, THREE.FloatType);
  tex.minFilter = THREE.NearestFilter; tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  const P = new THREE.Vector4(1e9, 1e9, 1 / STEP, NT);
  const uniforms = { uTerrain: { value: tex }, uTerrainP: { value: P } };
  let ccx = 1e9; let ccz = 1e9; let x0 = 1e9; let z0 = 1e9;
  const hills = new Map();
  let hillCount = 0;

  const isWater = (cx, cz) => {
    const c = wfc.get(cx, cz);
    const m = c && MODELS[c.model];
    return !!(m && m.tags && m.tags.includes('water'));
  };

  /** Hill centred on cell (cx, cz): { H, R (tiles) } or null. Pure function of the seed and the solved cells. */
  function hillAt(cx, cz) {
    const key = cx * 73856093 ^ cz * 19349663;
    const hit = hills.get(key);
    if (hit !== undefined && hit.cx === cx && hit.cz === cz) return hit.h;
    let h = null;
    const d0 = Math.hypot(cx, cz);
    if (C.enabled && d0 > C.flatRadius + C.radius[0] * 0.7) {
      const cell = wfc.get(cx, cz);
      const lm = cell && C.landmarks[cell.model];
      if (lm) h = { H: lm[0], R: lm[1] };
      else {
        const t = C.biomes[biomeAt(seed, cx, cz)];
        if (t && hash(seed, cx, cz, 1) < t[0]) {
          h = { H: t[1] + (t[2] - t[1]) * hash(seed, cx, cz, 2), R: C.radius[0] + (C.radius[1] - C.radius[0]) * hash(seed, cx, cz, 3) };
        }
      }
      if (h) {
        h.R = Math.min(h.R, d0 - C.flatRadius);
        const reach = Math.ceil(h.R + C.waterGap);
        let dw = 1e9;
        for (let dz = -reach; dz <= reach; dz++) {
          for (let dx = -reach; dx <= reach; dx++) {
            const d = Math.hypot(dx, dz);
            if (d >= dw || d > reach + 0.5) continue;
            if (isWater(cx + dx, cz + dz)) dw = d;
          }
        }
        h.R = Math.min(h.R, dw - C.waterGap);
        if (h.R < C.radius[0] * 0.7) h = null;
      }
    }
    if (hills.size > 60000) hills.clear();
    hills.set(key, { cx, cz, h });
    return h;
  }

  function rebuild(cx, cz) {
    ccx = cx; ccz = cz;
    const half = WIN / 2;
    x0 = (cx - half) * TILE_SIZE; z0 = (cz - half) * TILE_SIZE;
    data.fill(0);
    hillCount = 0;
    const reach = Math.ceil(C.radius[1] + 1);
    for (let gz = cz - half - reach; gz <= cz + half + reach; gz++) {
      for (let gx = cx - half - reach; gx <= cx + half + reach; gx++) {
        const h = hillAt(gx, gz);
        if (!h) continue;
        hillCount++;
        const hx = gx * TILE_SIZE; const hz = gz * TILE_SIZE; const rw = h.R * TILE_SIZE; const r2 = rw * rw;
        const i0 = Math.max(0, Math.ceil((hx - rw - x0) / STEP)); const i1 = Math.min(NT - 1, Math.floor((hx + rw - x0) / STEP));
        const j0 = Math.max(0, Math.ceil((hz - rw - z0) / STEP)); const j1 = Math.min(NT - 1, Math.floor((hz + rw - z0) / STEP));
        for (let j = j0; j <= j1; j++) {
          const dz = z0 + j * STEP - hz;
          for (let i = i0; i <= i1; i++) {
            const dx = x0 + i * STEP - hx;
            const q = 1 - (dx * dx + dz * dz) / r2;
            if (q > 0) data[j * NT + i] += h.H * q * q;
          }
        }
      }
    }
    // overlapping hills merge into a ridge, softly capped
    const k0 = C.maxHeight * 0.7; const k1 = C.maxHeight - k0;
    for (let k = 0; k < data.length; k++) { const e = data[k] - k0; if (e > 0) data[k] = k0 + e / (1 + e / k1); }
    P.set(x0, z0, 1 / STEP, NT);
    tex.needsUpdate = true;
  }

  /** Terrain height at world (x, z): bilinear over the same texels the shaders read. */
  function heightAt(x, z) {
    const fx = (x - x0) / STEP; const fz = (z - z0) / STEP;
    if (!(fx > 0 && fz > 0 && fx < NT - 1 && fz < NT - 1)) return 0;
    const i = fx | 0; const j = fz | 0;
    const tx = fx - i; const tz = fz - j; const k = j * NT + i;
    return (data[k] * (1 - tx) + data[k + 1] * tx) * (1 - tz) + (data[k + NT] * (1 - tx) + data[k + NT + 1] * tx) * tz;
  }

  if (C.enabled) rebuild(0, 0);

  return {
    enabled: !!C.enabled,
    uniforms,
    heightAt,
    /** Re-centre the window when the traveller has walked a few cells (call once per frame). */
    update(p) {
      if (!C.enabled) return;
      const cx = Math.round(p.x / TILE_SIZE); const cz = Math.round(p.z / TILE_SIZE);
      if (Math.abs(cx - ccx) >= C.shift || Math.abs(cz - ccz) >= C.shift) rebuild(cx, cz);
    },
    /** The hill on cell (cx, cz), if any: { H, R } (tiles). */
    hillAt,
    stats() { return { hills: hillCount, window: WIN, texels: NT, centre: [ccx, ccz] }; },
    /** Chain the terrain into a material's shader (uniforms + GLSL); `vertex` is code placed after begin_vertex. */
    patch(shader, vertex) {
      shader.uniforms.uTerrain = uniforms.uTerrain;
      shader.uniforms.uTerrainP = uniforms.uTerrainP;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\n' + TERRAIN_GLSL);
      if (vertex) shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + vertex);
    },
  };
}
