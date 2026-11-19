// 황지 페이퍼트레일: Taebaek weather. Every season ring keeps its own weather, which changes every minute or two and
// cross-fades. A weather scales / adds to the ambient-life densities (CONFIG.life.biomes, read live by life/life.js:
// rain, snowfall, mist, clouds, petals, leaves ...), the drift of the fallers (their `wind` speeds), the mist opacity
// and the sunlight (lights.setWeatherDim). Deterministic: the weather of a ring is a pure function of seed + time.
// game/npcs.js shows it in the corner badge, announces changes, and the mascots talk about it.
import { CONFIG, TILE_SIZE } from '../core/config.js';
import { BIOMES, biomeWeights } from '../core/biomes.js';
import { state } from '../core/state.js';

const KINDS = ['leaves', 'dust', 'gusts', 'snow', 'petals', 'rain', 'mist', 'fireflies', 'butterflies', 'clouds', 'birds'];

/** add = added density, mul = multiplied density (before add), wind = drift multiplier, dim = sun dimming, fog = mist opacity x. */
export const WEATHER = {
  clear: { name: '맑음', icon: '☀️', add: {}, mul: {}, wind: 1, dim: 0, fog: 1 },
  cloudy: { name: '구름 많음', icon: '⛅', add: { clouds: 1 }, mul: { butterflies: 0.6 }, wind: 1.2, dim: 0.14, fog: 1 },
  drizzle: { name: '보슬비', icon: '🌦️', add: { rain: 0.32, mist: 0.3, clouds: 1 }, mul: { butterflies: 0.2, petals: 0.6, dust: 0, fireflies: 0.5 }, wind: 1, dim: 0.22, fog: 1.1 },
  shower: { name: '소나기', icon: '🌧️', add: { rain: 0.95, mist: 0.25, clouds: 1 }, mul: { butterflies: 0, dust: 0, fireflies: 0.3, birds: 0.4 }, wind: 1.7, dim: 0.34, fog: 1.1 },
  fog: { name: '안개', icon: '🌫️', add: { mist: 1 }, mul: { butterflies: 0.4, dust: 0.3, birds: 0.5 }, wind: 0.5, dim: 0.16, fog: 1.9 },
  sea: { name: '운해', icon: '☁️', add: { mist: 1, clouds: 0.5 }, mul: { dust: 0.3 }, wind: 0.6, dim: 0.04, fog: 1.6 },
  windy: { name: '센 바람', icon: '💨', add: { gusts: 1, dust: 0.5 }, mul: { butterflies: 0.5 }, wind: 2.6, dim: 0.03, fog: 0.8 },
  snow: { name: '눈', icon: '🌨️', add: { snow: 0.5, clouds: 0.8 }, mul: {}, wind: 1, dim: 0.12, fog: 1 },
  heavysnow: { name: '함박눈', icon: '❄️', add: { snow: 1, clouds: 1 }, mul: {}, wind: 0.7, dim: 0.2, fog: 1.2 },
  blizzard: { name: '눈보라', icon: '🌬️', add: { snow: 1, mist: 0.7, gusts: 0.8, clouds: 1 }, mul: { birds: 0.2 }, wind: 3.4, dim: 0.32, fog: 1.6 },
  rime: { name: '상고대', icon: '✨', add: { mist: 0.45 }, mul: { snow: 0.12 }, wind: 0.4, dim: 0, fog: 1.2 },
  petals: { name: '꽃비', icon: '🌸', add: { petals: 1, butterflies: 0.5 }, mul: {}, wind: 1.7, dim: 0, fog: 1 },
  leaves: { name: '낙엽 바람', icon: '🍂', add: { leaves: 1 }, mul: {}, wind: 2.3, dim: 0.02, fog: 1 },
};

/** Weather of each season ring: [weather, weight]. heartland = the 황지동·상장동 hub (spring). */
export const CLIMATE = {
  heartland: [['clear', 4], ['petals', 2], ['cloudy', 1], ['drizzle', 2], ['shower', 1]], // 황지동·상장동 in spring
  snow: [['snow', 3], ['heavysnow', 2], ['blizzard', 1], ['rime', 2], ['clear', 1]],
  blossom: [['clear', 3], ['petals', 2], ['drizzle', 2], ['fog', 1]],
  desert: [['clear', 3], ['windy', 2], ['shower', 2], ['sea', 1], ['cloudy', 1]],
  pinewood: [['clear', 2], ['leaves', 3], ['fog', 2], ['drizzle', 1], ['cloudy', 1]],
};

