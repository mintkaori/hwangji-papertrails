// Taebaek card kit (황지 페이퍼트레일): tile models assembled at load time from the art atlas, for the model ids that
// have no Blender build in tiles.glb. Same contract as tiles.glb (docs/ARCHITECTURE.md, assets/loader.js):
//   * one group per model, named after it, with a 'base' mesh and hinged flaps (userData hinge / foldAngle / delay /
//     layer; the flap's hinge origin sits at y = FLAP_LAYER_GAP * (layer + 1)), rest pose = upright;
//   * cardstock geometry with COLOR_0 (white x contact AO on printed faces, so the print shows unmodified), uv1 into
//     the art atlas on printed faces and (-1, -1) elsewhere, all on the one shared paper material.
// The base and the small fillers (tufts, flowers, reeds ...) are borrowed from a DONOR tile of tiles.glb with the same
// sockets, so the printed ground matches the page. Cards are cut along the die-cut outlines that
// art-src/taebaek/compose_atlas.py stored in atlas.json. Piece names follow the world.js vocabulary on purpose:
//   tree_*  (scaled like trees, block), bush_* / flowers_* (face the camera, soft), sign_* / stone_a_* / cart_* /
//   bench_* (face the camera), *_front / *_side (rigid in the wind), mill (the rotor layer spins), fish_* / flag_* (sway).
import * as THREE from 'three';
import { FLAP_LAYER_GAP } from '../core/config.js';

const T = 0.016; // card thickness (CONFIG.assets.cardThickness)
const HALF = T / 2;
const Y0 = -0.012; // cards stand a hair into the page so no light leaks under them
const CORE = new THREE.Color('#FBF6EA'); // paper core (cut edges of facades)
const DEG = Math.PI / 180;

