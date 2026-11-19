// 황지 페이퍼트레일: the hero - a girl in a straw hat, built here as a little paper-craft puppet (vertex-coloured,
// faceted low-poly pieces, so she reads as folded card like the rest of the page): a straw hat with a red ribbon,
// two braids, a sky-blue dress with a white collar and lace hem, a yellow backpack, red shoes and the lantern in her
// right hand. She keeps the part names and hinges of the old traveller.glb, so player/traveller.js walks her the same
// way: legs / arms hang from hips / shoulders (origin at the top), the head sits on the neck (origin at the bottom),
// the lantern hangs from its hook. The model faces +Z, feet at y = 0, height CONFIG.TRAVELLER_HEIGHT (0.6).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const C = {
  skin: '#f5d0b0', cheek: '#ef9a8b', eye: '#2a1a10', hair: '#4b2c1b',
  dress: '#5ea3d6', dressDark: '#4a8bbf', white: '#fbf7ee',
  straw: '#ecc874', strawCrown: '#dcb35c', strawEdge: '#b98f43', ribbon: '#d9463e',
  pack: '#e9a83a', packFlap: '#cf8f2c', strap: '#8b5a32', shoe: '#c8443c', iron: '#3d2b1d', glass: '#fff1c9',
};

const _m = new THREE.Matrix4(); const _q = new THREE.Quaternion(); const _e = new THREE.Euler(); const _s = new THREE.Vector3(); const _p = new THREE.Vector3();

/**
 * One painted piece: geometry `g` moved to (x, y, z), turned (rx, ry, rz radians), scaled (sx, sy, sz), split into
 * flat facets (non-indexed, face normals) and coloured `hex` (the colour attribute is linear, as three expects).
 */
function piece(g, hex, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
  const geo = (g.index ? g.toNonIndexed() : g).applyMatrix4(_m);
  if (geo !== g) g.dispose();
  for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'uv') geo.deleteAttribute(k);
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
  geo.computeVertexNormals();
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count; const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

/** A part: the pieces merged into one mesh named `name`, placed at (x, y, z) in its parent. */
function part(name, pieces, material, x = 0, y = 0, z = 0, shadow = true) {
  const mesh = new THREE.Mesh(mergeGeometries(pieces, false), material);
  for (const g of pieces) g.dispose();
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  mesh.geometry.computeBoundingBox();
  mesh.geometry.computeBoundingSphere();
  return mesh;
}

const cyl = (rt, rb, h, seg = 12) => new THREE.CylinderGeometry(rt, rb, h, seg, 1);
const ball = (r, w = 12, h = 9) => new THREE.SphereGeometry(r, w, h);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const disc = (r, seg = 10) => new THREE.CircleGeometry(r, seg);

function leg(name, x, paper) {
  return part(name, [
    piece(cyl(0.017, 0.016, 0.14), C.skin, 0, -0.07, 0),
    piece(cyl(0.0185, 0.0185, 0.042), C.white, 0, -0.158, 0), // socks
    piece(box(0.044, 0.028, 0.07), C.shoe, 0, -0.186, 0.012), // a red shoe, toe forward
    piece(box(0.046, 0.008, 0.03), C.shoe, 0, -0.17, 0.004), // its strap
  ], paper, x, 0.2, 0);
}

function arm(name, x, side, paper, forward = 0) {
  // hangs from the shoulder (origin), swung a little out to the side and `forward` (rad) to the front
  const out = side * 0.12;
  return part(name, [
    piece(ball(0.027, 10, 8), C.dress, 0, -0.012, 0, 0, 0, 0, 1, 0.85, 1), // puff sleeve
    piece(cyl(0.0135, 0.013, 0.11), C.skin, 0, -0.075, 0),
    piece(ball(0.017, 8, 6), C.skin, 0, -0.135, 0), // hand
  ].map((g) => g.applyMatrix4(_m.makeRotationFromEuler(_e.set(-forward, 0, out)))), paper, x, 0.345, 0);
}

function lantern(mats) {
  // a little tin lantern hanging from its hook (the group's origin)
  const g = new THREE.Group();
  g.name = 'lantern';
  const frame = part('lantern_frame', [
    piece(new THREE.TorusGeometry(0.012, 0.0025, 4, 10, Math.PI), C.iron, 0, -0.012, 0), // handle
    piece(cyl(0.016, 0.026, 0.014, 8), C.iron, 0, -0.022, 0), // roof
    piece(cyl(0.026, 0.026, 0.008, 8), C.iron, 0, -0.08, 0), // base
    ...[0, 1, 2, 3].map((k) => piece(box(0.004, 0.05, 0.004), C.iron, Math.cos(k * Math.PI / 2 + Math.PI / 4) * 0.021, -0.052, Math.sin(k * Math.PI / 2 + Math.PI / 4) * 0.021)),
  ], mats.paper);
  const glass = part('lantern_glass', [piece(cyl(0.019, 0.019, 0.046, 8), C.glass, 0, -0.052, 0)], mats.glow, 0, 0, 0, false);
  glass.userData.glow = true;
  g.add(frame, glass);
  return g;
}

