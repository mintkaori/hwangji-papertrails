// 황지 페이퍼트레일: the talking, story and 도감 layer (DOM only - nothing is drawn into the scene).
//  * Mascots (life/animals.js species npc_*): walk up to one and it waves (animals.js) and a paper speech bubble opens
//    with what it says about the place it stands in; Space hears more (the place, the weather, the season, itself).
//  * Season banner: entering a new season ring shows its name; a corner badge keeps season, place and weather.
//  * Weather (game/weather.js): a short note when the sky changes.
//  * Legend trails (lg_* tiles): walking the road through one tells the tale scene by scene in a storybook panel.
//  * 도감: the first visit of a 황지 / 태백 place, legend or festival, and the first sight of a Taebaek fish or bird,
//    slide in a note; discoveries are kept per seed in localStorage (when it is available).
import * as THREE from 'three';
import { TILE_SIZE } from '../core/config.js';
import { biomeInfo, SEASON_OF, PLACE_OF } from '../core/biomes.js';

// ---- the mascots ----------------------------------------------------------------------------------------------------
export const MASCOTS = {
  npc_milk: { name: '흰우유', self: ['우유 마시고 키 쑥쑥! 오늘도 힘내자!', '나랑 같이 학교 구경할래?'] },
  npc_korea: { name: '한국사람', self: ['태극기처럼 씩씩하게 가 보자!', '태백은 하늘과 가까운 고원도시야.'] },
  npc_monkey: { name: '뭉키', self: ['나 잡아 봐라~!', '미끄럼틀 한 번 더!'] },
  npc_bunny: { name: '이송미', self: ['내 귀는 하늘색이야. 예쁘지?', 'Tab을 누르면 지도가 펼쳐져!'] },
  npc_duck: { name: '파닥이', self: ['파닥파닥! N을 누르면 밤이 돼!', '꽥! 물가에서 물고기가 뛰어올라!'] },
  npc_otter: { name: '수달이', self: ['나는 맑은 물이 좋아!', '물가를 잘 보면 물고기가 펄쩍 뛰어!'] },
  npc_blob: { name: '해피', self: ['…(빙그레)', '천천히 걸어도 괜찮아.'] },
  npc_elephant: { name: '코돌이', self: ['코로 꽃향기를 맡고 있어!', '여름의 매봉산은 바람이 시원해.'] },
  npc_bear: { name: '돌돌이', self: ['나는 복슬복슬 돌돌이야!', '같이 놀자, 같이 놀자!'] },
  npc_cat: { name: '리노', self: ['야옹~ 나는 반짝이는 별이 좋아.', '밤이 되면 가로등을 밝혀 줘.'] },
  npc_dog: { name: '밤이', self: ['멍멍! 이 길 끝까지 같이 가자!', '킁킁, 낙엽 냄새가 나.'] },
};