// ------------------------------------------------------------------------------------------------ recipes
// x, z = tile-local position of the card's hinge (tile spans -1..1; +z = south = toward the default camera).
// w = card width (world units; height from the sprite aspect unless h is given). walls = depth of the folding side walls.
// fold: 'back' (lies face-up behind its hinge, the default) or 'front' (lies face-down in front; for tall cards that
// would hang off the tile). ry = yaw in degrees.
const MEADOW_FILL = /^(tuft|flowers|bush)/;
export const KIT = {
  // ---- 황지 생활권 (pinned around the start; see ORIGIN_FIXED in world/wfc.js) ----------------------------------
  hj_school: { donor: 'meadow', keep: /^(tuft)/, cards: [
    { s: 'school_front', name: 'school_front', w: 1.96, hs: 1.2, x: 0, z: -0.3, walls: 0.34, fold: 'back' },
    { s: 'hj_gatepost', name: 'sign_gate_l', w: 0.17, x: -0.36, z: 0.66 },
    { s: 'hj_gatepost', name: 'sign_gate_r', w: 0.17, x: 0.36, z: 0.66 },
    { s: 'hj_juniper', name: 'tree_juniper', w: 0.66, x: -0.74, z: 0.42 },
    { s: 'hj_forsythia', name: 'bush_forsythia', w: 0.5, x: 0.72, z: 0.5 },
  ] },
  hj_playground: { donor: 'meadow', keep: /^(tuft)/, cards: [
    { s: 'hj_slide', name: 'slide_front', w: 0.6, x: -0.5, z: 0.32 },
    { s: 'bunting_0', name: 'bunting_flags', w: 0.9, x: 0.36, z: 0.74 },
    { s: 'hj_forsythia', name: 'bush_forsythia', w: 0.36, x: 0.78, z: 0.1 },
    { s: 'hj_forsythia', name: 'bush_forsythia_b', w: 0.34, x: -0.82, z: 0.8 },
  ] },
  hj_pond: { donor: 'pond', keep: /^(tuft|flowers|reeds|rock)/, cards: [
    { s: 'hj_statue', name: 'statue_daughter', w: 0.3, x: 0.62, z: -0.62 },
    { s: 'hj_stone', name: 'sign_stone', w: 0.36, x: -0.66, z: 0.62 },
    { s: 'hj_forsythia', name: 'bush_forsythia', w: 0.42, x: -0.74, z: -0.58 },
  ] },
  hj_daiso: { donor: 'meadow', keep: MEADOW_FILL, cards: [
    { s: 'daiso_front', name: 'daiso_front', w: 1.7, x: 0, z: -0.3, walls: 0.32, fold: 'back' },
    { s: 'bench_0', name: 'bench_a', w: 0.42, x: -0.5, z: 0.5 },
    { s: 'hj_forsythia', name: 'bush_forsythia', w: 0.42, x: 0.68, z: 0.52 },
  ] },
  hj_claw: { donor: 'meadow', keep: MEADOW_FILL, cards: [
    { s: 'claw_front', name: 'claw_front', w: 1.36, x: -0.12, z: -0.24, walls: 0.3, fold: 'back' },
    { s: 'hj_claw_machine', name: 'stall_claw', w: 0.26, x: 0.74, z: 0.18 },
    { s: 'gd_azalea', name: 'bush_azalea', w: 0.42, x: -0.66, z: 0.56 },
  ] },
  hj_library: { donor: 'meadow', keep: MEADOW_FILL, cards: [
    { s: 'library_front', name: 'library_front', w: 1.56, x: 0, z: -0.24, walls: 0.32, fold: 'back' },
    { s: 'hj_o2_mobile', name: 'flag_o2_mobile', w: 0.36, x: 0.74, z: 0.42 },
    { s: 'tb_magnolia', name: 'tree_magnolia', w: 0.6, x: -0.76, z: 0.44 },
  ] },
  // ---- 철암 탄광촌·구문소 (pinewood) -------------------------------------------------------------------------------
  ch_kkachibal: { donor: 'meadow', keep: /^(tuft|bush)/, cards: [
    { s: 'kkachibal_front', name: 'kkachibal_front', w: 0.74, x: -0.3, z: -0.62, fold: 'front' },
    { s: 'kkachibal_front', name: 'kkachibal_front_b', w: 0.62, x: 0.5, z: -0.2, fold: 'front' },
    { s: 'ch_cart', name: 'cart_coal', w: 0.36, x: -0.48, z: 0.62 },
    { s: 'ch_briquettes', name: 'pile_briquettes', w: 0.3, x: 0.62, z: 0.66 },
  ] },
  ch_coal: { donor: 'rocks', keep: /^(tuft|pebble)/, cards: [
    { s: 'coal_plant', name: 'coal_front', w: 1.62, x: 0, z: -0.62, fold: 'front' },
    { s: 'ch_briquettes', name: 'pile_briquettes', w: 0.32, x: -0.7, z: 0.66 },
    { s: 'ch_cart', name: 'cart_coal', w: 0.36, x: 0.6, z: 0.66 },
  ] },
  ch_mine: { donor: 'rocks', keep: /^(tuft|pebble)/, cards: [
    { s: 'mine_entrance', name: 'mine_front', w: 1.5, x: 0, z: -0.56, fold: 'front' },
    { s: 'ch_cart', name: 'cart_coal', w: 0.38, x: 0.56, z: 0.62 },
    { s: 'ch_briquettes', name: 'pile_briquettes', w: 0.28, x: -0.62, z: 0.6 },
  ] },
  ch_gumunso: { donor: 'meadow', keep: /^(tuft|bush|flowers)/, cards: [
    { s: 'gumunso', name: 'arch_gumunso', w: 1.72, x: 0, z: -0.58, fold: 'front' },
    { s: 'an_trilobite', name: 'stone_a_fossil', w: 0.3, x: 0.64, z: 0.62 },
    { s: 'an_lenok', name: 'fish_lenok', w: 0.34, x: -0.56, z: 0.58 },
  ] },
  // ---- 매봉산 바람의 언덕·삼수령 (desert) ---------------------------------------------------------------------------
  mb_wind: { donor: 'meadow', keep: /^(tuft)/, cards: [
    { turbine: true, x: -0.48, z: -0.5, h: 1.32 },
    { turbine: true, x: 0.5, z: -0.06, h: 1.16 },
    { s: 'mb_cabbage', name: 'flowers_cabbage', w: 0.8, x: -0.3, z: 0.62 },
    { s: 'mb_cabbage', name: 'flowers_cabbage_b', w: 0.7, x: 0.42, z: 0.7 },
  ] },
  mb_cabbage: { donor: 'meadow', keep: /^(tuft)/, cards: [
    { s: 'mb_cabbage', name: 'flowers_cabbage_a', w: 1.2, x: -0.2, z: -0.66 },
    { s: 'mb_cabbage', name: 'flowers_cabbage_b', w: 1.2, x: 0.25, z: -0.2 },
    { s: 'mb_cabbage', name: 'flowers_cabbage_c', w: 1.2, x: -0.15, z: 0.26 },
    { s: 'mb_cabbage', name: 'flowers_cabbage_d', w: 1.1, x: 0.3, z: 0.7 },
    { turbine: true, x: -0.78, z: 0.02, h: 1.0 },
  ] },
  mb_sunflower: { donor: 'meadow', keep: /^(tuft)/, cards: [
    { s: 'mb_sunflower', name: 'flowers_sun_a', w: 0.62, x: -0.5, z: -0.5 },
    { s: 'mb_sunflower', name: 'flowers_sun_b', w: 0.62, x: 0.42, z: -0.36 },
    { s: 'mb_sunflower', name: 'flowers_sun_c', w: 0.6, x: -0.2, z: 0.24 },
    { s: 'mb_sunflower', name: 'flowers_sun_d', w: 0.56, x: 0.62, z: 0.56 },
    { s: 'mb_cabbage', name: 'flowers_cabbage', w: 0.7, x: -0.6, z: 0.72 },
  ] },
  mb_samsu: { donor: 'meadow', keep: /^(tuft|flowers)/, cards: [
    { s: 'mb_samsu', name: 'statue_samsu', w: 0.72, x: 0, z: -0.3 },
    { s: 'mb_sunflower', name: 'flowers_sun', w: 0.5, x: 0.66, z: 0.56 },
    { turbine: true, x: -0.72, z: 0.3, h: 1.0 },
  ] },
  // ---- 태백산 눈꽃 능선 (snow) ------------------------------------------------------------------------------------
  tb_cheonjedan: { donor: 'meadow', keep: /^(tuft)/, cards: [
    { s: 'cheonjedan', name: 'stone_altar', w: 1.5, x: 0, z: -0.2 },
    { s: 'tb_yew_rime', name: 'tree_yew_rime', w: 0.78, x: -0.66, z: -0.66 },
    { s: 'tb_fir', name: 'tree_fir', w: 0.5, x: 0.72, z: -0.62 },
    { s: 'tb_yew_rime', name: 'tree_yew_rime_b', w: 0.6, x: 0.7, z: 0.6 },
  ] },
  tb_yew: { donor: 'meadow', keep: /^(tuft)/, cards: [
    { s: 'tb_yew', name: 'tree_yew', w: 0.86, x: -0.42, z: -0.56 },
    { s: 'tb_fir', name: 'tree_fir', w: 0.5, x: 0.52, z: -0.66 },
    { s: 'tb_yew_rime', name: 'tree_yew_rime', w: 0.76, x: 0.36, z: 0.06 },
    { s: 'tb_birch', name: 'tree_birch_sasrae', w: 0.62, x: -0.62, z: 0.36 },
    { s: 'an_goral', name: 'goat_goral', w: 0.4, x: 0.22, z: 0.7 },
  ] },
  // ---- 금대봉 야생화·검룡소 (blossom) ------------------------------------------------------------------------------
  gd_geomnyong: { donor: 'meadow', keep: /^(tuft|flowers)/, cards: [
    { s: 'geomnyongso', name: 'spring_front', w: 1.52, x: 0, z: -0.6, fold: 'front' },
    { s: 'gd_iris', name: 'flowers_iris', w: 0.44, x: -0.66, z: 0.62 },
    { s: 'gd_wildflowers', name: 'flowers_wild', w: 0.5, x: 0.6, z: 0.66 },
  ] },
  gd_flowers: { donor: 'meadow', keep: /^(tuft)/, cards: [
    { s: 'gd_wildflowers', name: 'flowers_wild_a', w: 0.62, x: -0.5, z: -0.56 },
    { s: 'gd_iris', name: 'flowers_iris_a', w: 0.5, x: 0.46, z: -0.5 },
    { s: 'gd_azalea', name: 'bush_azalea', w: 0.56, x: -0.1, z: 0.04 },
    { s: 'gd_wildflowers', name: 'flowers_wild_b', w: 0.56, x: 0.56, z: 0.46 },
    { s: 'gd_iris', name: 'flowers_iris_b', w: 0.44, x: -0.6, z: 0.62 },
  ] },
  gd_azalea: { donor: 'meadow', keep: /^(tuft|flowers)/, cards: [
    { s: 'tb_magnolia', name: 'tree_magnolia', w: 0.72, x: -0.46, z: -0.56 },
    { s: 'tb_oak', name: 'tree_oak', w: 0.8, x: 0.5, z: -0.5 },
    { s: 'gd_azalea', name: 'bush_azalea_a', w: 0.52, x: -0.58, z: 0.4 },
    { s: 'gd_azalea', name: 'bush_azalea_b', w: 0.5, x: 0.4, z: 0.56 },
  ] },
  ch_maples: { donor: 'meadow', keep: /^(tuft)/, cards: [
    { s: 'fv_maple_red', name: 'tree_maple_red', w: 0.86, x: -0.46, z: -0.56 },
    { s: 'fv_ginkgo', name: 'tree_ginkgo', w: 0.7, x: 0.5, z: -0.62 },
    { s: 'fv_maple_orange', name: 'tree_maple_orange', w: 0.8, x: 0.42, z: 0.1 },
    { s: 'tb_oak', name: 'tree_oak', w: 0.74, x: -0.56, z: 0.32 },
    { s: 'ch_briquettes', name: 'pile_briquettes', w: 0.26, x: 0.1, z: 0.76 },
  ] },
  // ---- round 2: legend trails (N-S road; story cards zig-zag beside it, oldest scene at the south end) -------------
  lg_hwangbuja: story('hb'),
  lg_geomnyong: story('gr'),
  lg_gumunso: story('gm'),
  lg_danjong: story('dj'),
  // ---- festivals on a N-S road: a gate over the road, the festival around it ---------------------------------------
  fv_sunflower: { donor: 'path_straight', keep: /^(tuft)/, cards: [
    { s: 'fv_arch_sunflower', name: 'gate_sunflower', w: 1.02, x: 0, z: 0.12 },
    { s: 'mb_sunflower', name: 'flowers_sun_a', w: 0.56, x: -0.62, z: -0.58 },
    { s: 'mb_sunflower', name: 'flowers_sun_b', w: 0.56, x: 0.62, z: -0.5 },
    { s: 'mb_sunflower', name: 'flowers_sun_c', w: 0.52, x: -0.66, z: 0.6 },
    { s: 'mb_sunflower', name: 'flowers_sun_d', w: 0.52, x: 0.66, z: 0.66 },
    { turbine: true, x: -0.76, z: -0.05, h: 1.0 },
  ] },
  fv_snow: { donor: 'path_straight', keep: /^(tuft)/, cards: [
    { s: 'fv_arch_snowfest', name: 'gate_snowfest', w: 1.06, x: 0, z: 0.1 },
    { s: 'fv_snow_dragon', name: 'statue_snow_dragon', w: 0.6, x: -0.62, z: -0.52 },
    { s: 'fv_snow_castle', name: 'statue_snow_castle', w: 0.58, x: 0.62, z: -0.5 },
    { s: 'fv_snowman', name: 'snowman_big', w: 0.34, x: 0.68, z: 0.6 },
    { s: 'tb_yew_rime', name: 'tree_yew_rime', w: 0.5, x: -0.7, z: 0.62 },
  ] },
  fv_azalea: { donor: 'path_straight', keep: /^(tuft|flowers)/, cards: [
    { s: 'fv_arch_azalea', name: 'gate_azalea', w: 1.0, x: 0, z: 0.12 },
    { s: 'gd_azalea', name: 'bush_azalea_a', w: 0.52, x: -0.62, z: -0.5 },
    { s: 'gd_azalea', name: 'bush_azalea_b', w: 0.5, x: 0.62, z: -0.56 },
    { s: 'gd_azalea', name: 'bush_azalea_c', w: 0.46, x: 0.66, z: 0.62 },
    { s: 'tb_magnolia', name: 'tree_magnolia', w: 0.56, x: -0.68, z: 0.56 },
  ] },
  fv_maple_gate: { donor: 'path_straight', keep: /^(tuft)/, cards: [
    { s: 'fv_arch_maple', name: 'gate_maple', w: 1.0, x: 0, z: 0.12 },
    { s: 'fv_maple_red', name: 'tree_maple_red', w: 0.7, x: -0.64, z: -0.56 },
    { s: 'fv_maple_orange', name: 'tree_maple_orange', w: 0.66, x: 0.64, z: -0.5 },
    { s: 'fv_ginkgo', name: 'tree_ginkgo', w: 0.5, x: 0.7, z: 0.62 },
  ] },
  // 단풍길: a straight lane between rows of maples and ginkgos; two or three in a row read as one long avenue
  fv_maple_lane: { donor: 'path_straight', keep: /^(tuft)/, cards: [
    { s: 'fv_maple_red', name: 'tree_maple_red', w: 0.66, x: -0.62, z: -0.62 },
    { s: 'fv_ginkgo', name: 'tree_ginkgo', w: 0.56, x: 0.62, z: -0.58 },
    { s: 'fv_maple_orange', name: 'tree_maple_orange', w: 0.64, x: -0.62, z: 0.12 },
    { s: 'fv_maple_red', name: 'tree_maple_red_b', w: 0.62, x: 0.62, z: 0.16 },
    { s: 'fv_ginkgo', name: 'tree_ginkgo_b', w: 0.5, x: -0.66, z: 0.76 },
    { s: 'fv_maple_orange', name: 'tree_maple_orange_b', w: 0.56, x: 0.66, z: 0.8 },
  ] },
};