function head(paper) {
  const braid = (s) => [
    piece(ball(0.022, 8, 6), C.hair, s * 0.074, 0.042, -0.026),
    piece(ball(0.02, 8, 6), C.hair, s * 0.078, 0.01, -0.028),
    piece(ball(0.018, 8, 6), C.hair, s * 0.08, -0.02, -0.03),
    piece(box(0.03, 0.012, 0.012), C.ribbon, s * 0.08, -0.04, -0.03, 0, 0, s * 0.3), // ribbon tie
    piece(cyl(0.004, 0.014, 0.024, 6), C.hair, s * 0.08, -0.057, -0.03), // the tuft
  ];
  return part('head', [
    piece(ball(0.082), C.skin, 0, 0.075, 0), // face
    piece(ball(0.087), C.hair, 0, 0.082, -0.013), // hair over the top and back
    piece(ball(0.05, 10, 6), C.hair, 0, 0.128, 0.052, 0, 0, 0, 1.45, 0.42, 0.62), // fringe
    piece(disc(0.011, 8), C.eye, -0.03, 0.074, 0.081, 0, -0.32, 0, 0.85, 1.2, 1),
    piece(disc(0.011, 8), C.eye, 0.03, 0.074, 0.081, 0, 0.32, 0, 0.85, 1.2, 1),
    piece(disc(0.012, 8), C.cheek, -0.05, 0.056, 0.067, 0, -0.62, 0),
    piece(disc(0.012, 8), C.cheek, 0.05, 0.056, 0.067, 0, 0.62, 0),
    piece(disc(0.006, 6), C.cheek, 0, 0.044, 0.081, 0, 0, 0, 1.6, 0.8, 1), // smile
    ...braid(-1), ...braid(1),
    // the straw hat: wide brim, darker plaited edge, crown, red ribbon band and its bow at the back
    piece(cyl(0.155, 0.155, 0.008, 24), C.straw, 0, 0.142, 0),
    piece(new THREE.TorusGeometry(0.152, 0.006, 4, 24), C.strawEdge, 0, 0.142, 0, Math.PI / 2),
    piece(cyl(0.066, 0.075, 0.06, 16), C.strawCrown, 0, 0.176, 0),
    piece(cyl(0.0768, 0.0776, 0.016, 16), C.ribbon, 0, 0.154, 0),
    piece(box(0.026, 0.018, 0.008), C.ribbon, -0.017, 0.156, -0.078, 0, 0, 0.35),
    piece(box(0.026, 0.018, 0.008), C.ribbon, 0.017, 0.156, -0.078, 0, 0, -0.35),
    piece(box(0.011, 0.06, 0.004), C.ribbon, -0.01, 0.124, -0.081, 0.12, 0, 0.12),
    piece(box(0.011, 0.054, 0.004), C.ribbon, 0.011, 0.127, -0.081, 0.12, 0, -0.16),
  ], paper, 0, 0.375, 0);
}

function body(paper) {
  return part('body', [
    piece(cyl(0.05, 0.106, 0.19, 12), C.dress, 0, 0.265, 0), // A-line dress
    piece(cyl(0.107, 0.11, 0.013, 12), C.white, 0, 0.176, 0), // lace hem
    piece(cyl(0.069, 0.071, 0.014, 12), C.dressDark, 0, 0.3, 0), // waist
    piece(cyl(0.034, 0.064, 0.018, 12), C.white, 0, 0.351, 0), // collar
    piece(cyl(0.017, 0.018, 0.03, 8), C.skin, 0, 0.368, 0), // neck
    // backpack with its flap, straps over the shoulders
    piece(box(0.088, 0.092, 0.042), C.pack, 0, 0.292, -0.078),
    piece(box(0.09, 0.034, 0.046), C.packFlap, 0, 0.326, -0.079),
    piece(box(0.012, 0.11, 0.01), C.strap, -0.03, 0.3, 0.064, -0.32, 0, 0), // leaning back with the dress
    piece(box(0.012, 0.11, 0.01), C.strap, 0.03, 0.3, 0.064, -0.32, 0, 0),
  ], paper);
}

/** mats: { paper, glow } (the traveller's material instances, loader.js). Returns the 'traveller' group. */
export function buildGirlTraveller(mats) {
  const root = new THREE.Group();
  root.name = 'traveller';
  const b = body(mats.paper);
  const armR = arm('arm_r', -0.064, -1, mats.paper, 0.45); // her right (model -X): holds the lantern out in front
  const lamp = lantern(mats);
  lamp.position.set(-0.016, -0.136, 0.06); // under her hand (the arm leans 0.45 rad forward, 0.12 out)
  armR.add(lamp);
  b.add(arm('arm_l', 0.064, 1, mats.paper), armR, head(mats.paper));
  root.add(b, leg('leg_l', 0.032, mats.paper), leg('leg_r', -0.032, mats.paper));
  root.userData.height = 0.6;
  root.animations = [];
  return root;
}
