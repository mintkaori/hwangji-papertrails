// FROZEN contract (owner: orchestrator): which BIOME a cell belongs to. Pure, deterministic, allocation-free
// lookups shared by the WFC (tile choice), the world, weather / ambient life and the grade.
//
// 황지 페이퍼트레일 - the year as wide rings: the start is the 황지동·상장동 neighbourhood in spring (heartland);
// around it the seasons run outward in wide, wobbly rings in the order of the year, so a straight walk in ANY
// direction slowly passes through a whole Taebaek year and starts over:
//   heartland  황지동·상장동 (the hub, radius SEASON_HUB)      봄     (petals, butterflies, spring rain)
//   desert     매봉산 바람의 언덕, 배추밭, 해바라기 축제          여름   (wind, showers, sea of clouds)
//   pinewood   철암 탄광촌, 단풍 군락, 구문소                   가을   (falling maple leaves, fog)
//   snow       태백산 눈꽃 능선, 천제단, 눈축제                  겨울   (snowfall, blizzards)
//   blossom    금대봉 야생화, 검룡소, 철쭉제                    봄     (petals, butterflies, spring rain)
// Each ring is SEASON_BAND tiles wide; the borders wobble by a few tiles and cross-fade (biomeWeights).

export const BIOMES = ['heartland', 'desert', 'snow', 'blossom', 'pinewood'];
export const BIOME_INDEX = { heartland: 0, desert: 1, snow: 2, blossom: 3, pinewood: 4 };
/** (legacy) grid pitch of the old Voronoi sites, in tiles. */
export const BIOME_SITE = 11;
/** Radius (tiles) of the 황지 hub and width (tiles) of one season ring. */
export const SEASON_HUB = 11;
export const SEASON_BAND = 16;
/** Biome index of ring k (k = 0 is the first ring outside the hub): summer, autumn, winter, spring, summer ... */
const RING = [1, 4, 2, 3];
/** Season of each biome (Korean, for the UI) and the place it stands for. */
export const SEASON_OF = { heartland: '봄', desert: '여름', snow: '겨울', blossom: '봄', pinewood: '가을' };
export const PLACE_OF = { heartland: '황지동·상장동 우리 동네', desert: '매봉산 바람의 언덕', snow: '태백산 눈꽃 능선', blossom: '금대봉 야생화 동산', pinewood: '철암 단풍 마을' };