/** A legend trail: four story cards beside a north-south road, scene 1 at the south end (where a walker coming up the
 *  page meets it first). The names start with sign_ so the cards turn to the camera (world.js CARD_RX). */
function story(key) {
  return { donor: 'path_straight', keep: /^(tuft|flowers)/, story: key, cards: [
    { s: `lg_${key}_1`, name: 'sign_story_1', w: 0.6, x: -0.62, z: 0.62 },
    { s: `lg_${key}_2`, name: 'sign_story_2', w: 0.6, x: 0.62, z: 0.2 },
    { s: `lg_${key}_3`, name: 'sign_story_3', w: 0.6, x: -0.62, z: -0.22 },
    { s: `lg_${key}_4`, name: 'sign_story_4', w: 0.62, x: 0.62, z: -0.62 },
  ] };
}
export const KIT_IDS = Object.keys(KIT);

// ------------------------------------------------------------------------------------------------ geometry
const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (t) => Math.min(1, Math.max(0, t));

function polysOf(sp) {
  const o = sp && sp.outline;
  if (!o || !o.length) return [[[0, 0], [1, 0], [1, 1], [0, 1]]];
  return typeof o[0][0] === 'number' ? [o] : o;
}

/** Growing vertex buffers (position, normal, color rgba, uv, uv1) + index list. */
function buffers() { return { p: [], n: [], c: [], u: [], u1: [], i: [] }; }
function vert(B, x, y, z, nx, ny, nz, col, u1x, u1y) {
  B.p.push(x, y, z); B.n.push(nx, ny, nz); B.c.push(col[0], col[1], col[2], 1); B.u.push(x, y); B.u1.push(u1x, u1y);
  return B.p.length / 3 - 1;
}
function toGeometry(B) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 4));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(B.u, 2));
  g.setAttribute('uv1', new THREE.Float32BufferAttribute(B.u1, 2));
  g.setIndex(B.i);
  g.computeBoundingBox(); g.computeBoundingSphere();
  return g;
}

