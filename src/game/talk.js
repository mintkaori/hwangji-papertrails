// 황지 페이퍼트레일: what the mascots say, and who says it with which voice. Pure data (no DOM, no three), shared by
// game/npcs.js (the speech bubbles) and the recording tool art-src/taebaek/voices/gen_voices.mjs, which records every
// line a mascot can actually say with that mascot's ElevenLabs voice into public/voices/<who>/<hash>.mp3 and lists
// them in public/voices/index.json. Change a line here and record again (the file name is a hash of the words).

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
  npc_dog: { name: '밤이', self: ['멍멍! 이 길 끝까지 같이 가자!', '킁킁, 꽃 냄새가 나.'] },
};

/** What any mascot says about the place (tile model) it stands in. */
export const PLACE_TALK = {
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
  hj_station: ['기차 타고 태백에 오면 여기서 내려!', '역에서 황지연못까지 금방이야.'],
  hj_market: ['황지자유시장이야! 감자전 냄새 맡아 봐.', '1971년부터 있던 시장이래.'],
  hj_mural_a: ['상장동 벽화 봐! 광부 아저씨가 웃고 있어.', '옛날 광부들이 살던 탄광 마을이래.'],
  hj_avenue: ['벚꽃길이야! 꽃잎이 눈처럼 날려.', '갈림길 이정표를 보면 길을 잃지 않아.'],
  mb_wind: ['오르막길 끝에 풍력발전기가 있어!', '바람이 세서 날개가 쌩쌩 돌아.'],
};
export const SEASON_TALK = {
  heartland: '봄이야! 황지동에 벚꽃이 폈어. 바깥으로 걸어가면 여름, 가을, 겨울을 지나 또 봄이 와.',
  snow: '여기는 겨울 태백산이야. 발 시려, 꽁꽁!',
  blossom: '봄이야! 금대봉에 꽃이 가득 피었어.',
  desert: '여름 매봉산이야. 태백은 여름에도 시원해!',
  pinewood: '철암의 가을이야. 단풍이 빨갛게 물들었어.',
};
export const WEATHER_TALK = {
  clear: '날씨 정말 맑다!', cloudy: '구름이 몽글몽글 많아졌어.', drizzle: '보슬보슬 비가 와. 우산 있어?',
  shower: '소나기다! 금방 그칠 거야.', fog: '안개 때문에 앞이 잘 안 보여. 천천히 가자.', sea: '와, 구름바다 운해야! 하늘 위를 걷는 것 같아.',
  windy: '바람이 세서 풍력발전기가 쌩쌩 돌아!', snow: '눈이 사뿐사뿐 내려.', heavysnow: '함박눈이야! 눈사람 만들자!',
  blizzard: '눈보라가 몰아쳐! 꼭 붙어 다니자.', rime: '나뭇가지에 하얀 상고대가 피었어!', petals: '꽃비가 내려~', leaves: '낙엽이 바람에 춤을 춰!',
};

/**
 * Each mascot's voice (ElevenLabs Korean voices on the account) and the tiles it lives on (config/animals.js spawn
 * rows) with their season ring - so the tool records only what that mascot can say: its own lines, its places' lines,
 * its rings' season line and the weather lines of those rings (game/weather.js CLIMATE).
 */
export const VOICES = {
  npc_milk: { voice: 'O2KReOFLpoR65nz6C9Se', label: 'Aria - bright, youthful', homes: { hj_school: 'heartland' } },
  npc_korea: { voice: 'GmxqVpFnArU87xslDhfo', label: 'Minjun - clear, confident', homes: { tb_cheonjedan: 'snow', lg_danjong: 'snow' } },
  npc_monkey: { voice: 'Ir7oQcBXWiq4oFGROCfj', label: 'taemin - playful', homes: { hj_playground: 'heartland' } },
  npc_bunny: { voice: 'Lb7qkOn5hF8p7qfCDH8q', label: 'Annie - cute', homes: { gd_flowers: 'blossom', fv_azalea: 'blossom' } },
  npc_duck: { voice: 'IAETYMYM3nJvjnlkVTKI', label: 'Deok su - lively', homes: { gd_geomnyong: 'blossom', lg_geomnyong: 'blossom' } },
  npc_otter: { voice: '5I7B1di44aCL15NkP0jn', label: 'Kanna - calm, friendly', homes: { lg_hwangbuja: 'heartland', lg_gumunso: 'pinewood', ch_gumunso: 'pinewood' } },
  npc_blob: { voice: 'WqVy7827vjE2r3jWvbnP', label: 'Soo hyun - soft', homes: { hj_pond: 'heartland' } },
  npc_elephant: { voice: 'dnZGOA54w68T7vLLPFTp', label: 'Klamon - warm, friendly', homes: { fv_sunflower: 'desert', mb_cabbage: 'desert' } },
  npc_bear: { voice: 'oZLQ9kHPMuIyd7Ja0YNU', label: 'Sejin - cute', homes: { hj_claw: 'heartland' } },
  npc_cat: { voice: 'lKmpLuKb4TMrZnFZ0EI9', label: 'Ivy - bright, calm', homes: { hj_library: 'heartland', fv_snow: 'snow' } },
  npc_dog: { voice: '70DeQK5Ztp7WmEGGysLT', label: 'Hyun - friendly', homes: { ch_mine: 'pinewood', fv_maple_gate: 'pinewood' } },
};
/** Weather of each season ring (a copy of game/weather.js CLIMATE's kinds, for the recording tool). */
export const RING_WEATHER = {
  heartland: ['clear', 'petals', 'cloudy', 'drizzle', 'shower'],
  snow: ['snow', 'heavysnow', 'blizzard', 'rime', 'clear'],
  blossom: ['clear', 'petals', 'drizzle', 'fog'],
  desert: ['clear', 'windy', 'shower', 'sea', 'cloudy'],
  pinewood: ['clear', 'leaves', 'fog', 'drizzle', 'cloudy'],
};

/** The words to read aloud: stage directions in brackets and ellipses dropped ('' = nothing to say). */
export function spoken(text) {
  return String(text || '').replace(/\([^)]*\)/g, '').replace(/[…~]/g, ' ').replace(/\s+/g, ' ').trim();
}
/** File key of a mascot's line: '<who>/<hash of the words>' (public/voices/<key>.mp3). */
export function voiceKey(id, text) {
  let h = 2166136261;
  const s = spoken(text);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return id.replace(/^npc_/, '') + '/' + (h >>> 0).toString(36);
}
/** Every line mascot `id` can say (see VOICES), as text. */
export function linesOf(id) {
  const v = VOICES[id]; const m = MASCOTS[id];
  if (!v || !m) return [];
  const out = new Set(m.self);
  const rings = new Set(Object.values(v.homes));
  for (const place of Object.keys(v.homes)) for (const l of PLACE_TALK[place] || []) out.add(l);
  for (const r of rings) { if (SEASON_TALK[r]) out.add(SEASON_TALK[r]); for (const w of RING_WEATHER[r] || []) if (WEATHER_TALK[w]) out.add(WEATHER_TALK[w]); }
  return [...out].filter((l) => spoken(l));
}
