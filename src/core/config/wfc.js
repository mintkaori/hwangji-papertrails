// OWNER: wfc agent. Tunables for src/world/wfc.js + src/world/tiles.js.
// The generator is a chunked wave function collapse (see the header of src/world/wfc.js).
export const wfc = {
  // ---- legacy keys of the scaffold stub (kept so nothing that reads them breaks; unused by the real WFC)
  window: 3,
  pathDensity: 0.28,
  riverRowPeriod: 7,
  bridgeDensity: 0.3,

  /** Chunk edge in cells. FIXED at 8 in wfc.js (the hand-laid start around cell (0,0) assumes it). */
  chunk: 8,
  /** Local coordinates of world cell (0,0) inside its chunk, so the start is in a chunk interior. */
  originLocal: [3, 4],
  /** Chunks kept in memory before the oldest are evicted (regenerated identically on demand). 2048 chunks = 131k cells. */
  maxChunks: 2048,

  // ---- solver
  /** Full attempts (new plan + new collapse) per chunk before the stub fallback. The last `strictAttempts` forbid side lanes. */
  maxAttempts: 10,
  strictAttempts: 3,
  /** Backtracks allowed inside one attempt before it is abandoned and restarted. */
  maxBacktracks: 48,

  // ---- macro river field (labels on chunk corners; a border carries a river where its two corners differ)
  /** Mean distance between neighbouring rivers, in chunks, measured across the flow. */
  riverSpacing: 2.7,
  /** Max tilt (radians) of the general flow direction away from west-east; seeded. */
  riverTilt: 0.75,
  /** Low-frequency warp of the river lines: amplitude (chunks) and period (chunks). */
  riverWarp: 1.4,
  riverWarpPeriod: 4.5,
  /** In-chunk course: longest straight run (cells), cost noise (meander strength), cost of a bend. */
  riverMaxRun: 4,
  riverNoise: 3.0,
  riverTurnCost: 0.9,
  /** Brooks (spring -> short stream) in river-less chunks: chance per chunk, min end-to-end span, min length. */
  brookChance: 0.3,
  brookMinSpan: 5,
  brookMinLen: 6,

  // ---- macro road graph (every chunk owns one road to N or E => one connected network; extras add loops)
  roadExtra: 0.18,
  /** Chance that a road through a chunk (two crossings) detours via a waypoint (longer, windier roads). */
  roadDetour: 0.25,
  /** Chance that a chunk with four road crossings joins them in one crossroads (else T-junctions). */
  crossroads: 0.85,
  roadMaxRun: 4,
  roadNoise: 1.6,
  roadTurnCost: 1.8,
  /** Extra routing cost for a road stepping onto a river cell (a bridge). Low = roads like to cross. */
  bridgeCost: 0.6,
  /** Straight runs allowed by the validator: touching a chunk border / anywhere (cells). 4 + 4 <= 8 across a seam. */
  maxBorderRun: 4,
  maxInnerRun: 6,

  // ---- biome fields (value noise, period in cells)
  forestPeriod: 10.0,
  hillPeriod: 12.0,
  /** Hill field threshold (smoothstep lo / hi on the value noise). Composition pass: 0.42 / 0.6 -> 0.47 / 0.64 = clusters of 2-4 hill tiles instead of 6 x 7 blocks. */
  hillLo: 0.47,
  hillHi: 0.64,
  /** A landmark tile within this many cells (Chebyshev) of another landmark in the chunk is strongly discouraged (x0.12). */
  landmarkSpacing: 3,
  /** integrator (round 3): within startNear cells (Chebyshev) of the start cell, hamlet tiles (village family) weigh x startHamlet
   *  and ponds x startPond, so the first minutes show a hamlet and water. 0 / 1 switch it off. */
  startNear: 4,
  startHamlet: 3,
  startPond: 2,
  flowerPeriod: 5.0,
  settlePeriod: 9.0,

  // ---- side lanes: chance factor for a path socket that leaves the trunk road
  spurBase: 0.05,
  spurSettle: 0.5,
  /** Chance factor for a lane to run on one more cell instead of ending at a house (lanes are at most 3 cells). */
  laneOn: 0.45,

  /** Base weights per tile id (multiplied by biome / structure / adjacency factors in wfc.js). */
  weights: {
    meadow: 1.5, meadow_flowers: 0.85, hills: 1.15, forest: 1.1, grove: 1.0, rocks: 1.0, pond: 1.0, windmill: 1.0,
    path_straight: 3.0, path_corner: 4.0, path_t: 1.0, path_cross: 1.4, path_end: 1.8, lantern_post: 1.0,
    house: 4.0, village: 2.2, river_straight: 1.0, river_corner: 1.0, river_source: 1.0, bridge: 1.0,
    // biome pass tiles
    desert_dunes: 0.8, desert_dunes_b: 0.8, desert_dunes_c: 0.8, desert_cacti: 1.0, desert_camp: 3.0, desert_oasis: 1.3, desert_market: 2.2, desert_ruin: 1.7, snow_pines: 1.0, snow_drifts: 1.0, snow_cabin: 4.0, snow_hamlet: 2.2, frozen_pond: 1.0, blossom_orchard: 1.1, blossom_garden: 1.0, blossom_gazebo: 2.0, blossom_lane: 2.4, deep_pines: 1.1, mushroom_glade: 1.5, fallen_log: 1.0, watchtower: 2.8, church: 1.2, barn_farm: 0.6, market_square: 0.9, manor: 1.2,
    // round 3 (tiles): hamlet set. integrator (round 3): wfc.js treats village / village_b / village_green as one hamlet family
    // (settlement factor, clustering bonus, run of at most 3); the variants lean on a village or house next to them.
    village_b: 1.8, village_green: 1.4, river_reeds: 0.5,
    // 황지 페이퍼트레일 (world/kit.js). hj_* are pinned at the start only (ORIGIN_FIXED in world/wfc.js).
    hj_school: 1, hj_playground: 1, hj_pond: 1, hj_daiso: 1, hj_claw: 1, hj_library: 1,
    hj_pond_b: 1, hj_station: 1, hj_market: 1, hj_mural_a: 1, hj_mural_b: 1, hj_avenue: 1, hj_junction: 1,
    ch_kkachibal: 1.6, ch_coal: 1.3, ch_mine: 1.4, ch_gumunso: 1.2,
    mb_wind: 1.6, mb_cabbage: 1.8, mb_sunflower: 1.2, mb_samsu: 1.2,
    tb_cheonjedan: 1.3, tb_yew: 1.4, gd_geomnyong: 1.4, gd_flowers: 1.5, gd_azalea: 1.3,
    // round 2: legends / festivals sit on straight roads (path_straight weighs 3); the 단풍길 lane takes most autumn roads
    ch_maples: 1.6, lg_hwangbuja: 1, lg_geomnyong: 1, lg_gumunso: 1, lg_danjong: 1,
    fv_sunflower: 1.2, fv_snow: 1.2, fv_azalea: 1.1, fv_maple_gate: 1.0, fv_maple_lane: 2.4,
  },

  /**
   * Allowed rotations for all-grass tiles (socketed tiles always use the rotation their sockets need).
   * The assets agent built trees / windmill as slot-together crosses and put small stand-ups on the diagonals
   * (LOG, ASSETS-BLENDER AB5; A9 min silhouette ratio 0.77 for these tiles), so nothing is limited.
   * To pin a tile to the default camera again, list fewer rotations here, e.g. hills: [0].
   */
  rotations: {
    meadow: [0, 1, 2, 3], meadow_flowers: [0, 1, 2, 3], rocks: [0, 1, 2, 3], pond: [0, 1, 3] /* round 3: the boathouse stands on the north bank (never between camera and water) */,
    hills: [0], forest: [0, 1, 2, 3], grove: [0, 1, 2, 3], windmill: [0, 1, 2, 3],
    desert_dunes: [0, 2], desert_dunes_b: [0, 2], desert_dunes_c: [0, 2],
    // 황지 페이퍼트레일: the kit cards are flat elevations drawn for the default camera
    hj_school: [0], hj_playground: [0], hj_pond: [0], hj_daiso: [0], hj_claw: [0], hj_library: [0], hj_pond_b: [0], hj_station: [0], hj_market: [0], hj_mural_a: [0], hj_mural_b: [0], hj_avenue: [0], hj_junction: [0], ch_kkachibal: [0], ch_coal: [0], ch_mine: [0], ch_gumunso: [0], mb_wind: [0], mb_cabbage: [0], mb_sunflower: [0], mb_samsu: [0], tb_cheonjedan: [0], tb_yew: [0], gd_geomnyong: [0], gd_flowers: [0], gd_azalea: [0], ch_maples: [0],
    lg_hwangbuja: [0], lg_geomnyong: [0], lg_gumunso: [0], lg_danjong: [0], fv_sunflower: [0], fv_snow: [0], fv_azalea: [0], fv_maple_gate: [0], fv_maple_lane: [0], desert_cacti: [0, 1, 2, 3], desert_oasis: [0, 1, 2, 3], desert_ruin: [0, 2], snow_pines: [0, 1, 2, 3], snow_drifts: [0, 2], frozen_pond: [0], blossom_orchard: [0, 1, 2, 3], blossom_garden: [0, 1, 2, 3], deep_pines: [0, 1, 2, 3], mushroom_glade: [0, 1, 2, 3], fallen_log: [0, 1, 2, 3], barn_farm: [0, 1, 2, 3],
  },
};