/**
 * A die-cut card in its local frame: the card plane is XY (bottom edge on the hinge axis X, y up), thickness along Z.
 * opts: w, h, front: 'art' | colour, back: 'art' | colour, edge: colour, z0 (plane offset), quad (cut a plain rect).
 */
function addCard(B, sp, atlasSize, opts) {
  const [AW, AH] = atlasSize;
  const { w, h, z0 = 0 } = opts;
  const yUp = opts.outline ? false : !sp || !sp.kit; // the original atlas outlines run bottom-up, the kit ones (and opts.outline) top-down
  const rect = sp ? sp.rect : [0, 0, 1, 1];
  const polys = opts.outline ? [opts.outline] : opts.quad || !sp ? [[[0, 0], [1, 0], [1, 1], [0, 1]]] : polysOf(sp);
  const aoH = Math.max(0.05, Math.min(0.22, h * 0.35));
  const ao = (y) => 0.8 + 0.18 * smooth(clamp01((y - Y0) / aoH));
  const white = [1, 1, 1];
  const colFace = (spec, y) => (spec === 'art' ? white.map((v) => v * ao(y)) : spec);
  for (const poly of polys) {
    const pts = []; const uvs = [];
    for (const [u, v] of poly) {
      const yy = yUp ? v : 1 - v;
      const x = (u - 0.5) * w; const y = yy * h + Y0;
      const last = pts[pts.length - 1];
      if (last && Math.abs(last.x - x) < 1e-5 && Math.abs(last.y - y) < 1e-5) continue;
      pts.push(new THREE.Vector2(x, y));
      uvs.push([(rect[0] + u * rect[2]) / AW, (rect[1] + (1 - yy) * rect[3]) / AH]);
    }
    if (pts.length > 2 && pts[0].distanceTo(pts[pts.length - 1]) < 1e-5) { pts.pop(); uvs.pop(); }
    if (pts.length < 3) continue;
    if (THREE.ShapeUtils.isClockWise(pts)) { pts.reverse(); uvs.reverse(); }
    const tris = THREE.ShapeUtils.triangulateShape(pts, []);
    // front (+Z) and back (-Z) faces; triangles forced counter-clockwise seen from their own side
    for (const side of [1, -1]) {
      const spec = side > 0 ? opts.front : opts.back;
      const base = B.p.length / 3;
      pts.forEach((p, k) => {
        const art = spec === 'art';
        vert(B, p.x, p.y, z0 + side * HALF, 0, 0, side, colFace(spec, p.y), art ? uvs[k][0] : -1, art ? uvs[k][1] : -1);
      });
      for (const [a, b, c] of tris) {
        const pa = pts[a]; const pb = pts[b]; const pc = pts[c];
        const area = (pb.x - pa.x) * (pc.y - pa.y) - (pc.x - pa.x) * (pb.y - pa.y);
        const ccw = (area > 0) === (side > 0);
        if (ccw) B.i.push(base + a, base + b, base + c); else B.i.push(base + a, base + c, base + b);
      }
    }
    // cut edges (side walls of the card)
    for (let k = 0; k < pts.length; k++) {
      const p = pts[k]; const q = pts[(k + 1) % pts.length];
      const dx = q.x - p.x; const dy = q.y - p.y; const L = Math.hypot(dx, dy);
      if (L < 1e-6) continue;
      const nx = dy / L; const ny = -dx / L;
      const e = opts.edge;
      const a = vert(B, p.x, p.y, z0 + HALF, nx, ny, 0, e, -1, -1);
      const b = vert(B, q.x, q.y, z0 + HALF, nx, ny, 0, e, -1, -1);
      const c = vert(B, q.x, q.y, z0 - HALF, nx, ny, 0, e, -1, -1);
      const d = vert(B, p.x, p.y, z0 - HALF, nx, ny, 0, e, -1, -1);
      B.i.push(a, d, c, a, c, b);
    }
  }
}

