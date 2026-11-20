// Pop-up Atlas composition root.
// URL params: ?seed=N  ?quality=low|med|high (default: auto)  ?mute=1  ?hint=0  ?intro=0  ?night=1  ?life=0  ?animals=0
import * as THREE from 'three';
import { CONFIG, QUALITY, TILE_SIZE } from './core/config.js';
import { bus } from './core/events.js';
import { state } from './core/state.js';
import { createLoop } from './core/loop.js';
import { loadAssets } from './assets/loader.js';
import { createWFC } from './world/wfc.js';
import { createWorld } from './world/world.js';
import { createTraveller } from './player/traveller.js';
import { createControls } from './player/controls.js';
import { createFollowCamera } from './camera/follow.js';
import { createRenderer } from './render/renderer.js';
import { createLights } from './render/lights.js';
import { createPost } from './render/post.js';
import { gpuTier, createGovernor } from './render/governor.js';
import { createMaterials } from './render/materials.js';
import { createPaperAudio } from './audio/paper.js';
import { createMusic } from './audio/music.js';
import { createSfx } from './audio/sfx.js';
import { createDayNight } from './render/daynight.js';
import { createLife } from './life/life.js';
import { createAnimals } from './life/animals.js';
import { createGame } from './game/index.js';
import { createNpcs } from './game/npcs.js';
import { INTRO } from './game/intro.js';
import { createWeather } from './game/weather.js';
import { createFish } from './life/fish.js';
import { createViews } from './camera/views.js';
// Allocation-free two-dimensional length.
const hypot2 = (a, b) => Math.sqrt(a * a + b * b);

const params = new URLSearchParams(location.search);
const seedParam = parseInt(params.get('seed') ?? '', 10);
const seed = Number.isFinite(seedParam) ? seedParam : CONFIG.DEFAULT_SEED;
// ?quality=low|med|high pins a level; otherwise (auto) the GPU picks the start and render/governor.js keeps the fps
const pinned = QUALITY[params.get('quality')] ? params.get('quality') : null;
let quality = pinned || CONFIG.DEFAULT_QUALITY;
const muted = params.get('mute') === '1';
const showHint = params.get('hint') !== '0';
const showIntro = params.get('intro') !== '0';

state.seed = seed;
state.quality = quality;

// PWA: the service worker (public/sw.js) caches the game so it installs and plays offline (production builds only:
// in dev it would get in the way of hot reloading)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}

/** The loading screen of index.html: progress 0..1 with a line of what is happening, then it fades away. */
function loadingScreen() {
  const el = document.getElementById('loading');
  const bar = el && el.querySelector('.ld-fill');
  const msg = el && el.querySelector('.ld-msg');
  let shown = 0;
  return {
    step(p, text) {
      if (!el) return;
      shown = Math.max(shown, Math.min(1, p));
      bar.style.transform = `scaleX(${shown.toFixed(3)})`;
      if (text) msg.textContent = text;
      el.setAttribute('aria-valuenow', String(Math.round(shown * 100)));
    },
    done() { if (!el) return; el.classList.add('done'); setTimeout(() => el.remove(), 1200); },
    fail() { if (!el) return; el.classList.add('failed'); msg.textContent = '불러오지 못했어요. 새로고침해 주세요.'; },
  };
}
const loading = loadingScreen();

