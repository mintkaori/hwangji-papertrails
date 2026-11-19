// Ambient life + weather (owner: life agent). Read live every frame by src/life/life.js, so values can be
// tuned from the console through __atlas.config.life.
//
// `biomes` is the per-biome density table: 0 = none, 1 = the full pool of that kind (pool sizes in `counts`).
// Around a biome border the values cross-fade with core/biomes.js biomeWeights (per particle, so snow keeps to
// the snowy side of a border). Night / day factors are applied on top (see `night`).
export const life = {
  enabled: true,
  /** Wrap box (world units) around the traveller in which weather lives, and the spawn height of fallers. */
  box: { w: 19, d: 17, h: 4.6 },
  /** Prevailing wind direction on the page (x east, z south); kinds scale it with their own `wind` speed. */
  wind: [0.94, 0.34],

  biomes: {
    //            leaves dust  gusts snow  petals rain  mist  fireflies butterflies clouds birds
    // 황지: the hub is 황지동·상장동 in spring - drifting cherry petals and butterflies, no autumn leaves
    heartland: { leaves: 0.0, dust: 0.0, gusts: 0.0, snow: 0.0, petals: 0.55, rain: 0.0, mist: 0.0, fireflies: 0.25, butterflies: 0.9, clouds: 0.8, birds: 1.0 },
    // 황지: desert = 매봉산 summer (pollen in the wind, butterflies), pinewood = 철암 autumn (maple leaves, a little fog);
    // game/weather.js adds rain, snow storms, fog and wind on top of these values
    desert:    { leaves: 0.0, dust: 0.45, gusts: 0.8, snow: 0.0, petals: 0.0, rain: 0.0, mist: 0.0, fireflies: 0.5, butterflies: 0.8, clouds: 0.7, birds: 0.8 },
    snow:      { leaves: 0.0, dust: 0.0, gusts: 0.0, snow: 1.0, petals: 0.0, rain: 0.0, mist: 0.25, fireflies: 0.0, butterflies: 0.0, clouds: 0.6, birds: 0.5 },
    blossom:   { leaves: 0.0, dust: 0.0, gusts: 0.0, snow: 0.0, petals: 1.0, rain: 0.0, mist: 0.0, fireflies: 0.75, butterflies: 1.0, clouds: 0.7, birds: 1.0 },
    pinewood:  { leaves: 1.0, dust: 0.0, gusts: 0.0, snow: 0.0, petals: 0.0, rain: 0.0, mist: 0.35, fireflies: 0.15, butterflies: 0.1, clouds: 0.7, birds: 0.8 },
  },

  /** Pool sizes (instances). Everything lives in two draw calls, so these only cost a few triangles each. */
  counts: { leaves: 40, dust: 60, gusts: 14, snow: 460, petals: 110, rain: 700, butterflies: 18, flocks: 5, flockSize: 5, smokeEmitters: 10, smokePuffs: 4, mist: 9, clouds: 5, fireflies: 64 },

  // Fallers: size = world units, fall = units / s, sway = side-to-side amplitude, tumble = spin speed (rad / s),
  // land = seconds a piece rests on the page while it shrinks away, wind = drift speed along `wind`.
  leaves: { size: [0.13, 0.2], fall: [0.42, 0.7], sway: 0.35, tumble: 1.5, land: 9.0 /* animals round 3: a leaf rests on the page for a while (was 5) */, wind: 0.55, colors: ['#d9822b', '#c8552a', '#e0a83a', '#a8452a', '#b98a2e'] },
  snow: { size: [0.04, 0.07], fall: [0.5, 0.85], sway: 0.16, tumble: 0.9, land: 2.6, wind: 0.22, colors: ['#ffffff', '#fffaf2', '#fbf6ee'] },
  petals: { size: [0.085, 0.135], fall: [0.34, 0.6], sway: 0.4, tumble: 1.8, land: 4.5, wind: 0.45, colors: ['#f7b9c8', '#f29db4', '#fbd3dc', '#fff4f2'] },
  // thin, short, slanted streaks in the mist colour (fixer pass: the fat white bars read as poles stuck in the board)
  // 황지: thin, long, pale-blue water streaks (were grey paper strips) and a slightly wider splash ring
  rain: { size: [0.16, 0.3], width: 0.0062, fall: [6.8, 8.6], land: 0.26, wind: 1.7, splash: 0.085, colors: ['#e2eef4', '#cfe1ea', '#f2f8fb'] },
  // look pass: motes were hard white pom-poms near the lens: smaller, lower, and faded within ~5 units of the camera
  dust: { size: [0.022, 0.038], speed: [0.12, 0.3], height: [0.15, 1.5], colors: ['#f1dfb6', '#f6e9c9', '#e6cf9f'] },
  gusts: { length: [0.5, 0.95], width: 0.03, speed: 3.6, period: 9.5, height: [0.05, 0.3], colors: ['#f3e3ba', '#ead7a8'] },
  butterflies: { size: 0.13, roam: 1.1, height: [0.3, 0.75], flap: 11, flowers: 0.9 /* animals round 3: over a tile with flowers a butterfly flies whatever the biome density */, colors: ['#fff6e0', '#f6c64a', '#ef8a3c', '#9cc3e8', '#f3a6c0'] },
  // birds fly just above the treetops: higher up they leave the focal plane of the tilt-shift and blur away
  birds: {
    period: 30, cross: 15, span: 34, height: 2.1, wing: 0.2, flap: 6.5, shadow: 0.2, colors: ['#f6f1e6', '#e9e2d4'], spriteNames: [],
    // 황지: Taebaek birds in flight (art atlas fly_*, seen from above; the card creases on the body, so the wings
    // beat like the paper bird's). One species per crossing, drawn from the list of the season ring the traveller
    // stands in (null = the white paper bird). size = x the paper bird's span, flock = [min, max] birds,
    // flap = x the wing beat, seen = creature id for the 도감 (game/npcs.js) when the flock passes over.
    // artHeight: they fly lower than the paper birds (height), where the tilt-shift keeps the art sharp.
    artHeight: 1.2,
    species: {
      fly_jay: { size: 1.45, flock: [2, 4], flap: 0.85, seen: 'bird_jay' },
      fly_oriole: { size: 1.35, flock: [2, 3], flap: 1, seen: 'bird_oriole' },
      fly_mandarin: { size: 1.55, flock: [2, 5], flap: 1.5, seen: 'bird_mandarin' },
      fly_kingfisher: { size: 1.1, flock: [1, 1], flap: 2.1, seen: 'bird_kingfisher' },
    },
    rings: {
      heartland: ['fly_jay', 'fly_mandarin', 'fly_oriole', null],
      snow: ['fly_jay', null, null],
      blossom: ['fly_oriole', 'fly_kingfisher', 'fly_jay', null],
      desert: ['fly_oriole', 'fly_kingfisher', null],
      pinewood: ['fly_jay', 'fly_mandarin', 'fly_kingfisher'],
    },
  },
  smoke: {
    // animals round 3: round discs in a slow stack, warm paper white (was life 3.6, rise 0.95, size [0.12, 0.32], drift 0.35, cool white)
    life: 5.4, rise: 0.78, size: [0.085, 0.235], drift: 0.2, wobble: 0.045, spin: 0.5, night: 0 /* moonlit puffs read as dark blue dots, so chimneys rest at night */, color: ['#fff3dc', '#f8e8cb'],
    /** Chimney positions per tile model, tile-local at rot 0: [east, up, south]. `default` = any other tile tagged 'house'. */
    offsets: { /* animals round 3: house / village / village_b = chimney tops of the round 3 tiles (tiles LOG block) */ house: [[0.14, 0.89, -0.01]], village: [[-0.32, 0.79, -0.23]] /* fixer r3: cottage moved 0.18 north */, village_b: [[0.20, 0.82, -0.04]], desert_camp: [[0.0, 0.5, -0.06]], snow_cabin: [[0.15, 0.80, 0.11]], snow_hamlet: [[-0.39, 0.64, -0.39], [0.44, 0.59, 0.48]], /* integrator (gold pass): chimney tops of the rebuilt tiles (tiles LOG block) */ manor: [[0.14, 0.92, -0.03]], default: [[0.15, 0.8, -0.1]] },
  },
  mist: { size: [3.2, 4.6], height: 0.75, y: 0.46, alpha: 0.1, drift: 0.14 },
  clouds: { size: [8, 13], alpha: 0.15, speed: 0.34, span: 30, color: '#0b0a1c' },
  // look pass: small sparks (0.19 discs turned into hat-sized bokeh and competed with lanterns / windows)
  fireflies: { size: 0.12, roam: 0.55, water: 0.9 /* animals round 3: fireflies gather over ponds and river banks */, height: [0.22, 1.0], glow: 3.6, color: '#ffd45a', rainCut: 0.4 /* share of the fireflies the rain removes */ },

  /** Multipliers at full night (day = 1). */
  night: { butterflies: 0, clouds: 0, birds: 0.35, fireflies: 1, mist: 1.25 },
};