function linear(hex, mul = 1) {
  const c = new THREE.Color(hex || '#c8b496');
  return [c.r * mul, c.g * mul, c.b * mul];
}

// ------------------------------------------------------------------------------------------------ assembly
function hingeData(fold, delay, layer) {
  return { hinge: true, foldAngle: fold, delay: Math.min(1, Math.max(0, delay)), layer };
}

/**
 * Build every KIT model whose donor exists. ctx: { atlas (atlas.json), paper (shared material), donor(id) -> prototype }.
 * Returns Map(modelId -> THREE.Group).
 */
export function buildKitTiles({ atlas, paper, donor }) {
  const out = new Map();
  if (!atlas || !atlas.sprites || !atlas.size) return out;
  const S = atlas.sprites; const size = atlas.size;
  for (const id of KIT_IDS) {
    try {
      const r = KIT[id];
      const d = donor(r.donor);
      if (!d) continue;
      const g = new THREE.Group();
      g.name = id;
      g.userData.model = id;
      let top = -1;
      for (const c of d.children) {
        const nm = String(c.name || '');
        if (nm === 'base' || (r.keep && r.keep.test(nm))) {
          const k = c.clone(true);
          g.add(k);
          if (k.userData && k.userData.hinge) top = Math.max(top, k.userData.layer | 0);
        }
      }
      let layer = top + 1;
      const cards = r.cards.filter((cd) => cd.turbine || (S[cd.s] && cd.w > 0));
      // the back row rises first, the front row last (the tile "opens" toward the reader)
      const order = cards.map((cd, i) => [cd, i]).sort((a, b) => a[0].z - b[0].z);
      order.forEach(([cd], k) => {
        const delay = order.length > 1 ? 0.1 + 0.85 * (k / (order.length - 1)) : 0.5;
        const node = cd.turbine ? turbine(cd, S, size, paper) : card(cd, S[cd.s], size, paper);
        if (!node) return;
        const L = layer++;
        node.position.set(cd.x, FLAP_LAYER_GAP * (L + 1), cd.z);
        node.rotation.y = (cd.ry || 0) * DEG;
        node.userData = hingeData(node.userData.fold, delay, L);
        node.traverse((o) => { if (o !== node && o.userData && o.userData.hinge) { o.userData.delay = node.userData.delay; o.userData.layer = L; } });
        g.add(node);
      });
      g.updateMatrixWorld(true);
      out.set(id, g);
    } catch (err) {
      console.warn('[kit]', id, 'failed:', err && err.message);
    }
  }
  return out;
}