async function boot() {
  const canvas = document.getElementById('atlas');
  const hint = document.getElementById('hint');

  const scene = new THREE.Scene();
  loading.step(0.04, '종이를 고르는 중…');
  const rend = createRenderer({ canvas, quality });
  const { renderer, setSize: setRendererSize } = rend;
  if (!pinned) { quality = gpuTier(renderer); rend.setQuality(quality); } // integrated graphics start lower
  state.quality = quality;
  const materials = createMaterials({ quality });
  THREE.DefaultLoadingManager.onProgress = (url, n, total) => loading.step(0.05 + 0.6 * (n / Math.max(1, total)));
  const assets = await loadAssets({ materials, renderer, quality });
  THREE.DefaultLoadingManager.onProgress = () => {};
  loading.step(0.68, '팝업북을 펼치는 중…');
  materials.setTextures(assets.textures);
  const lights = createLights({ scene, quality });
  const wfc = createWFC({ seed });
  const world = createWorld({ scene, assets, wfc, materials, quality });
  const traveller = createTraveller({ scene, assets, world, materials });
  const follow = createFollowCamera({ aspect: window.innerWidth / Math.max(1, window.innerHeight) });
  const controls = createControls({ domElement: canvas, camera: follow.camera, traveller, world });
  const views = createViews({ follow }); // V cycles camera views
  const post = createPost({ renderer, scene, camera: follow.camera, quality });
  const audio = createPaperAudio({ muted });
  const music = createMusic({ audio });
  // 도감 / talk / season UI sounds and the opening story's voice lines (public/sounds, made with ElevenLabs)
  const sfx = createSfx({ audio, extra: INTRO.map((_, i) => 'intro_' + (i + 1)) });
  const daynight = createDayNight({ scene, night: params.get('night') === '1' });
  // ambient life + weather (leaves, snow, rain, birds, chimney smoke, fireflies ...): 2 draw calls; ?life=0 disables it
  const life = params.get('life') === '0' || CONFIG.life.enabled === false ? null : createLife({ scene, assets, wfc, world, daynight, camera: follow.camera, quality, seed });
  // living animals (cats, sheep, hens, ducks ...): cut-paper cards on risen tiles, 2 draw calls; ?animals=0 disables them
  const animals = params.get('animals') === '0' || CONFIG.animals.enabled === false ? null : createAnimals({ scene, renderer, world, wfc, traveller, daynight, assets, seed, quality });
  // Gameplay progress is saved independently for each world seed.
  const game = createGame({ scene, renderer, world, wfc, traveller, follow, controls, lights, post, daynight, music, audio, life, assets, materials, seed, quality });
  follow.setAssistGate(game.modal);
  // 황지 페이퍼트레일: the class mascots talk; the 태백 places go into the 도감
  // 황지 페이퍼트레일: weather per season ring, leaping stream fish, talking mascots / legends / 도감
  const weather = createWeather({ traveller, lights, seed });
  const npcs = createNpcs({ animals, world, traveller, camera: follow.camera, weather, seed, sfx, intro: showIntro });
  // (the 수굴 spring of 황지연못: hj_pond is pinned at cell (1, 0), 상지's spring sits south of its middle)
  const fish = createFish({ scene, world, traveller, camera: follow.camera, assets, daynight, onLeap: (id, f, x, z) => npcs.sawCreature(id, x, z), springs: [[1 * TILE_SIZE + 0.32, 0 * TILE_SIZE + 0.48]] });
  if (params.get('debug') === '1') window.__hj = { world, wfc, traveller, follow, controls, animals, npcs, daynight, game, weather, fish, lights, life, audio, sfx, get governor() { return governor; } };
  // N: day / night, M: music on / off (keys only - no on-screen UI)
  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'KeyN') daynight.toggle();
    else if (e.code === 'KeyV' && !game.modal()) views.next();
    else if (e.code === 'KeyM') music.toggle();
  });

  // The tiles cast shadows through BatchedMeshes, everything else through plain meshes.
  // three uses ONE internal depth material for all shadow casters and re-derives its whole program-parameter
  // set whenever the object class flips (batched <-> plain) - twice per frame, ~6 kB of garbage each frame.
  // A second, identical depth material for the plain meshes removes the flip.
  const plainDepth = new THREE.MeshDepthMaterial();
  scene.traverse((o) => { if (o.isMesh && !o.isBatchedMesh && !o.isInstancedMesh && o.castShadow && !o.customDepthMaterial) o.customDepthMaterial = plainDepth; });

  // ---- one simulation tick (order is part of the contract) ------------------------------------
  const idle = { x: 0, z: 0 };
  const _right = new THREE.Vector3();

  function update(dt) {
    state.time = loop.time;
    state.frame = loop.frame;
    const input = controls.getInput(dt) || idle;
    traveller.update(dt, game.modal() || npcs.modal() ? idle : input); // No walking while the atlas page or the 도감 is open.
    const p = traveller.position;
    const t = state.traveller;
    t.x = p.x; t.y = p.y; t.z = p.z;
    t.dirX = traveller.moveDir.x; t.dirZ = traveller.moveDir.z; t.speed = traveller.speed;
    _right.setFromMatrixColumn(follow.camera.matrixWorld, 0);
    const rl = hypot2(_right.x, _right.z) || 1;
    state.listener.x = p.x; state.listener.z = p.z;
    state.listener.rightX = _right.x / rl; state.listener.rightZ = _right.z / rl;
    world.update(dt, p, traveller.moveDir);
    views.update(dt);
    follow.update(dt, traveller);
    daynight.update(dt);
    weather.update();
    if (life) life.update(dt, p, follow.camera);
    if (animals) animals.update(dt);
    fish.update(dt);
    game.update(dt);
    npcs.update(dt);
    lights.update(dt, traveller, follow.camera);
    materials.update(dt);
  }

  function render(dt) {
    post.setFocus(follow.focusPoint);
    post.render(dt);
    game.atlasmap.render(); // Drawn over the finished frame; no-op while closed.
    if (governor) governor.tick();
  }

  // ---- frame-rate governor (render/governor.js): steps quality / resolution to keep the fps on modest GPUs ----------
  const governor = pinned ? null : createGovernor({
    start: quality,
    apply(rung, i, why) {
      rend.setQuality(rung.level); rend.setScale(rung.scale);
      post.setQuality(rung.level); lights.setQuality(rung.level); materials.setQuality(rung.level);
      state.quality = rung.level;
      resize();
      console.info(`[quality] ${rung.level}${rung.scale < 1 ? ` x${rung.scale}` : ''} (${why})`);
    },
  });

  const loop = createLoop({ update, render });

  // ---- resize -----------------------------------------------------------------------------------
  function resize() {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    setRendererSize(w, h);
    follow.setAspect(w / h);
    post.setSize(w, h);
    bus.emit('resize', { width: w, height: h, dpr: renderer.getPixelRatio() });
  }
  window.addEventListener('resize', resize);

  // ---- hint (the only on-screen text) -----------------------------------------------------------
  if (showHint) {
    hint.classList.add('on');
    bus.once('input:first', () => hint.classList.remove('on'));
  } else hint.remove();

  // Find a safe initial position without skipping the opening fold animation.
  function initialPosition() {
    const x = 0; const z = 0;
    if (world.isWalkable(x, z)) return [x, z];
    for (let r = 0.25; r <= TILE_SIZE * 3; r += 0.25) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const nx = x + Math.cos(a) * r;
        const nz = z + Math.sin(a) * r;
        if (world.isWalkable(nx, nz)) return [nx, nz];
      }
    }
    return [x, z];
  }

  // ---- start ------------------------------------------------------------------------------------------
  loading.step(0.86, '친구들을 부르는 중…');
  if (animals) await animals.ready;
  resize();
  const [x, z] = initialPosition();
  traveller.teleport(x, z);
  controls.clearTarget();
  update(0);
  follow.snap(traveller);
  _right.setFromMatrixColumn(follow.camera.matrixWorld, 0);
  const rl = hypot2(_right.x, _right.z) || 1;
  state.listener.rightX = _right.x / rl; state.listener.rightZ = _right.z / rl;
  if (world.faceCamera) world.faceCamera();
  if (life) life.update(0, traveller.position, follow.camera);
  lights.update(0, traveller, follow.camera);
  render(0);
  loop.start();
  loading.step(1, '준비 완료!');
  setTimeout(() => loading.done(), 380);
  npcs.startIntro(); // the short spoken guide to the trip, top centre
}

boot().catch((err) => {
  console.error('[atlas] boot failed', err);
  loading.fail();
  throw err;
});