const SEG = 80; // seconds of one weather
const FADE = 9; // cross-fade at the end of a segment

function hash(a, b, c) {
  let h = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul(b | 0, 0x85ebca6b) ^ Math.imul(c | 0, 0xc2b2ae35)) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

export function createWeather({ traveller, lights, seed = 0 }) {
  const L = CONFIG.life;
  // the authored values every weather starts from
  const base = {};
  for (const b of BIOMES) base[b] = { ...(L.biomes[b] || {}) };
  const winds = { snow: L.snow.wind, leaves: L.leaves.wind, petals: L.petals.wind, rain: L.rain.wind, gusts: L.gusts.speed };
  const mistAlpha = L.mist.alpha;
  const bw = new Float32Array(BIOMES.length);

  /** Weather id of biome b at time t (segment index from the clock, pick weighted by a hash of seed + biome + segment). */
  function pick(b, seg) {
    const list = CLIMATE[BIOMES[b]] || CLIMATE.heartland;
    let sum = 0;
    for (const [, w] of list) sum += w;
    let r = hash(seed + 977, b * 131 + 7, seg) * sum;
    for (const [id, w] of list) { r -= w; if (r <= 0) return id; }
    return list[0][0];
  }
  // a fresh walk starts in fair weather at the school
  const at = (b, t) => {
    const seg = Math.floor(t / SEG);
    const cur = seg === 0 && BIOMES[b] === 'heartland' ? 'clear' : pick(b, seg);
    const nxt = pick(b, seg + 1);
    const k = Math.min(1, Math.max(0, (t - seg * SEG - (SEG - FADE)) / FADE));
    return [cur, nxt, k * k * (3 - 2 * k)];
  };

  const now = { id: 'clear', name: WEATHER.clear.name, icon: WEATHER.clear.icon, biome: 'heartland', changed: 0 };
  let lastId = 'clear';

  function update() {
    const t = state.time || 0;
    // per ring: the blended weather writes the density table life.js reads this frame
    let wind = 0; let dim = 0; let fog = 0;
    const p = traveller.position;
    biomeWeights(seed, p.x / TILE_SIZE, p.z / TILE_SIZE, bw, 2.2);
    let main = 0;
    for (let b = 0; b < BIOMES.length; b++) {
      const [c, n, k] = at(b, t);
      const A = WEATHER[c]; const B = WEATHER[n];
      const src = base[BIOMES[b]]; const dst = L.biomes[BIOMES[b]];
      if (!src || !dst) continue;
      for (const kind of KINDS) {
        const v0 = src[kind] ?? 0;
        const a = Math.min(1, v0 * (A.mul[kind] ?? 1) + (A.add[kind] ?? 0));
        const bb = Math.min(1, v0 * (B.mul[kind] ?? 1) + (B.add[kind] ?? 0));
        dst[kind] = a + (bb - a) * k;
      }
      const wb = bw[b];
      wind += wb * (A.wind + (B.wind - A.wind) * k);
      dim += wb * (A.dim + (B.dim - A.dim) * k);
      fog += wb * (A.fog + (B.fog - A.fog) * k);
      if (bw[b] > bw[main]) main = b;
    }
    // the fallers drift with the local wind, the mist thickens in fog
    L.snow.wind = winds.snow * wind; L.leaves.wind = winds.leaves * wind; L.petals.wind = winds.petals * wind;
    L.rain.wind = winds.rain * Math.min(2, wind); L.gusts.speed = winds.gusts * Math.max(0.6, wind);
    L.mist.alpha = mistAlpha * fog;
    if (lights && lights.setWeatherDim) lights.setWeatherDim(dim);
    // what the traveller stands in (for the badge and the mascots)
    const [c, n, k] = at(main, t);
    const id = k > 0.5 ? n : c;
    now.biome = BIOMES[main];
    if (id !== lastId) { lastId = id; now.changed = t; }
    now.id = id; now.name = WEATHER[id].name; now.icon = WEATHER[id].icon;
  }

  return {
    update,
    /** The weather where the traveller is: { id, name, icon, biome, changed (state.time of the last change) }. */
    now: () => now,
  };
}
