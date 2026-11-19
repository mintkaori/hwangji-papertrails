// 황지 페이퍼트레일: the class mascots talk, and the places of Taebaek go into a little 도감.
//  * Walk up to a mascot (life/animals.js species npc_*): a paper speech bubble pops above it with its name and one
//    line; each visit the next line.
//  * The first time the traveller stands on one of the 황지 / 태백 tiles (world/kit.js), a short note slides in with the
//    place's one-line story and the 도감 count. Discoveries are kept per seed in localStorage (when it is available).
// DOM only (two small elements over the canvas); nothing is drawn into the scene.
import * as THREE from 'three';
import { TILE_SIZE } from '../core/config.js';

export const MASCOTS = {
  npc_milk: { name: '흰우유', lines: ['안녕! 여기는 우리 황지중앙초등학교야.', '우유 마시고 키 쑥쑥! 오늘도 힘내자!', '교문 옆 노란 꽃이 우리 학교 꽃, 개나리야.'] },
  npc_korea: { name: '한국사람', lines: ['반가워! 태극기처럼 씩씩하게 가 보자!', '태백은 평균 해발 900m, 하늘과 가까운 고원도시야.', '여름에도 시원해서 열대야가 거의 없대!'] },
  npc_monkey: { name: '뭉키', lines: ['미끄럼틀 타러 갈래? 슝~!', '운동장 만국기가 펄럭펄럭!', '나 잡아 봐라~!'] },
  npc_bunny: { name: '이송미', lines: ['Tab을 누르면 지도가 펼쳐져!', '걸어간 만큼 지도가 넓어진대.', '내 귀는 하늘색이야. 예쁘지?'] },
  npc_duck: { name: '파닥이', lines: ['파닥파닥! N을 누르면 밤이 돼!', '밤에 가로등을 켜면 별이 반짝여.', '꽥! 연못에 같이 가자!'] },
  npc_otter: { name: '수달이', lines: ['여기가 황지연못! 낙동강이 시작되는 곳이야.', '하루에 물이 5,000톤이나 솟아난대!', '이 물이 1,300리를 흘러 부산 바다까지 가!'] },
  npc_blob: { name: '해피', lines: ['…(빙그레)', '황부자 전설 알아? 며느리가 돌이 되었대.', '저기 며느리상이 그 이야기야.'] },
  npc_elephant: { name: '코돌이', lines: ['다이소에서 색연필 사야지!', '공책이랑 지우개도 필요해.', '만들기 재료가 여기 다 있어!'] },
  npc_bear: { name: '돌돌이', lines: ['인형뽑기 딱 한 번만…!', '저 곰돌이 인형 귀엽지?', '뽑기는 조금만! 우리 약속해.'] },
  npc_cat: { name: '리노', lines: ['야옹~ 나는 반짝이는 별이 좋아.', '밤이 되면 가로등을 밝혀 줘.', '인형들이 나를 쳐다보는 것 같아…'] },
  npc_dog: { name: '밤이', lines: ['산소드림도서관은 밤 10시까지 열어!', '어린이자료실에 재미있는 책이 많아.', '금요일은 쉬는 날! 월요일에는 열어.'] },
};