/** What any mascot says about the place (tile model) it stands in. */
const PLACE_TALK = {
  hj_school: ['안녕! 여기는 우리 황지중앙초등학교야.', '교문 옆 노란 꽃이 우리 학교 꽃, 개나리야.', '남쪽 길로 가면 황부자 전설 이야기 길이 있어!'],
  hj_playground: ['미끄럼틀 타러 갈래? 슝~!', '만국기가 펄럭펄럭! 운동회 날 같지?'],
  hj_pond: ['여기가 황지연못! 낙동강 1,300리가 시작되는 곳이야.', '하루에 물이 5,000톤이나 솟아난대!', '저 며느리상에는 슬픈 전설이 있어.'],
  hj_claw: ['인형뽑기 딱 한 번만…!', '뽑기는 조금만! 우리 약속해.'],
  hj_library: ['산소드림도서관은 밤 10시까지 열어!', '금요일은 쉬는 날, 월요일에는 열어.'],
  lg_hwangbuja: ['이 길을 따라 걸으면 황부자 이야기가 펼쳐져.', '욕심 부리지 말고 나누라는 이야기야.'],
  tb_cheonjedan: ['태백산 꼭대기의 천제단이야. 하늘에 제사를 지냈대.', '개천절에는 여기서 천제를 지내!'],
  lg_danjong: ['단종 임금님이 흰 말을 타고 태백산 산신이 되셨대.', '추익한은 산머루를 따서 바쳤대.'],
  fv_snow: ['태백산 눈축제야! 눈으로 만든 용 봤어?', '눈조각은 밤 10시까지 불을 밝혀.'],
  gd_flowers: ['금대봉 야생화 동산이야. 꽃은 눈으로만 보기!', '얼레지랑 노랑무늬붓꽃은 귀한 꽃이래.'],
  fv_azalea: ['태백산 철쭉제! 늦봄이면 능선이 분홍색이 돼.', '하얀 함박꽃은 태백시의 꽃이야.'],
  gd_geomnyong: ['검룡소는 한강이 시작되는 샘이야.', '하루에 2,000톤이 넘는 물이 솟는대!'],
  lg_geomnyong: ['서해에서 온 이무기가 이 물길을 거슬러 올라왔대!', '바위에 꿈틀꿈틀 패인 자국이 보여?'],
  fv_sunflower: ['해바라기 축제에 온 걸 환영해! 백만 송이래.', '여기는 원래 배추밭이었대.', '풍력발전기랑 해바라기, 멋지지?'],
  mb_cabbage: ['고랭지 배추는 시원한 바람에 아삭아삭 자라.', '해발 1,300m 배추밭이야!'],
  ch_mine: ['옛날 태백에는 탄광이 50곳도 넘었어.', '탄차에 석탄을 가득 싣고 달렸대.'],
  lg_gumunso: ['백룡과 청룡이 낙동강을 두고 다퉜대!', '백룡이 바위를 뚫어서 구문소가 생겼어.'],
  ch_gumunso: ['구문소 돌벽에는 삼엽충 화석이 있어!', '열목어는 차갑고 맑은 물에서만 살아.'],
  fv_maple_gate: ['철암 단풍 축제야! 단풍잎 하나 주워 갈래?', '단풍길을 일자로 쭉 걸어 봐!'],
};
const SEASON_TALK = {
  heartland: '가을 냄새가 나! 걸어서 한 바퀴 돌면 겨울, 봄, 여름을 지나 또 가을이 와.',
  snow: '여기는 겨울 태백산이야. 발 시려, 꽁꽁!',
  blossom: '봄이야! 금대봉에 꽃이 가득 피었어.',
  desert: '여름 매봉산이야. 태백은 여름에도 시원해!',
  pinewood: '철암의 가을이야. 단풍이 빨갛게 물들었어.',
};
const WEATHER_TALK = {
  clear: '날씨 정말 맑다!', cloudy: '구름이 몽글몽글 많아졌어.', drizzle: '보슬보슬 비가 와. 우산 있어?',
  shower: '소나기다! 금방 그칠 거야.', fog: '안개 때문에 앞이 잘 안 보여. 천천히 가자.', sea: '와, 구름바다 운해야! 하늘 위를 걷는 것 같아.',
  windy: '바람이 세서 풍력발전기가 쌩쌩 돌아!', snow: '눈이 사뿐사뿐 내려.', heavysnow: '함박눈이야! 눈사람 만들자!',
  blizzard: '눈보라가 몰아쳐! 꼭 붙어 다니자.', rime: '나뭇가지에 하얀 상고대가 피었어!', petals: '꽃비가 내려~', leaves: '낙엽이 바람에 춤을 춰!',
};