function meshOf(name, geo, paper) {
  const m = new THREE.Mesh(geo, paper);
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** One card (+ folding side walls for shop fronts). The returned mesh is the hinge; userData.fold = its fold angle. */
function card(cd, sp, size, paper) {
  const w = cd.w;
  const h = cd.h || (w / (sp.aspect || sp.rect[2] / sp.rect[3])) * (cd.hs || 1);
  const facade = !!cd.walls;
  const tone = linear(sp.tone);
  const B = buffers();
  addCard(B, sp, size, {
    w, h,
    front: 'art',
    back: facade ? tone.map((v) => v * 0.78) : 'art',
    edge: facade ? [CORE.r * 0.88, CORE.g * 0.86, CORE.b * 0.8] : tone.map((v) => v * 0.42),
  });
  const m = meshOf(cd.name, toGeometry(B), paper);
  // lie face-up behind the hinge unless that would hang off the tile: then face-down in front of it
  const back = cd.fold ? cd.fold !== 'front' : cd.z - h >= -0.98;
  m.userData.fold = (back ? -1 : 1) * (Math.PI / 2) * (1 + ((cd.x * 7.31 + cd.z * 3.7) % 1) * 0.012);
  if (facade) {
    // side walls hang off the facade (nested flaps): hinge on the vertical seam, they swing flat INWARD behind the facade
    const wh = Math.min(h * 0.62, h - 0.02);
    const inset = w * 0.045;
    const D = cd.walls;
    for (const side of [-1, 1]) {
      const W = buffers();
      addCard(W, null, size, { w: wh, h: D, front: tone.map((v) => v * 0.9), back: tone.map((v) => v * 0.72), edge: tone.map((v) => v * 0.5) });
      // the wall's own frame: local X (its hinge) = world up, local Y = backward (-Z), local Z = -X
      const wall = meshOf(cd.name.replace(/_front$/, '') + (side < 0 ? '_side_l' : '_side_r'), toGeometry(W), paper);
      wall.geometry.translate(wh / 2, -Y0, 0); // card spans x 0..wh along the hinge, y 0..D away from it
      wall.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0)));
      wall.position.set(side * (w / 2 - inset), 0, -HALF - HALF - 0.003);
      wall.userData = hingeData(side < 0 ? -Math.PI / 2 : Math.PI / 2, 0, 0);
      m.add(wall);
    }
    // back wall: hangs off the top of the left wall's far edge would need a third hinge; it is simpler as its own
    // card on the facade (nested), standing D behind it and folding flat against the facade like the side walls
    const bw = w - inset * 2;
    const BK = buffers();
    addCard(BK, null, size, { w: bw, h: wh, front: tone.map((v) => v * 0.72), back: tone.map((v) => v * 0.85), edge: tone.map((v) => v * 0.5) });
    const back = meshOf(cd.name.replace(/_front$/, '') + '_back', toGeometry(BK), paper);
    back.position.set(0, 0, -D - HALF * 2 - 0.006);
    back.userData = hingeData(Math.PI / 2, 0, 0); // folds toward the facade (inside the box)
    m.add(back);
  }
  return m;
}