export const DEX = {
  hj_school: ['황지중앙초등학교', '1963년에 문을 연 우리 학교! 교화는 개나리, 교목은 향나무.'],
  hj_playground: ['우리 학교 운동장', '한마음가족운동회가 열리는 넓은 운동장.'],
  hj_pond: ['황지연못', '하루 5,000톤의 물이 솟아 낙동강 1,300리가 시작돼요.'],
  hj_daiso: ['다이소 태백황지점', '황지연못 건너편, 문구와 만들기 재료가 가득!'],
  hj_claw: ['황지로 인형뽑기', '방과 후 인기 장소. 뽑기는 조금만, 약속!'],
  hj_library: ['태백산소드림도서관', '밤 10시까지 불이 켜진 도서관. 금요일은 쉬어요.'],
  ch_kkachibal: ['철암 까치발 건물', '하천 위에 기둥을 세워 지은 탄광촌 집이에요.'],
  ch_coal: ['철암역두 선탄시설', '1930년대에 지은 우리나라 첫 무연탄 선탄시설.'],
  ch_mine: ['탄광 갱도', '1960~80년대 태백에는 탄광이 50곳이 넘었어요.'],
  ch_gumunso: ['구문소', '강물이 산을 뚫고 지나간 돌문. 삼엽충 화석도 있어요!'],
  mb_wind: ['매봉산 바람의 언덕', '하얀 풍력발전기가 바람을 받아 빙글빙글!'],
  mb_cabbage: ['고랭지 배추밭', '해발 1,300m, 구름 가까이 펼쳐진 배추밭.'],
  mb_sunflower: ['구와우 해바라기', '여름이면 해바라기가 키보다 크게 자라요.'],
  mb_samsu: ['삼수령', '빗물이 한강·낙동강·오십천으로 나뉘는 고개.'],
  tb_cheonjedan: ['태백산 천제단', '산꼭대기에서 하늘에 제사를 지내던 돌 제단.'],
  tb_yew: ['태백산 주목 군락', '살아 천년 죽어 천년, 태백시의 나무 주목!'],
  gd_geomnyong: ['검룡소', '한강이 시작되는 샘. 하루 2,000톤이 솟아요.'],
  gd_flowers: ['금대봉 야생화', '얼레지, 노랑무늬붓꽃… 귀한 꽃들의 동산.'],
  gd_azalea: ['철쭉과 함박꽃', '하얀 함박꽃은 태백시의 꽃이에요.'],
};
const DEX_IDS = Object.keys(DEX);

const CSS = `
.hj-bubble, .hj-note { position: fixed; pointer-events: none; user-select: none; z-index: 5;
  font-family: 'Jua', 'BM JUA_TTF', 'BM JUA_OTF', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #4a3424; }
.hj-bubble { left: 0; top: 0; max-width: min(300px, 70vw); padding: 9px 14px 10px; border-radius: 14px;
  background: #fbf6ea; border: 2px solid #c9a77c; box-shadow: 0 3px 0 rgba(120, 84, 50, 0.25), 0 8px 18px rgba(30, 18, 8, 0.25);
  font-size: 16px; line-height: 1.35; opacity: 0; transition: opacity 0.25s ease; will-change: transform; }
.hj-bubble.on { opacity: 1; }
.hj-bubble b { display: block; font-size: 13px; color: #b0643c; margin-bottom: 2px; letter-spacing: 0.04em; }
.hj-bubble::after { content: ''; position: absolute; left: 50%; bottom: -9px; margin-left: -8px; width: 14px; height: 14px;
  background: #fbf6ea; border-right: 2px solid #c9a77c; border-bottom: 2px solid #c9a77c; transform: rotate(45deg); }
.hj-note { left: 50%; top: 4.5vh; transform: translate(-50%, -12px); max-width: min(520px, 88vw); padding: 10px 18px 11px;
  border-radius: 10px; background: #fbf6ea; border: 2px dashed #c9a77c; text-align: center; font-size: 15px; line-height: 1.4;
  box-shadow: 0 6px 18px rgba(30, 18, 8, 0.3); opacity: 0; transition: opacity 0.5s ease, transform 0.5s ease; }
.hj-note.on { opacity: 1; transform: translate(-50%, 0); }
.hj-note b { font-size: 18px; color: #8a4a2a; }
.hj-note small { display: block; margin-top: 3px; font-size: 12px; color: #9a7a5a; letter-spacing: 0.08em; }
`;