// ---- legends --------------------------------------------------------------------------------------------------------
export const LEGENDS = {
  lg_hwangbuja: { title: '황지연못 전설 · 황부자와 며느리', scenes: [
    '옛날 황지에 욕심 많은 황부자가 살았어요. 시주를 청하는 스님에게 쌀 대신 쇠똥을 퍼 주었지요.',
    '착한 며느리는 몰래 쌀 한 바가지를 스님께 드리며 시아버지 대신 용서를 빌었어요.',
    '"나를 따라오되 절대 뒤돌아보지 마시오." 아기를 업고 따라가던 며느리는 천둥소리에 그만 뒤를 돌아보았어요.',
    '며느리는 돌이 되었고 황부자의 집은 땅속으로 꺼져 연못이 되었대요. 그곳이 바로 황지연못이에요.',
  ] },
  lg_geomnyong: { title: '검룡소 전설 · 용이 되고 싶은 이무기', scenes: [
    '옛날 서해 바다에 용이 되고 싶은 이무기 "검룡"이 살았어요.',
    '검룡은 한강 물줄기를 거슬러 헤엄쳐 올라왔어요. 아주아주 먼 길이었지요.',
    '마지막 좁은 바위 골짜기를 오르려고 몸부림친 자국이 지금도 꿈틀꿈틀 패여 있대요.',
    '검룡이 머문 샘이 바로 한강이 시작되는 검룡소! 하루 2,000톤이 넘는 물이 솟아나요.',
  ] },
  lg_gumunso: { title: '구문소 전설 · 백룡과 청룡', scenes: [
    '황지천에는 백룡이, 철암천에는 청룡이 높은 돌벽을 사이에 두고 살았어요.',
    '두 용은 낙동강을 차지하려고 날마다 돌벽 위에서 싸웠지만 승부가 나지 않았어요.',
    '꾀를 낸 백룡이 돌벽 아래를 뚫고 들어가 청룡을 이겼대요!',
    '그때 뚫린 구멍이 구문소의 돌문이에요. 백룡은 하늘로 올라갔대요.',
  ] },
  lg_danjong: { title: '태백산 전설 · 산신이 된 단종', scenes: [
    '어린 임금 단종은 영월 땅으로 쫓겨나 강물을 바라보며 지냈어요.',
    '단종이 세상을 떠난 뒤, 흰 말을 타고 태백산으로 향하는 모습을 본 사람이 있었대요.',
    '충신 추익한은 산머루를 따서 단종께 바쳤다고 전해져요.',
    '단종은 태백산의 산신이 되어 산을 지킨대요. 천제단 아래에는 단종비각이 있어요.',
  ] },
};

// ---- 도감 -------------------------------------------------------------------------------------------------------------
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
  ch_maples: ['철암 단풍 군락', '가을이면 숲이 빨강·주황·노랑으로 물들어요.'],
  mb_wind: ['매봉산 바람의 언덕', '하얀 풍력발전기가 바람을 받아 빙글빙글!'],
  mb_cabbage: ['고랭지 배추밭', '해발 1,300m, 구름 가까이 펼쳐진 배추밭.'],
  mb_sunflower: ['구와우 해바라기', '여름이면 해바라기가 키보다 크게 자라요.'],
  mb_samsu: ['삼수령', '빗물이 한강·낙동강·오십천으로 나뉘는 고개.'],
  tb_cheonjedan: ['태백산 천제단', '산꼭대기에서 하늘에 제사를 지내던 돌 제단.'],
  tb_yew: ['태백산 주목 군락', '살아 천년 죽어 천년, 태백시의 나무 주목!'],
  gd_geomnyong: ['검룡소', '한강이 시작되는 샘. 하루 2,000톤이 솟아요.'],
  gd_flowers: ['금대봉 야생화', '얼레지, 노랑무늬붓꽃… 귀한 꽃들의 동산.'],
  gd_azalea: ['철쭉과 함박꽃', '하얀 함박꽃은 태백시의 꽃이에요.'],
  fv_sunflower: ['태백 해바라기 축제', '여름 구와우마을에 백만 송이 해바라기가 피어요.'],
  fv_snow: ['태백산 눈축제', '겨울마다 눈조각이 가득! 밤 10시까지 불이 켜져요.'],
  fv_azalea: ['태백산 철쭉제', '늦봄, 태백산 능선이 분홍 철쭉으로 물들어요.'],
  fv_maple_gate: ['철암 단풍 축제', '철암역 가까운 단풍 군락지가 빨갛게 물들어요.'],
  fv_maple_lane: ['단풍길', '빨간 단풍과 노란 은행나무 사이를 일자로 걸어 보세요.'],
  lg_hwangbuja: ['황부자 전설 길', '욕심쟁이 황부자와 착한 며느리 이야기.'],
  lg_geomnyong: ['검룡소 전설 길', '용이 되고 싶었던 이무기 이야기.'],
  lg_gumunso: ['구문소 전설 길', '바위를 뚫은 백룡 이야기.'],
  lg_danjong: ['단종 전설 길', '태백산 산신이 된 어린 임금 이야기.'],
};
const DEX_IDS = Object.keys(DEX);
export const CREATURES = {
  an_lenok: ['🐟 열목어', '천연기념물! 아주 차갑고 맑은 물에서만 살아요.'],
  fish_kumgang: ['🐟 금강모치', '우리나라에만 사는 물고기. 차가운 계곡물을 좋아해요.'],
  fish_beodeul: ['🐟 버들치', '태백 계곡에서 가장 흔히 만나는 물고기예요.'],
  fish_dukjung: ['🐟 둑중개', '머리가 넓적한 물고기. 차가운 물 바닥에 살아요.'],
  fish_miyugi: ['🐟 미유기', '우리나라에만 사는 메기 친구. 밤에 나와요.'],
  bird_jay: ['🐦 어치', '태백시의 새! 다른 새 소리를 흉내 내요.'],
  bird_dipper: ['🐦 물까마귀', '계곡 물속을 걸어 다니며 먹이를 찾는 새예요.'],
  bird_mandarin: ['🐦 원앙', '천연기념물! 수컷은 주황빛 깃털이 화려해요.'],
  bird_scops: ['🦉 소쩍새', '천연기념물! 밤에 "소쩍 소쩍" 울어요.'],
  bird_woodpecker: ['🐦 큰오색딱다구리', '나무를 콕콕 두드려 벌레를 찾아요.'],
};
const CREATURE_IDS = Object.keys(CREATURES);
const SEASON_ICON = { heartland: '🍂', snow: '❄️', blossom: '🌸', desert: '☀️', pinewood: '🍁' };

