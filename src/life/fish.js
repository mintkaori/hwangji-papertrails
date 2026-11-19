// 황지 페이퍼트레일: fish of the Taebaek streams leap out of the water near the traveller - 열목어, 금강모치, 버들치,
// 둑중개 and, at night, 미유기 (art cards cut by art-src/taebaek/compose_atlas.py). Which fish depends on the season
// ring: none under the winter ice. One InstancedMesh of camera-facing quads on the art atlas (alpha-tested, lit like
// the animal cards) plus a few splash rings; 2 draw calls. onLeap(id) tells game/npcs.js which fish was seen.
import * as THREE from 'three';

/** Sprite name in atlas.json, Korean name, the rings it lives in (biome ids), night only. */
export const FISH = {
  an_lenok: { name: '열목어', biomes: ['blossom', 'pinewood'], night: false, len: 0.36 },
  fish_kumgang: { name: '금강모치', biomes: ['blossom', 'desert', 'pinewood'], night: false, len: 0.26 },
  fish_beodeul: { name: '버들치', biomes: ['heartland', 'blossom', 'desert', 'pinewood'], night: false, len: 0.26 },
  fish_dukjung: { name: '둑중개', biomes: ['desert', 'pinewood'], night: false, len: 0.26 },
  fish_miyugi: { name: '미유기', biomes: ['heartland', 'blossom', 'desert', 'pinewood'], night: true, len: 0.34 },
};
const IDS = Object.keys(FISH);
const N = 6; // leaps at once
const RINGS = N * 2;