function h2(seed, x, y, k) {
  let h = (Math.imul(x | 0, 0x9e3779b1) ^ Math.imul(y | 0, 0x85ebca6b) ^ Math.imul((seed | 0) + k * 0x632be5ab, 0xc2b2ae35)) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12; h = Math.imul(h, 0x297a2d39) >>> 0; h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

function siteBiome(seed, gx, gy) {
  if (gx === 0 && gy === 0) return 0;
  if (gy === 0 && gx === 1) return 1;
  if (gy === 0 && gx === -1) return 2;
  if (gx === 0 && gy === 1) return 3;
  if (gx === 0 && gy === -1) return 4;
  const r = h2(seed, gx, gy, 3);
  return r < 0.3 ? 0 : 1 + Math.min(3, Math.floor(((r - 0.3) / 0.7) * 4));
}

// smooth value noise for the domain warp
function vnoise(seed, x, y, k) {
  const xi = Math.floor(x); const yi = Math.floor(y);
  const fx = x - xi; const fy = y - yi;
  const ux = fx * fx * (3 - 2 * fx); const uy = fy * fy * (3 - 2 * fy);
  const a = h2(seed, xi, yi, k); const b = h2(seed, xi + 1, yi, k);
  const c = h2(seed, xi, yi + 1, k); const d = h2(seed, xi + 1, yi + 1, k);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

const _d = new Float64Array(BIOMES.length); // signed distance (tiles) to the nearest region of each biome (scratch)

/**
 * Fills _d with a SIGNED distance (tiles) from (x, z) to the nearest region of each biome: negative inside a region
 * (minus the depth to its nearest border), positive outside. x, z in TILE units (floats ok).
 */
function distances(seed, x, z) {
  const wx = x + (vnoise(seed, x / 5.5, z / 5.5, 11) - 0.5) * 3.2;
  const wz = z + (vnoise(seed, x / 5.5, z / 5.5, 12) - 0.5) * 3.2;
  // a slow radial wobble of +-3.5 tiles, so the rings read as hills and valleys, not circles
  const r = Math.max(0, Math.sqrt(wx * wx + wz * wz) + (vnoise(seed, wx / 13, wz / 13, 21) - 0.5) * 7);
  for (let i = 0; i < _d.length; i++) _d[i] = 1e9;
  _d[0] = r - SEASON_HUB; // the hub: [0, SEASON_HUB]
  const k0 = Math.floor((r - SEASON_HUB) / SEASON_BAND);
  for (let k = Math.max(0, k0 - 4); k <= k0 + 4; k++) {
    const a = SEASON_HUB + k * SEASON_BAND; const b = a + SEASON_BAND;
    const s = r < a ? a - r : r > b ? r - b : -Math.min(r - a, b - r);
    const bi = RING[k % RING.length];
    if (s < _d[bi]) _d[bi] = s;
  }
}

/** Biome index (into BIOMES) of the cell / tile-space point. */
export function biomeIndexAt(seed, cx, cz) {
  distances(seed, cx, cz);
  let best = 0;
  for (let i = 1; i < _d.length; i++) if (_d[i] < _d[best]) best = i;
  return best;
}

/** Biome id ('heartland' | 'desert' | ...) of cell (cx, cz). */
export function biomeAt(seed, cx, cz) { return BIOMES[biomeIndexAt(seed, cx, cz)]; }

/**
 * Biome + how deep inside it the point is.
 * @returns {{ id: string, index: number, edge: number }} edge = approx. distance (tiles) to the nearest other biome.
 *          The SAME object is returned on every call (copy the fields you keep).
 */
const _info = { id: 'heartland', index: 0, edge: 0 };
export function biomeInfo(seed, cx, cz) {
  distances(seed, cx, cz);
  let best = 0;
  for (let i = 1; i < _d.length; i++) if (_d[i] < _d[best]) best = i;
  let second = 1e9;
  for (let i = 0; i < _d.length; i++) if (i !== best && _d[i] < second) second = _d[i];
  _info.id = BIOMES[best]; _info.index = best; _info.edge = (second - _d[best]) / 2;
  return _info;
}

/**
 * Smooth blend weights (sum = 1) of every biome around a point, for weather / light / sound cross-fades.
 * @param {number} x tile-space X (world x / TILE_SIZE)  @param {number} z tile-space Z
 * @param {Float32Array|number[]} out length BIOMES.length  @param {number} [soft=1.6] blend half-width in tiles
 */
export function biomeWeights(seed, x, z, out, soft = 1.6) {
  distances(seed, x, z);
  let min = 1e9;
  for (let i = 0; i < _d.length; i++) if (_d[i] < min) min = _d[i];
  let sum = 0;
  for (let i = 0; i < _d.length; i++) { const w = Math.exp(-(_d[i] - min) / soft); out[i] = w; sum += w; }
  for (let i = 0; i < _d.length; i++) out[i] /= sum;
  return out;
}

/** Nearest cell (spiral from cx, cz) that lies at least `depth` tiles inside biome `id`. Returns {x, z} (cell) or null. */
export function findBiome(seed, id, cx = 0, cz = 0, depth = 3, maxR = 90) {
  const want = BIOME_INDEX[id];
  if (want === undefined) return null;
  for (let r = 0; r <= maxR; r++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const info = biomeInfo(seed, cx + dx, cz + dz);
        if (info.index === want && info.edge >= depth) return { x: cx + dx, z: cz + dz };
      }
    }
  }
  return null;
}