export function createNpcs({ animals, world, traveller, camera, seed = 0 }) {
  if (typeof document === 'undefined') return { update() {}, dispose() {} };
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const bubble = document.createElement('div');
  bubble.className = 'hj-bubble';
  const note = document.createElement('div');
  note.className = 'hj-note';
  document.body.append(bubble, note);

  const NEAR = 0.85; const FAR = 1.15; // talk radius / stop radius (world units)
  const visits = new Map();
  const hit = { id: '', x: 0, y: 0, z: 0, d: 0 };
  const _p = new THREE.Vector3();
  let talking = ''; let tx = 0; let ty = 0; let tz = 0; let bx = -1; let by = -1;

  // ---- 도감 ----------------------------------------------------------------------------------------------------
  const KEY = 'hwangji-dex-' + (seed | 0);
  let found = new Set();
  try { found = new Set(JSON.parse(localStorage.getItem(KEY) || '[]').filter((k) => DEX[k])); } catch { /* private mode: keep it in memory */ }
  let noteT = 0; let lastCell = '';

  function showNote(id) {
    const [name, story] = DEX[id];
    note.innerHTML = '';
    const b = document.createElement('b'); b.textContent = '📖 ' + name;
    const p = document.createElement('div'); p.textContent = story;
    const s = document.createElement('small'); s.textContent = `태백 도감 ${found.size} / ${DEX_IDS.length}`;
    note.append(b, p, s);
    note.classList.add('on');
    noteT = 5.5;
  }

  function checkPlace() {
    const p = traveller.position;
    const cx = Math.round(p.x / TILE_SIZE); const cz = Math.round(p.z / TILE_SIZE);
    const k = cx + ',' + cz;
    if (k === lastCell) return;
    lastCell = k;
    let cell = null;
    try { cell = world.tileAt(cx, cz); } catch { cell = null; }
    const id = cell && cell.model;
    if (!id || !DEX[id] || found.has(id)) return;
    found.add(id);
    try { localStorage.setItem(KEY, JSON.stringify([...found])); } catch { /* ignore */ }
    showNote(id);
  }

  function say(id) {
    const m = MASCOTS[id];
    if (!m) return;
    const n = visits.get(id) || 0;
    visits.set(id, n + 1);
    bubble.innerHTML = '';
    const b = document.createElement('b'); b.textContent = m.name;
    const t = document.createElement('span'); t.textContent = m.lines[n % m.lines.length];
    bubble.append(b, t);
    bubble.classList.add('on');
    bx = by = -1;
  }

  function update(dt) {
    checkPlace();
    if (noteT > 0) { noteT -= dt; if (noteT <= 0) note.classList.remove('on'); }
    if (!animals || !animals.npcNear) return;
    const p = traveller.position;
    const has = animals.npcNear(p.x, p.z, talking ? FAR : NEAR, hit);
    if (!has || (talking && hit.id !== talking && hit.d > NEAR)) {
      if (talking) { talking = ''; bubble.classList.remove('on'); }
      return;
    }
    if (hit.id !== talking) { talking = hit.id; say(talking); }
    tx = hit.x; ty = hit.y; tz = hit.z;
    _p.set(tx, ty + 0.62, tz).project(camera);
    if (_p.z > 1) { bubble.classList.remove('on'); return; }
    const sx = (_p.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-_p.y * 0.5 + 0.5) * window.innerHeight;
    // ease the bubble so it does not shake with the paper waddle
    const k = bx < 0 ? 1 : Math.min(1, dt * 10);
    bx = bx < 0 ? sx : bx + (sx - bx) * k; by = by < 0 ? sy : by + (sy - by) * k;
    bubble.style.transform = `translate(${bx.toFixed(1)}px, ${by.toFixed(1)}px) translate(-50%, -100%)`;
    if (!bubble.classList.contains('on')) bubble.classList.add('on');
  }

  return {
    update,
    /** Places of the 도감 found so far (ids of DEX). */
    found: () => [...found],
    dispose() { bubble.remove(); note.remove(); style.remove(); },
  };
}