export function createFish({ scene, world, traveller, camera, assets, daynight, onLeap = null }) {
  const tex = assets && assets.textures && assets.textures.art;
  if (!tex) return { update() {}, dispose() {} };

  // ---- fish cards ------------------------------------------------------------------------------------------------
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const rect = new Float32Array(N * 4);
  const rectAttr = new THREE.InstancedBufferAttribute(rect, 4);
  rectAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aRect', rectAttr);
  const mat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide, alphaTest: 0.45 });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aRect;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n\tvMapUv = aRect.xy + uv * aRect.zw;')
      .replace('#include <defaultnormal_vertex>', '#include <defaultnormal_vertex>\n\ttransformedNormal = normalize( ( viewMatrix * vec4( 0.0, 0.75, 0.66, 0.0 ) ).xyz );');
  };
  mat.customProgramCacheKey = () => 'life-fish';
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  mesh.name = 'life_fish';
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  scene.add(mesh);

  // ---- splash rings ------------------------------------------------------------------------------------------------
  const ringGeo = new THREE.RingGeometry(0.8, 1, 28).rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({ color: '#f4fbff', transparent: true, opacity: 0.55, depthWrite: false });
  const ringOpacity = new Float32Array(RINGS);
  ringMat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float aFade;\nvarying float vFade;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvFade = aFade;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFade;')
      .replace('#include <opaque_fragment>', 'diffuseColor.a *= vFade;\n#include <opaque_fragment>');
  };
  ringMat.customProgramCacheKey = () => 'life-fish-ring';
  const fadeAttr = new THREE.InstancedBufferAttribute(ringOpacity, 1);
  fadeAttr.setUsage(THREE.DynamicDrawUsage);
  ringGeo.setAttribute('aFade', fadeAttr);
  const rings = new THREE.InstancedMesh(ringGeo, ringMat, RINGS);
  rings.name = 'life_fish_rings';
  rings.frustumCulled = false;
  rings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rings.count = 0;
  scene.add(rings);

  // ---- sprites -----------------------------------------------------------------------------------------------------
  const sprite = {};
  fetch('./textures/art/atlas.json').then((r) => (r.ok ? r.json() : null)).then((j) => {
    if (!j || !j.sprites || !j.size) return;
    for (const id of IDS) {
      const sp = j.sprites[id];
      if (!sp) continue;
      const [x, y, w, h] = sp.rect;
      sprite[id] = [x / j.size[0], (y + h) / j.size[1], w / j.size[0], -h / j.size[1], w / h];
    }
  }).catch(() => {});

  const leaps = [];
  for (let i = 0; i < N; i++) leaps.push({ on: false, id: '', x: 0, z: 0, dx: 0, dz: 0, t: 0, dur: 1, h: 0.3, len: 0.3, ring0: false });
  const ringT = new Float32Array(RINGS).fill(-1); const ringX = new Float32Array(RINGS); const ringZ = new Float32Array(RINGS);
  let wait = 2;
  let rng = 0x2545f491;
  const rnd = () => { rng ^= rng << 13; rng ^= rng >>> 17; rng ^= rng << 5; return ((rng >>> 0) % 100000) / 100000; };
  const _m = new THREE.Matrix4(); const _r = new THREE.Matrix4(); const _q = new THREE.Quaternion(); const _p = new THREE.Vector3(); const _s = new THREE.Vector3();
  const _right = new THREE.Vector3(); const _up = new THREE.Vector3(); const _back = new THREE.Vector3();

  function splash(x, z) {
    for (let i = 0; i < RINGS; i++) if (ringT[i] < 0) { ringT[i] = 0; ringX[i] = x; ringZ[i] = z; return; }
  }

  function tryLeap() {
    const p = traveller.position;
    const night = !!(daynight && daynight.night);
    for (let k = 0; k < 14; k++) {
      const a = rnd() * Math.PI * 2; const r = 1.1 + rnd() * 3.6;
      const x = p.x + Math.cos(a) * r; const z = p.z + Math.sin(a) * r * 0.8 - 0.6; // a little ahead (up the page) of him
      if (world.surfaceAt(x, z) !== 'water') continue;
      const biome = world.biomeAt(x, z);
      const can = IDS.filter((id) => sprite[id] && FISH[id].biomes.includes(biome) && (FISH[id].night ? night : true) && (!night || FISH[id].night || rnd() < 0.3));
      if (!can.length) return;
      const l = leaps.find((q) => !q.on);
      if (!l) return;
      const id = can[(rnd() * can.length) | 0];
      const dir = rnd() < 0.5 ? -1 : 1;
      l.on = true; l.id = id; l.x = x; l.z = z; l.dx = dir * (0.22 + rnd() * 0.18); l.dz = (rnd() - 0.5) * 0.12;
      l.t = 0; l.dur = 0.75 + rnd() * 0.35; l.h = 0.2 + rnd() * 0.2; l.len = FISH[id].len; l.ring0 = false;
      splash(x, z);
      if (onLeap) onLeap(id, FISH[id]);
      return;
    }
  }

  function update(dt) {
    if (!Object.keys(sprite).length) return;
    wait -= dt;
    if (wait <= 0) { tryLeap(); wait = 0.9 + rnd() * 1.8; }
    // camera frame for the billboards (cards stay upright, facing the camera's horizontal direction)
    camera.updateMatrixWorld();
    const e = camera.matrixWorld.elements;
    _right.set(e[0], 0, e[2]).normalize();
    _back.set(e[8], 0, e[10]).normalize();
    _up.set(0, 1, 0);
    let n = 0;
    for (const l of leaps) {
      if (!l.on) continue;
      l.t += dt;
      const u = l.t / l.dur;
      if (u >= 1) { l.on = false; splash(l.x + l.dx, l.z + l.dz); continue; }
      const sp = sprite[l.id];
      const x = l.x + l.dx * u; const z = l.z + l.dz * u; const y = 4 * l.h * u * (1 - u) - 0.03;
      // nose up on the way out, nose down on the way in; mirrored when it swims to screen-left
      const sx = l.dx * _right.x + l.dz * _right.z >= 0 ? 1 : -1;
      const roll = (0.5 - u) * 1.3 * sx;
      _q.setFromAxisAngle(_back, roll);
      _m.makeBasis(_right, _up, _back);
      _m.premultiply(_r.makeRotationFromQuaternion(_q));
      _s.set(l.len * sx, l.len / sp[4], 1);
      _m.scale(_s);
      _m.setPosition(_p.set(x, y + l.len / sp[4] * 0.5, z));
      mesh.setMatrixAt(n, _m);
      rect[n * 4] = sp[0]; rect[n * 4 + 1] = sp[1]; rect[n * 4 + 2] = sp[2]; rect[n * 4 + 3] = sp[3];
      n++;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    rectAttr.needsUpdate = true;
    let m = 0;
    for (let i = 0; i < RINGS; i++) {
      if (ringT[i] < 0) continue;
      ringT[i] += dt;
      const u = ringT[i] / 1.1;
      if (u >= 1) { ringT[i] = -1; continue; }
      const r = 0.05 + u * 0.3;
      _m.makeScale(r, 1, r).setPosition(ringX[i], 0.012, ringZ[i]);
      rings.setMatrixAt(m, _m);
      ringOpacity[m] = (1 - u) * (1 - u);
      m++;
    }
    rings.count = m;
    rings.instanceMatrix.needsUpdate = true;
    fadeAttr.needsUpdate = true;
  }

  return {
    update,
    dispose() { scene.remove(mesh); scene.remove(rings); geo.dispose(); mat.dispose(); ringGeo.dispose(); ringMat.dispose(); },
  };
}