/** A Maebongsan wind turbine: ONE mesh named 'mill' (pole card + rotor card in front of it, z >= spinZMin), so
 *  world.js splits the rotor off and spins it about the centre of its bounding box (= the hub, see compose_atlas.py). */
function turbine(cd, S, size, paper) {
  const blades = S.mb_turbine_blades;
  if (!blades) return null;
  const h = cd.h || 1.2;
  const B = buffers();
  // tower: a slim tapered cream column with a small nacelle on top (both faces plain paper)
  const cream = linear('#f3ecdc'); const shade = linear('#ddd3bf'); const rim = linear('#b9ad96');
  const tw0 = 0.07 * h; const tw1 = 0.035 * h;
  addCard(B, null, size, { w: 1, h: 1, front: cream, back: shade, edge: rim, outline: [[0.5 - tw0 / 2, 1], [0.5 + tw0 / 2, 1], [0.5 + tw1 / 2, 1 - 0.94 * h], [0.5 - tw1 / 2, 1 - 0.94 * h]], scaleY: 1 });
  addCard(B, null, size, { w: 1, h: 1, front: cream, back: shade, edge: rim, outline: [[0.5 - 0.06 * h, 1 - 0.9 * h], [0.5 + 0.08 * h, 1 - 0.9 * h], [0.5 + 0.08 * h, 1 - 0.965 * h], [0.5 - 0.06 * h, 1 - 0.965 * h]], z0: 0.003 });
  const bw = h * 0.74;
  const hubY = Y0 + h * 0.93;
  const R = buffers();
  addCard(R, blades, size, { w: bw, h: bw, front: 'art', back: 'art', edge: linear(blades.tone, 0.5), z0: 0.024 });
  for (const [px, py] of [[-bw / 2, Y0], [bw / 2, Y0 + bw]]) { const v = vert(R, px, py, 0.024 + HALF, 0, 0, 1, [1, 1, 1], -1, -1); R.i.push(v, v, v); }
  const rg = toGeometry(R);
  rg.translate(0, hubY - (Y0 + bw / 2), 0);
  const m = meshOf('mill', mergeTwo(toGeometry(B), rg), paper);
  m.userData.fold = -Math.PI / 2;
  return m;
}

function mergeTwo(a, b) {
  const g = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'color', 'uv', 'uv1']) {
    const x = a.getAttribute(name); const y = b.getAttribute(name);
    const arr = new Float32Array(x.array.length + y.array.length);
    arr.set(x.array, 0); arr.set(y.array, x.array.length);
    g.setAttribute(name, new THREE.BufferAttribute(arr, x.itemSize));
  }
  const n = a.getAttribute('position').count;
  const ia = a.getIndex().array; const ib = b.getIndex().array;
  const idx = new Uint32Array(ia.length + ib.length);
  idx.set(ia, 0);
  for (let k = 0; k < ib.length; k++) idx[ia.length + k] = ib[k] + n;
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingBox(); g.computeBoundingSphere();
  return g;
}