const CSS = `
.hj-ui { position: fixed; pointer-events: none; user-select: none; z-index: 5;
  font-family: 'Jua', 'BM JUA_TTF', 'BM JUA_OTF', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #4a3424; }
.hj-bubble { left: 0; top: 0; max-width: min(320px, 72vw); padding: 9px 14px 10px; border-radius: 14px;
  background: #fbf6ea; border: 2px solid #c9a77c; box-shadow: 0 3px 0 rgba(120, 84, 50, 0.25), 0 8px 18px rgba(30, 18, 8, 0.25);
  font-size: 16px; line-height: 1.35; opacity: 0; transition: opacity 0.25s ease; will-change: transform; }
.hj-bubble.on { opacity: 1; }
.hj-bubble b { display: block; font-size: 13px; color: #b0643c; margin-bottom: 2px; letter-spacing: 0.04em; }
.hj-bubble i { display: block; margin-top: 4px; font-style: normal; font-size: 11px; color: #a08060; letter-spacing: 0.06em; }
.hj-bubble::after { content: ''; position: absolute; left: 50%; bottom: -9px; margin-left: -8px; width: 14px; height: 14px;
  background: #fbf6ea; border-right: 2px solid #c9a77c; border-bottom: 2px solid #c9a77c; transform: rotate(45deg); }
.hj-note { left: 50%; top: 4.5vh; transform: translate(-50%, -12px); max-width: min(520px, 88vw); padding: 10px 18px 11px;
  border-radius: 10px; background: #fbf6ea; border: 2px dashed #c9a77c; text-align: center; font-size: 15px; line-height: 1.4;
  box-shadow: 0 6px 18px rgba(30, 18, 8, 0.3); opacity: 0; transition: opacity 0.5s ease, transform 0.5s ease; }
.hj-note.on { opacity: 1; transform: translate(-50%, 0); }
.hj-note b { font-size: 18px; color: #8a4a2a; }
.hj-note small { display: block; margin-top: 3px; font-size: 12px; color: #9a7a5a; letter-spacing: 0.08em; }
.hj-season { left: 50%; top: 30vh; transform: translate(-50%, 0) scale(0.96); text-align: center; opacity: 0;
  transition: opacity 0.9s ease, transform 0.9s ease; color: #fff8ec; text-shadow: 0 2px 10px rgba(30, 16, 4, 0.55); }
.hj-season.on { opacity: 1; transform: translate(-50%, 0) scale(1); }
.hj-season b { display: block; font-size: clamp(30px, 5.4vw, 54px); letter-spacing: 0.08em; }
.hj-season span { display: block; margin-top: 6px; font-size: clamp(15px, 2vw, 20px); letter-spacing: 0.12em; }
.hj-badge { left: 14px; top: 12px; padding: 6px 12px 7px; border-radius: 999px; background: rgba(251, 246, 234, 0.86);
  border: 1.5px solid #d6bc94; font-size: 13px; letter-spacing: 0.04em; box-shadow: 0 2px 8px rgba(30, 18, 8, 0.18); }
.hj-badge em { font-style: normal; color: #9a6a40; margin-left: 8px; }
.hj-sky { left: 14px; top: 46px; padding: 5px 11px 6px; border-radius: 8px; background: rgba(251, 246, 234, 0.9);
  border: 1.5px solid #d6bc94; font-size: 13px; opacity: 0; transition: opacity 0.6s ease; }
.hj-sky.on { opacity: 1; }
.hj-story { left: 50%; bottom: 9vh; transform: translate(-50%, 10px); width: min(560px, 90vw); padding: 12px 20px 14px;
  border-radius: 6px; background: #fdf8ee; border: 2px solid #b98e5e; box-shadow: 0 8px 22px rgba(30, 18, 8, 0.35), inset 0 0 0 4px #f1e3c8;
  text-align: center; opacity: 0; transition: opacity 0.6s ease, transform 0.6s ease; }
.hj-story.on { opacity: 1; transform: translate(-50%, 0); }
.hj-story b { display: block; font-size: 15px; color: #8a4a2a; letter-spacing: 0.06em; margin-bottom: 4px; }
.hj-story p { margin: 0; font-size: 17px; line-height: 1.5; }
.hj-story small { display: block; margin-top: 6px; font-size: 12px; color: #a08060; letter-spacing: 0.3em; }
`;

function el(cls) { const d = document.createElement('div'); d.className = 'hj-ui ' + cls; return d; }

export function createNpcs({ animals, world, traveller, camera, weather = null, seed = 0 }) {
  if (typeof document === 'undefined') return { update() {}, sawCreature() {}, dispose() {} };
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const bubble = el('hj-bubble'); const note = el('hj-note'); const season = el('hj-season'); const badge = el('hj-badge');
  const sky = el('hj-sky'); const story = el('hj-story');
  document.body.append(bubble, note, season, badge, sky, story);

  // ---- persistence ----------------------------------------------------------------------------------------------
  const KEY = 'hwangji-dex-' + (seed | 0); const KEY_C = 'hwangji-creatures-' + (seed | 0);
  const load = (k, ok) => { try { return new Set(JSON.parse(localStorage.getItem(k) || '[]').filter((x) => ok[x])); } catch { return new Set(); } };
  const save = (k, set) => { try { localStorage.setItem(k, JSON.stringify([...set])); } catch { /* private mode */ } };
  const found = load(KEY, DEX); const seen = load(KEY_C, CREATURES);

  // ---- notes (one at a time, queued) ------------------------------------------------------------------------------
  const queue = []; let noteT = 0; let gapT = 0;
  function pushNote(title, text, foot) { queue.push([title, text, foot]); }
  function showNext() {
    const [title, text, foot] = queue.shift();
    note.innerHTML = '';
    const b = document.createElement('b'); b.textContent = title;
    const p = document.createElement('div'); p.textContent = text;
    note.append(b, p);
    if (foot) { const s = document.createElement('small'); s.textContent = foot; note.append(s); }
    note.classList.add('on');
    noteT = 5;
  }

  // ---- places, seasons, legends ------------------------------------------------------------------------------------
  let lastCell = ''; let cellModel = ''; let cellZ = 0;
  let ring = ''; let ringT = 0; let seasonT = 0; let badgeRing = '';
  let legend = null; let legendEntry = 0; let legendScene = -1;
  function place() {
    const p = traveller.position;
    const cx = Math.round(p.x / TILE_SIZE); const cz = Math.round(p.z / TILE_SIZE);
    const k = cx + ',' + cz;
    if (k !== lastCell) {
      lastCell = k;
      let cell = null;
      try { cell = world.tileAt(cx, cz); } catch { cell = null; }
      cellModel = (cell && cell.model) || '';
      cellZ = cz * TILE_SIZE;
      if (DEX[cellModel] && !found.has(cellModel)) {
        found.add(cellModel); save(KEY, found);
        const [name, text] = DEX[cellModel];
        pushNote('📖 ' + name, text, `태백 도감 ${found.size} / ${DEX_IDS.length}`);
      }
      // a legend trail: remember which end he came in by (the road runs north-south)
      if (LEGENDS[cellModel]) {
        if (!legend || legend.id !== cellModel) { legend = { id: cellModel, ...LEGENDS[cellModel] }; legendEntry = p.z > cellZ ? 1 : -1; legendScene = -1; }
      } else if (legend) { legend = null; story.classList.remove('on'); }
    }
    if (legend) {
      // progress 0..1 along the road from the end he entered by; four scenes in order whichever way he walks
      const u = Math.min(0.999, Math.max(0, (legendEntry * (p.z - cellZ) + TILE_SIZE / 2) / TILE_SIZE));
      const sc = Math.min(3, Math.floor((1 - u) * 4));
      if (sc !== legendScene) {
        legendScene = sc;
        story.innerHTML = '';
        const b = document.createElement('b'); b.textContent = '📜 ' + legend.title;
        const t = document.createElement('p'); t.textContent = legend.scenes[sc];
        const s = document.createElement('small'); s.textContent = '●'.repeat(sc + 1) + '○'.repeat(3 - sc);
        story.append(b, t, s);
        story.classList.add('on');
      }
    }
    // season ring: announce it once he is a little way inside
    const info = biomeInfo(seed, p.x / TILE_SIZE, p.z / TILE_SIZE);
    if (info.id !== badgeRing) {
      badgeRing = info.id;
      const em = badge.querySelector('em');
      badge.textContent = `${SEASON_ICON[badgeRing] || ''} ${SEASON_OF[badgeRing]} · ${PLACE_OF[badgeRing]}`;
      if (em) badge.appendChild(em);
    }
    // the big banner waits until he is a little way inside the new ring (no flicker on the border)
    if (info.id !== ring && (info.edge > 1.2 || ring === '')) {
      const first = ring === '';
      ring = info.id; ringT = 0;
      if (!first) {
        season.innerHTML = '';
        const b = document.createElement('b'); b.textContent = `${SEASON_ICON[ring] || ''} ${SEASON_OF[ring]}`;
        const s = document.createElement('span'); s.textContent = PLACE_OF[ring];
        season.append(b, s);
        season.classList.add('on');
        seasonT = 3.6;
      }
    }
  }

  // ---- weather -------------------------------------------------------------------------------------------------------
  let skyId = ''; let skyT = 0;
  function skyline() {
    if (!weather) return;
    const w = weather.now();
    const em = badge.querySelector('em') || badge.appendChild(document.createElement('em'));
    em.textContent = `${w.icon} ${w.name}`;
    if (w.id !== skyId) {
      if (skyId) { sky.textContent = `${w.icon} ${w.name} · ${WEATHER_TALK[w.id] || ''}`; sky.classList.add('on'); skyT = 4; }
      skyId = w.id;
    }
  }

  // ---- mascots ------------------------------------------------------------------------------------------------------
  const NEAR = 1.0; const FAR = 1.3;
  const hit = { id: '', x: 0, y: 0, z: 0, d: 0 };
  const _p = new THREE.Vector3();
  let talking = ''; let talkModel = ''; let line = 0; let bx = -1; let by = -1;
  function linesFor(id, model) {
    const m = MASCOTS[id];
    const out = [...(PLACE_TALK[model] || [])];
    if (weather) { const w = weather.now(); if (WEATHER_TALK[w.id]) out.push(WEATHER_TALK[w.id]); }
    if (SEASON_TALK[ring]) out.push(SEASON_TALK[ring]);
    out.push(...m.self);
    return out;
  }
  function say() {
    const m = MASCOTS[talking];
    if (!m) return;
    const lines = linesFor(talking, talkModel);
    bubble.innerHTML = '';
    const b = document.createElement('b'); b.textContent = m.name;
    const t = document.createElement('span'); t.textContent = lines[line % lines.length];
    const i = document.createElement('i'); i.textContent = 'Space 더 이야기하기';
    bubble.append(b, t, i);
    bubble.classList.add('on');
  }
  function onKey(e) {
    if (e.code !== 'Space' || e.repeat || !talking) return;
    e.preventDefault();
    line++;
    say();
  }
  window.addEventListener('keydown', onKey);

  function mascots(dt) {
    if (!animals || !animals.npcNear) return;
    const p = traveller.position;
    const has = animals.npcNear(p.x, p.z, talking ? FAR : NEAR, hit);
    if (!has || (talking && hit.id !== talking && hit.d > NEAR)) {
      if (talking) { talking = ''; bubble.classList.remove('on'); }
      return;
    }
    if (hit.id !== talking) {
      talking = hit.id; line = 0; bx = by = -1;
      let cell = null;
      try { cell = world.tileAt(Math.round(hit.x / TILE_SIZE), Math.round(hit.z / TILE_SIZE)); } catch { cell = null; }
      talkModel = (cell && cell.model) || '';
      say();
    }
    _p.set(hit.x, hit.y + 0.66, hit.z).project(camera);
    if (_p.z > 1) { bubble.classList.remove('on'); return; }
    const sx = (_p.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-_p.y * 0.5 + 0.5) * window.innerHeight;
    const k = bx < 0 ? 1 : Math.min(1, dt * 10);
    bx = bx < 0 ? sx : bx + (sx - bx) * k; by = by < 0 ? sy : by + (sy - by) * k;
    bubble.style.transform = `translate(${bx.toFixed(1)}px, ${by.toFixed(1)}px) translate(-50%, -100%)`;
    if (!bubble.classList.contains('on')) bubble.classList.add('on');
  }

  // ---- creatures (fish leaps report themselves; birds are looked for around him now and then) ------------------------
  function sawCreature(id) {
    if (!CREATURES[id] || seen.has(id)) return;
    seen.add(id); save(KEY_C, seen);
    const [name, text] = CREATURES[id];
    pushNote(name, text, `생물 도감 ${seen.size} / ${CREATURE_IDS.length}`);
  }
  let birdT = 0;
  function birds(dt) {
    birdT -= dt;
    if (birdT > 0 || !animals || !animals.list) return;
    birdT = 1;
    const p = traveller.position;
    for (const a of animals.list()) {
      if (!a.shown || !a.id.startsWith('bird_')) continue;
      const dx = a.x - p.x; const dz = a.z - p.z;
      if (dx * dx + dz * dz < 4.5) sawCreature(a.id);
    }
  }

  function update(dt) {
    place();
    skyline();
    mascots(dt);
    birds(dt);
    if (noteT > 0) { noteT -= dt; if (noteT <= 0) { note.classList.remove('on'); gapT = 0.7; } }
    else if (gapT > 0) gapT -= dt;
    else if (queue.length) showNext();
    if (seasonT > 0) { seasonT -= dt; if (seasonT <= 0) season.classList.remove('on'); }
    if (skyT > 0) { skyT -= dt; if (skyT <= 0) sky.classList.remove('on'); }
    ringT += dt;
  }

  return {
    update,
    /** A fish or bird id was seen (life/fish.js calls this on a leap). */
    sawCreature,
    /** Places of the 도감 found so far (ids of DEX). */
    found: () => [...found],
    dispose() { window.removeEventListener('keydown', onKey); for (const d of [bubble, note, season, badge, sky, story]) d.remove(); style.remove(); },
  };
}
