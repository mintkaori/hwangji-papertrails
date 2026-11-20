// 황지 페이퍼트레일: the talking, story and 도감 layer (DOM only - nothing is drawn into the scene). Every word on the
// screen rises in on a soft translucent panel and is blown away by the wind (game/paperui.js).
//  * Opening story (game/intro.js): a short spoken guide to the trip at the top centre when the page opens.
//  * Mascots (life/animals.js species npc_*): walk up to one and it waves (animals.js) and its words rise above it,
//    read aloud in its own voice (game/talk.js, public/voices): what it says about the place it stands in; Space hears
//    more (the place, the weather, the season, itself).
//  * Season title: entering a new season ring shows its name; the corner line keeps season, place and weather.
//  * Weather (game/weather.js): a short line when the sky changes.
//  * Legend trails (lg_* tiles): walking the road through one tells the tale scene by scene.
//  * 도감 (B or the button, bottom centre): coming close to a place, festival or legend, a fish leaping or a bird
//    near him, a flock passing right overhead and walking up to a friend (CONTACT) the first time pops a picture card
//    out of it that flies into the book, and leaves a line of narration; the book keeps the picture, the short line
//    and the long story of each. Kept per seed in localStorage (when it is available).
import * as THREE from 'three';
import { TILE_SIZE } from '../core/config.js';
import { biomeInfo, SEASON_OF, PLACE_OF } from '../core/biomes.js';
import { bus } from '../core/events.js';
import { createPaperUI } from './paperui.js';
import { createIntro } from './intro.js';
import { MASCOTS, PLACE_TALK, SEASON_TALK, WEATHER_TALK, voiceKey } from './talk.js';

// ---- the mascots: their lines and voices live in game/talk.js (shared with the recording tool) ---------------------
export { MASCOTS };

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

// ---- 도감 ---------------------------------------------------------------------------------------------------------------
// id: [name, short line (the narration), long story (the book), picture sprite]. Pictures are cut from the art atlas
// (atlas.json sprites) or, with a 'a:' prefix, from the animal sheet (animals.json, the stand pose).
export const DEX = {
  // 봄 · 황지동·상장동 (the start)
  hj_school: ['황지중앙초등학교', '1963년에 문을 연 우리 학교! 교화는 개나리, 교목은 향나무.',
    '황지동 한가운데에 있는 우리 학교예요. 교문 옆에는 학교 꽃 개나리가 노랗게 피고, 넓은 운동장에서는 한마음가족운동회가 열려요.\n학교에서 동쪽으로 조금만 걸으면 황지연못이 나와요.', 'school_front'],
  hj_playground: ['우리 학교 운동장', '미끄럼틀과 만국기가 있는 넓은 운동장.', '체육 시간과 운동회 날이면 친구들 웃음소리로 가득한 운동장이에요. 미끄럼틀 위에서 보면 황지동이 한눈에 보여요.', 'hj_slide'],
  hj_pond: ['황지연못', '하루 5,000톤의 물이 솟아 낙동강 1,300리가 시작돼요.',
    '낙동강이 시작되는 연못이에요. 상지·중지·하지 세 연못으로 이루어져 있고, 상지 남쪽의 깊은 수굴에서 하루 약 5,000톤의 맑고 차가운 물이 솟아나요. 연못 가운데 물이 동그랗게 퍼지는 곳을 찾아보세요!\n욕심쟁이 황부자의 집이 땅속으로 꺼져 연못이 되었다는 전설과 돌이 된 며느리 이야기가 전해져요.', 'hj_statue'],
  hj_daiso: ['다이소 태백황지점', '황지연못 건너편, 문구와 만들기 재료가 가득!', '공책, 색종이, 만들기 재료까지 없는 게 없는 가게예요. 방과 후에 친구들과 들르기 좋아요.', 'daiso_front'],
  hj_claw: ['황지로 인형뽑기', '방과 후 인기 장소. 뽑기는 조금만, 약속!', '알록달록 인형이 가득한 가게예요. 용돈은 아껴 쓰기! 한 번만 해 보고 다음에 또 와요.', 'claw_front'],
  hj_library: ['태백산소드림도서관', '밤 10시까지 불이 켜진 도서관. 금요일은 쉬어요.', '책을 읽다 보면 시간 가는 줄 모르는 도서관이에요. 밤 10시까지 불이 켜져 있고, 금요일은 쉬는 날이에요.', 'library_front'],
  hj_station: ['태백역', '기차를 타고 태백에 오면 처음 만나는 역.', '기차를 타고 태백에 오면 처음 만나는 역이에요. 역에서 황지연못과 황지자유시장까지 걸어서 금방이에요.', 'hj_station_front'],
  hj_market: ['황지자유시장', '1971년에 문을 연 태백의 전통시장.',
    '1971년에 문을 연 전통시장으로 가게가 170곳쯤 있어요. 고원에서 자란 나물과 버섯, 동해에서 온 생선이 있고, 감자전·감자떡·옹심이 칼국수 같은 먹거리도 가득해요.\n황지연못에서 걸어서 2분이면 와요.', 'hj_market_gate'],
  hj_mural_a: ['상장동 탄광이야기 마을', '광부 아빠들의 이야기가 담긴 벽화 마을.',
    '옛날 함태탄광과 동해산업에서 일하던 광부 4,000여 명이 살던 사택 마을이에요. 2011년부터 마을 사람들이 직접 골목마다 벽화를 그렸어요.\n광부의 도시락, 탄차, 연탄, 별빛 아래 퇴근길… 벽마다 탄광 마을의 이야기가 있어요.', 'hj_mural_miner'],
  hj_avenue: ['황지 벚꽃길', '봄이면 연분홍 벚꽃이 줄지어 피는 큰길.', '우리 동네를 동서로 가로지르는 큰길이에요. 서쪽은 상장동 벽화마을, 동쪽은 황지연못과 자유시장, 태백역이에요. 갈림길 이정표를 보면 길을 잃지 않아요.', 'hj_cherry'],
  // 여름 · 매봉산
  mb_wind: ['매봉산 바람의 언덕', '하얀 풍력발전기가 바람을 받아 빙글빙글!', '해발 1,300m 고원 언덕에 하얀 풍력발전기가 줄지어 서 있어요. 바람이 세게 불면 날개가 빙글빙글 돌며 전기를 만들어요. 언덕 꼭대기까지 오르막길을 올라 보세요!', 'mb_turbine_pole'],
  mb_cabbage: ['고랭지 배추밭', '해발 1,300m, 구름 가까이 펼쳐진 배추밭.', '높고 서늘한 곳에서 기르는 배추예요. 여름에도 시원해서 아삭하고 단단한 배추가 자라요.', 'mb_cabbage'],
  mb_sunflower: ['구와우 해바라기', '여름이면 해바라기가 키보다 크게 자라요.', '황지동 구와우마을 언덕에 해바라기가 가득 피어요. 여름이면 사람 키보다 큰 해바라기 사이를 걸을 수 있어요.', 'mb_sunflower'],
  mb_samsu: ['삼수령', '빗물이 한강·낙동강·오십천으로 나뉘는 고개.', '하늘에서 내린 빗물이 이 고개에서 나뉘어 한강, 낙동강, 오십천으로 흘러가요. 세 물길이 갈라지는 고개라서 삼수령이에요.', 'mb_samsu'],
  // 가을 · 철암
  ch_kkachibal: ['철암 까치발 건물', '하천 위에 기둥을 세워 지은 탄광촌 집.', '탄광이 번성하던 시절, 집 지을 땅이 모자라 하천 위로 기둥(까치발)을 세워 넓힌 집들이에요. 지금은 철암탄광역사촌으로 남아 그때 이야기를 들려줘요.', 'kkachibal_front'],
  ch_coal: ['철암역두 선탄시설', '우리나라 첫 무연탄 선탄시설.', '캐낸 석탄을 고르고 씻던 시설이에요. 1930년대에 지어진 우리나라 첫 무연탄 선탄시설로, 문화유산으로 지정되어 있어요.', 'coal_plant'],
  ch_mine: ['탄광 갱도', '1960~80년대 태백에는 탄광이 50곳이 넘었어요.', '땅속 깊이 굴을 파서 석탄을 캐던 곳이에요. 광부들은 불이 켜진 안전모를 쓰고 일했고, 캐낸 석탄은 탄차에 싣고 밖으로 나왔어요.', 'mine_entrance'],
  ch_gumunso: ['구문소', '강물이 산을 뚫고 지나간 돌문. 삼엽충 화석도!', '강물이 산을 뚫고 지나가며 생긴 커다란 돌문이에요. 주변 바위에서는 아주 먼 옛날 바다에 살던 삼엽충 화석이 나와요. 백룡과 청룡의 전설이 전해져요.', 'gumunso'],
  ch_maples: ['철암 단풍 군락', '가을이면 숲이 빨강·주황·노랑으로 물들어요.', '철암역 가까운 산비탈의 단풍 숲이에요. 가을이면 빨강, 주황, 노랑으로 물들고 단풍 축제가 열려요.', 'fv_maple_red'],
  // 겨울 · 태백산
  tb_cheonjedan: ['태백산 천제단', '산꼭대기에서 하늘에 제사를 지내던 돌 제단.', '태백산 꼭대기(해발 약 1,560m)에 돌을 쌓아 만든 제단이에요. 높이 3m, 둘레 27m쯤 되고, 해마다 개천절에 하늘에 제사(천제)를 지내요.\n가파른 오르막길을 끝까지 올라야 만날 수 있어요.', 'cheonjedan'],
  tb_yew: ['태백산 주목 군락', '살아 천년 죽어 천년, 주목!', '"살아 천년, 죽어 천년"이라 불리는 주목이 모여 사는 숲이에요. 겨울에는 가지마다 하얀 상고대가 피어요.', 'tb_yew'],
  // 봄 · 금대봉
  gd_geomnyong: ['검룡소', '한강이 시작되는 샘. 하루 2,000톤이 솟아요.', '514km를 흐르는 한강이 시작되는 샘이에요. 하루 2,000톤이 넘는 물이 솟아 바위를 타고 흘러내려요. 용이 되고 싶었던 이무기 전설이 전해져요.', 'geomnyongso'],
  gd_flowers: ['금대봉 야생화', '얼레지, 노랑무늬붓꽃… 귀한 꽃들의 동산.', '봄부터 여름까지 얼레지, 노랑무늬붓꽃 같은 귀한 야생화가 피는 곳이에요. 꽃은 눈으로만 보고 꺾지 않기로 약속해요.', 'gd_wildflowers'],
  gd_azalea: ['철쭉과 함박꽃', '하얀 함박꽃은 태백시의 꽃이에요.', '늦봄에는 연분홍 철쭉이, 초여름에는 하얀 함박꽃이 피어요.', 'gd_azalea'],
};
export const FESTIVALS = {
  fv_sunflower: ['태백 해바라기 축제', '여름 구와우마을에 해바라기가 가득!', '여름에 구와우마을 언덕에서 열리는 축제예요. 해바라기 백만 송이 너머로 풍력발전기가 보이는 멋진 풍경을 만날 수 있어요.', 'fv_arch_sunflower'],
  fv_snow: ['태백산 눈축제', '겨울마다 눈조각이 가득! 밤에는 불빛이 반짝.', '겨울마다 태백산과 시내 곳곳에서 열리는 눈축제예요. 커다란 눈조각과 눈썰매가 가득하고, 밤에는 눈조각에 불빛이 켜져요.', 'fv_arch_snowfest'],
  fv_azalea: ['태백산 철쭉제', '늦봄, 능선이 분홍 철쭉으로 물들어요.', '늦봄에 태백산 능선이 분홍 철쭉으로 물드는 때에 열리는 축제예요.', 'fv_arch_azalea'],
  fv_maple_gate: ['철암 단풍 축제', '탄광 마을과 붉은 단풍이 어우러져요.', '가을에 철암 단풍 군락지에서 열리는 축제예요. 탄광 마을의 옛 풍경과 붉은 단풍이 함께 어우러져요.', 'fv_arch_maple'],
  fv_maple_lane: ['단풍길', '빨간 단풍과 노란 은행나무 사이를 일자로!', '빨간 단풍나무와 노란 은행나무가 양쪽에 줄지어 선 길이에요. 일자로 쭉 걸으면 가을 속을 걷는 것 같아요.', 'fv_ginkgo'],
};
// legends: the long story is the four scenes of LEGENDS
const LEGEND_DEX = {
  lg_hwangbuja: ['황부자 전설 길', '욕심쟁이 황부자와 착한 며느리 이야기.', 'lg_hb_4'],
  lg_geomnyong: ['검룡소 전설 길', '용이 되고 싶었던 이무기 이야기.', 'lg_gr_2'],
  lg_gumunso: ['구문소 전설 길', '바위를 뚫은 백룡 이야기.', 'lg_gm_3'],
  lg_danjong: ['단종 전설 길', '태백산 산신이 된 어린 임금 이야기.', 'lg_dj_4'],
};
/** Tiles that are part of another entry. */
const ALIAS = { hj_pond_b: 'hj_pond', hj_mural_b: 'hj_mural_a', hj_junction: 'hj_avenue' };
const WHERE = { hj: '🌸 봄 · 황지동·상장동', mb: '☀️ 여름 · 매봉산', ch: '🍁 가을 · 철암', tb: '❄️ 겨울 · 태백산', gd: '🌸 봄 · 금대봉',
  fv_sunflower: '☀️ 여름 · 매봉산', fv_snow: '❄️ 겨울 · 태백산', fv_azalea: '🌸 봄 · 금대봉', fv_maple_gate: '🍁 가을 · 철암', fv_maple_lane: '🍁 가을 · 철암',
  lg_hwangbuja: '🌸 봄 · 황지동', lg_geomnyong: '🌸 봄 · 금대봉', lg_gumunso: '🍁 가을 · 철암', lg_danjong: '❄️ 겨울 · 태백산' };
const whereOf = (id) => WHERE[id] || WHERE[id.slice(0, 2)] || '';

export const CREATURES = {
  an_lenok: ['🐟', '열목어', '천연기념물! 아주 차갑고 맑은 물에서만 살아요.', '눈이 붉게 보여 열목어라고 불러요. 아주 차갑고 맑은 계곡물에서만 사는 천연기념물이에요.', '봄·가을 계곡 물가에서 펄쩍', 'an_lenok'],
  fish_kumgang: ['🐟', '금강모치', '우리나라에만 사는 물고기. 차가운 계곡물을 좋아해요.', '우리나라에만 사는 작은 물고기예요. 차갑고 깨끗한 산골 계곡에서 무리 지어 헤엄쳐요.', '봄·여름·가을 계곡', 'fish_kumgang'],
  fish_beodeul: ['🐟', '버들치', '태백 계곡에서 가장 흔히 만나는 물고기예요.', '맑은 물이라면 어디든 잘 사는 물고기예요. 태백의 냇물과 연못에서 가장 흔히 만날 수 있어요.', '겨울 빼고 어디서나', 'fish_beodeul'],
  fish_dukjung: ['🐟', '둑중개', '머리가 넓적한 물고기. 차가운 물 바닥에 살아요.', '머리가 넓적하고 몸에 얼룩무늬가 있어요. 차가운 물 바닥 돌 틈에 숨어 살아요.', '여름·가을 계곡', 'fish_dukjung'],
  fish_miyugi: ['🐟', '미유기', '우리나라에만 사는 메기 친구. 밤에 나와요.', '우리나라에만 사는 메기 친구예요. 낮에는 돌 밑에 숨어 있다가 밤이 되면 나와요. (N을 눌러 밤으로!)', '밤의 물가', 'fish_miyugi'],
  bird_jay: ['🐦', '어치', '태백시의 새! 다른 새 소리를 흉내 내요.', '태백시를 대표하는 새예요. 다른 새 소리를 흉내 내는 재주가 있고, 도토리를 땅에 묻어 숨겨 두기도 해요.', '숲과 하늘, 사계절', 'fly_jay'],
  bird_dipper: ['🐦', '물까마귀', '계곡 물속을 걸어 다니며 먹이를 찾는 새.', '계곡 물속을 걸어 다니며 먹이를 찾는 신기한 새예요. 온몸이 짙은 갈색이에요.', '강가 돌 위', 'a:bird_dipper'],
  bird_mandarin: ['🐦', '원앙', '천연기념물! 수컷은 주황빛 깃털이 화려해요.', '천연기념물이에요. 수컷은 주황빛 돛 모양 깃털이 화려하고, 산골 냇가와 연못에서 살아요. 황지연못에서도 헤엄쳐요.', '연못과 냇가', 'fly_mandarin'],
  bird_scops: ['🦉', '소쩍새', '천연기념물! 밤에 "소쩍 소쩍" 울어요.', '천연기념물인 작은 올빼미예요. 여름밤 숲에서 "소쩍 소쩍" 하고 울어요.', '밤 숲', 'a:bird_scops'],
  bird_woodpecker: ['🐦', '큰오색딱다구리', '나무를 콕콕 두드려 벌레를 찾아요.', '부리로 나무를 콕콕 두드려 벌레를 찾아요. 머리 위가 빨간 것이 수컷이에요.', '단풍 숲', 'a:bird_woodpecker'],
  bird_oriole: ['🐦', '꾀꼬리', '여름 손님! "꾀꼴꾀꼴" 고운 노래.', '여름에 우리나라에 오는 노란 새예요. "꾀꼴꾀꼴" 맑고 고운 노래를 불러요.', '봄·여름 하늘 (새 떼)', 'fly_oriole'],
  bird_kingfisher: ['🐦', '물총새', '여름 손님! 쏜살같이 물속으로 뛰어들어요.', '여름 철새예요. 물가 나뭇가지에 앉아 있다가 쏜살같이 물속으로 뛰어들어 물고기를 잡아요.', '봄·여름·가을 물가 하늘', 'fly_kingfisher'],
};
const FRIEND_WHERE = {
  npc_milk: '황지중앙초등학교', npc_monkey: '학교 운동장', npc_blob: '황지연못', npc_bear: '인형뽑기 가게', npc_cat: '도서관 · 겨울 눈축제',
  npc_otter: '황부자 전설 길 · 구문소', npc_korea: '태백산 천제단 · 단종 전설 길', npc_bunny: '금대봉 야생화 · 철쭉제', npc_duck: '검룡소',
  npc_elephant: '해바라기 축제 · 배추밭', npc_dog: '탄광 · 철암 단풍 축제',
};
const SEASON_ICON = { heartland: '🌸', snow: '❄️', blossom: '🌸', desert: '☀️', pinewood: '🍁' };
const KIND_ICON = { place: '📖', festival: '🎉', legend: '📜', creature: '🐾', friend: '🧸' };
/** How close he must come before something goes into the 도감 (world units; a tile is TILE_SIZE = 2 across). */
const CONTACT = {
  place: 0.6, // to the middle of the place's tile - or, where a building fills it, as close as the ground lets him ...
  slack: 0.35, // ... plus this much
  bird: 1.1, // a bird sitting on the ground or on the water
  fish: 2.6, // a fish leap (leaps happen 1.1 - 4.7 from him, life/fish.js) ...
  shore: 0.9, // ... while he stands at the water's edge (water within this): the start is 1.4 from 황지연못
  friend: 0.85, // a mascot (it starts talking a little further out, at NEAR)
};

export function createNpcs({ animals, world, traveller, camera, weather = null, seed = 0, sfx = null, intro = true }) {
  if (typeof document === 'undefined') return { update() {}, sawCreature() {}, startIntro() {}, modal: () => false, dispose() {} };
  const sound = (id, gain) => (sfx ? sfx.play(id, gain) : 0);
  const ui = createPaperUI({ sound });
  // a discovery has no box: it is written in by hand (with the sound of a pencil) and blown away by the wind
  const WRITE_STEP = 0.06; // s between two letters being written
  const narr = ui.slot('hj-narr write'); const season = ui.slot('hj-season'); const badge = ui.slot('hj-badge panel');
  narr.el.style.setProperty('--step', Math.round(WRITE_STEP * 1000) + 'ms');
  const sky = ui.slot('hj-sky panel'); const story = ui.slot('hj-story panel'); const bubble = ui.slot('hj-bubble panel');
  const opening = intro ? createIntro({ ui, sfx, voiceFiles: true }) : null; // recorded voice (public/sounds/intro_N.mp3)
  const ATLAS = './textures/art/atlas.webp'; const ANIMALS = './textures/art/animals.png';
  ui.sheet(ATLAS); ui.sheet(ANIMALS);
  let atlasJ = null; let animalsJ = null;
  fetch('./textures/art/atlas.json').then((r) => (r.ok ? r.json() : null)).then((j) => { atlasJ = j; }).catch(() => {});
  fetch('./textures/art/animals.json').then((r) => (r.ok ? r.json() : null)).then((j) => { animalsJ = j; }).catch(() => {});
  function picOf(name) {
    if (!name) return null;
    if (name.startsWith('a:')) {
      const a = animalsJ && animalsJ.animals && animalsJ.animals[name.slice(2)];
      const p = a && a.poses && (a.poses.stand || a.poses[Object.keys(a.poses)[0]]);
      return p ? { src: ANIMALS, rect: [p.x, p.y, p.w, p.h] } : null;
    }
    const s = atlasJ && atlasJ.sprites && atlasJ.sprites[name];
    return s && s.rect ? { src: ATLAS, rect: s.rect } : null;
  }

  // ---- persistence (per seed) ------------------------------------------------------------------------------------
  const KEY = 'hwangji-dex-' + (seed | 0); const KEY_C = 'hwangji-creatures-' + (seed | 0); const KEY_F = 'hwangji-friends-' + (seed | 0);
  const PLACES = { ...DEX, ...FESTIVALS, ...LEGEND_DEX };
  const load = (k, ok) => { try { return new Set(JSON.parse(localStorage.getItem(k) || '[]').filter((x) => ok[x])); } catch { return new Set(); } };
  const save = (k, set) => { try { localStorage.setItem(k, JSON.stringify([...set])); } catch { /* private mode */ } };
  const found = load(KEY, PLACES); const seen = load(KEY_C, CREATURES); const met = load(KEY_F, MASCOTS);
  const TOTAL = Object.keys(PLACES).length + Object.keys(CREATURES).length + Object.keys(MASCOTS).length;
  const count = () => found.size + seen.size + met.size;
  ui.setCount(count(), TOTAL);

  // ---- discoveries: a card flies into the 도감, its name and line are written in by hand and blow away ----------------
  const queue = []; let busy = 0; let gap = 0; let penStop = 0;
  const _p = new THREE.Vector3();
  function screenOf(x, y, z) {
    _p.set(x, y, z).project(camera);
    if (_p.z > 1 || Math.abs(_p.x) > 1.2 || Math.abs(_p.y) > 1.2) return [window.innerWidth / 2, window.innerHeight * 0.45];
    return [(_p.x * 0.5 + 0.5) * window.innerWidth, (-_p.y * 0.5 + 0.5) * window.innerHeight];
  }
  /** A first find: its card (name, picture sprite) pops out of world point `at` and flies into the book. */
  function discover(kind, title, line, at, name, pic) {
    const [sx, sy] = at ? screenOf(at[0], at[1], at[2]) : [window.innerWidth / 2, window.innerHeight * 0.3];
    ui.flyToDex(sx, sy, { name, icon: KIND_ICON[kind], pic: picOf(pic) }, () => ui.setCount(count(), TOTAL));
    if (busy <= 0 && !queue.length) gap = Math.max(gap, 0.35); // the card pops first, then the pen starts
    queue.push([title, line]);
  }
  function narrate(dt) {
    if (busy > 0) { busy -= dt; if (busy <= 0) { narr.gust(); gap = 1.2; } return; }
    if (gap > 0) { gap -= dt; return; }
    if (!queue.length) return;
    const [title, line] = queue.shift();
    const letters = narr.show([{ text: title, cls: 't' }, { text: line }]);
    const writing = letters * WRITE_STEP + 0.25; // the last letter is inked in by then
    // the pencil scratches while the letters are written, and lifts off when the line is done
    if (sfx && sfx.play('write') > 0) { clearTimeout(penStop); penStop = setTimeout(() => sfx.stop('write', 0.3), writing * 1000); }
    busy = writing + 2.8; // time to read it, then the wind takes it
  }

  // ---- places, seasons, legends ------------------------------------------------------------------------------------
  let lastCell = ''; let cellModel = ''; let cellZ = 0;
  let ring = ''; let badgeText = ''; let badgeT = 0;
  let legend = null; let legendEntry = 0; let legendScene = -1; let storyT = 0;
  let near = null; // the 도감 place of the tile he is in, until he has come close to it: { id, x, z, reach }
  /** How close to the middle of tile (cx, cz) he must come: as close as the ground allows (a building may stand there). */
  function reachOf(cx, cz, p) {
    const x0 = cx * TILE_SIZE; const z0 = cz * TILE_SIZE; const step = TILE_SIZE / 20;
    let best = Math.hypot(p.x - x0, p.z - z0); // where he stands is open ground
    for (let i = -10; i <= 10; i++) {
      for (let j = -10; j <= 10; j++) {
        const d = Math.hypot(i * step, j * step);
        if (d >= best) continue;
        let ok = false;
        try { ok = world.isWalkable(x0 + i * step, z0 + j * step); } catch { ok = false; }
        if (ok) best = d;
      }
    }
    return Math.max(CONTACT.place, best + CONTACT.slack);
  }
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
      const id = ALIAS[cellModel] || cellModel;
      near = PLACES[id] && !found.has(id) ? { id, x: cx * TILE_SIZE, z: cz * TILE_SIZE, reach: reachOf(cx, cz, p) } : null;
      // a legend trail: remember which end he came in by (the road runs north-south)
      if (LEGENDS[cellModel]) {
        if (!legend || legend.id !== cellModel) { legend = { id: cellModel, ...LEGENDS[cellModel] }; legendEntry = p.z > cellZ ? 1 : -1; legendScene = -1; }
      } else if (legend) { legend = null; story.gust(); }
    }
    // a 도감 place goes into the book once he has come close to it, not as soon as he steps onto its tile
    if (near) {
      const dx = p.x - near.x; const dz = p.z - near.z;
      if (dx * dx + dz * dz <= near.reach * near.reach) {
        const id = near.id;
        near = null;
        if (!found.has(id)) {
          found.add(id); save(KEY, found);
          const kind = FESTIVALS[id] ? 'festival' : LEGEND_DEX[id] ? 'legend' : 'place';
          const pic = LEGEND_DEX[id] ? LEGEND_DEX[id][2] : PLACES[id][3];
          const hx = (cx * TILE_SIZE + p.x) / 2; const hz = (cz * TILE_SIZE + p.z) / 2; // between him and the middle of the place
          discover(kind, PLACES[id][0], PLACES[id][1], [hx, (world.heightAt ? world.heightAt(hx, hz) : 0) + 0.55, hz], PLACES[id][0], pic);
        }
      }
    }
    if (legend) {
      // progress 0..1 along the road from the end he entered by; four scenes in order whichever way he walks
      const u = Math.min(0.999, Math.max(0, (legendEntry * (p.z - cellZ) + TILE_SIZE / 2) / TILE_SIZE));
      const sc = Math.min(3, Math.floor((1 - u) * 4));
      if (sc !== legendScene) {
        const first = legendScene < 0;
        legendScene = sc;
        // the old page blows away first, then the next scene rises in
        if (!first) story.gust();
        storyT = first ? 0.01 : 0.75;
      }
    }
    // season ring: the corner badge always, the big title once he is a little way inside the new ring
    const info = biomeInfo(seed, p.x / TILE_SIZE, p.z / TILE_SIZE);
    const w = weather ? weather.now() : null;
    const want = `${SEASON_ICON[info.id] || ''} ${SEASON_OF[info.id]} · ${PLACE_OF[info.id]}${w ? `   ${w.icon} ${w.name}` : ''}`;
    if (want !== badgeText) { badgeText = want; if (badge.shown) { badge.gust(); badgeT = 0.85; } else badgeT = 0.01; }
    if (info.id !== ring && (info.edge > 1.2 || ring === '')) {
      const first = ring === '';
      ring = info.id;
      if (!first) { season.show([{ text: `${SEASON_ICON[ring] || ''} ${SEASON_OF[ring]}`, cls: 't' }, { text: PLACE_OF[ring], cls: 's' }], 3.4); sound('season'); }
    }
  }
  function storyTick(dt) {
    if (badgeT > 0) { badgeT -= dt; if (badgeT <= 0) badge.show([{ text: badgeText }]); }
    if (storyT <= 0) return;
    storyT -= dt;
    if (storyT > 0 || !legend) return;
    story.show([{ text: '📜 ' + legend.title, cls: 't' }, { text: legend.scenes[legendScene] }, { text: '●'.repeat(legendScene + 1) + '○'.repeat(3 - legendScene), cls: 's' }]);
    sound('page', 0.8);
  }

  // ---- weather -------------------------------------------------------------------------------------------------------
  let skyId = '';
  function skyline() {
    if (!weather) return;
    const w = weather.now();
    if (w.id !== skyId) {
      if (skyId) sky.show([{ text: `${w.icon} ${w.name} · ${WEATHER_TALK[w.id] || ''}` }], 4.2);
      skyId = w.id;
    }
  }

  // ---- mascots ------------------------------------------------------------------------------------------------------
  const NEAR = 1.0; const FAR = 1.3;
  const hit = { id: '', x: 0, y: 0, z: 0, d: 0 };
  let talking = ''; let talkModel = ''; let line = 0; let bx = -1; let by = -1;
  function linesFor(id, model) {
    const m = MASCOTS[id];
    const out = [...(PLACE_TALK[ALIAS[model] || model] || [])];
    if (weather) { const w = weather.now(); if (WEATHER_TALK[w.id]) out.push(WEATHER_TALK[w.id]); }
    if (SEASON_TALK[ring]) out.push(SEASON_TALK[ring]);
    out.push(...m.self);
    return out;
  }
  function say() {
    const m = MASCOTS[talking];
    if (!m) return;
    const lines = linesFor(talking, talkModel);
    const text = lines[line % lines.length];
    bubble.show([{ text: m.name, cls: 't' }, { text }, { text: 'Space 더 이야기하기', cls: 's' }]);
    sound('talk', 0.6);
    if (sfx) sfx.speak(voiceKey(talking, text)); // its own recorded voice (game/talk.js VOICES)
  }
  function onKey(e) {
    if (e.code === 'KeyB' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); toggleBook(); return; }
    if (e.code === 'Escape' && ui.isOpen) { ui.close(); return; }
    if (e.code !== 'Space' || e.repeat || !talking || ui.isOpen) return;
    e.preventDefault();
    line++;
    say();
  }
  window.addEventListener('keydown', onKey);
  ui.button.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); toggleBook(); });

  function mascots(dt) {
    if (!animals || !animals.npcNear) return;
    const p = traveller.position;
    const has = animals.npcNear(p.x, p.z, talking ? FAR : NEAR, hit);
    if (!has || (talking && hit.id !== talking && hit.d > NEAR)) {
      if (talking) { talking = ''; bubble.gust(); if (sfx) sfx.hush(0.35); }
      return;
    }
    if (hit.id !== talking) {
      talking = hit.id; line = 0; bx = by = -1;
      let cell = null;
      try { cell = world.tileAt(Math.round(hit.x / TILE_SIZE), Math.round(hit.z / TILE_SIZE)); } catch { cell = null; }
      talkModel = (cell && cell.model) || '';
      say();
    }
    // a new friend goes into the 도감 once he has walked right up to it
    if (MASCOTS[talking] && !met.has(talking) && hit.id === talking && hit.d <= CONTACT.friend) {
      met.add(talking); save(KEY_F, met);
      discover('friend', `친구 ${MASCOTS[talking].name}`, MASCOTS[talking].self[0], [hit.x, hit.y + 0.4, hit.z], MASCOTS[talking].name, 'a:' + talking);
    }
    _p.set(hit.x, hit.y + 0.7, hit.z).project(camera);
    if (_p.z > 1) return;
    const sx = (_p.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-_p.y * 0.5 + 0.5) * window.innerHeight;
    const k = bx < 0 ? 1 : Math.min(1, dt * 10);
    bx = bx < 0 ? sx : bx + (sx - bx) * k; by = by < 0 ? sy : by + (sy - by) * k;
    // the bubble's tail (10 px under the panel) points at the spot above its head
    bubble.el.style.transform = `translate(${bx.toFixed(1)}px, ${by.toFixed(1)}px) translate(-50%, calc(-100% - 12px))`;
  }

  // ---- creatures (fish leaps and flocks report themselves; perched birds are looked for around him now and then) ------
  /**
   * A fish or bird was seen at (x, z). On the ground or in the water it counts only close to him (CONTACT); a flock
   * passes with its height `y` (life/life.js already only reports flocks that pass right overhead).
   */
  function sawCreature(id, x, z, y) {
    if (!CREATURES[id] || seen.has(id) || !moved) return;
    if (x !== undefined && y === undefined) {
      const p = traveller.position; const dx = x - p.x; const dz = z - p.z;
      const bird = id.startsWith('bird_');
      const r = bird ? CONTACT.bird : CONTACT.fish;
      if (dx * dx + dz * dz > r * r) return;
      if (!bird && !atShore(p.x, p.z)) return;
    }
    seen.add(id); save(KEY_C, seen);
    const c = CREATURES[id];
    const at = x === undefined ? null : [x, y !== undefined ? y : (world.heightAt ? world.heightAt(x, z) : 0) + 0.2, z];
    discover('creature', c[1], c[2], at, c[1], c[5]);
  }
  /** He stands at the water's edge: water within CONTACT.shore of (x, z). */
  function atShore(x, z) {
    if (!world.surfaceAt) return true;
    for (let k = 1; k <= 3; k++) {
      const r = (CONTACT.shore * k) / 3;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        let s = '';
        try { s = world.surfaceAt(x + Math.cos(a) * r, z + Math.sin(a) * r); } catch { s = ''; }
        if (s === 'water') return true;
      }
    }
    return false;
  }
  // nothing living goes into the book before he has taken his first step (the opening is for the story)
  let moved = false;
  const offMoved = bus.once('input:first', () => { moved = true; });
  // a flock of Taebaek birds flew right over him (life/life.js)
  const offBird = bus.on('life:bird', (e) => { if (e && e.id) sawCreature(e.id, e.x, e.z, e.y); });
  let birdT = 0;
  function birds(dt) {
    birdT -= dt;
    if (birdT > 0 || !animals || !animals.list) return;
    birdT = 0.5;
    const p = traveller.position;
    for (const a of animals.list()) {
      if (!a.shown || !a.id.startsWith('bird_')) continue;
      const dx = a.x - p.x; const dz = a.z - p.z;
      if (dx * dx + dz * dz < CONTACT.bird * CONTACT.bird) sawCreature(a.id, a.x, a.z);
    }
  }

  // ---- the book -----------------------------------------------------------------------------------------------------
  function bookData() {
    const ent = (id, name, icon, short, detail, where, pic, known) => ({ id, name, icon, short, detail, where, pic: picOf(pic), known });
    const places = Object.entries(DEX).map(([id, d]) => ent(id, d[0], '📖', d[1], d[2], whereOf(id), d[3], found.has(id)));
    const fests = Object.entries(FESTIVALS).map(([id, d]) => ent(id, d[0], '🎉', d[1], d[2], whereOf(id), d[3], found.has(id)));
    const legends = Object.entries(LEGEND_DEX).map(([id, d]) => ent(id, d[0], '📜', d[1], LEGENDS[id].scenes.join('\n'), whereOf(id), d[2], found.has(id)));
    const creatures = Object.entries(CREATURES).map(([id, c]) => ent(id, c[1], c[0], c[2], c[3], '어디서? ' + c[4], c[5], seen.has(id)));
    const friends = Object.entries(MASCOTS).map(([id, m]) => ent(id, m.name, '🧸', m.self[0], m.self.join('\n'), '만나는 곳: ' + (FRIEND_WHERE[id] || ''), 'a:' + id, met.has(id)));
    return {
      total: TOTAL, found: count(),
      tabs: [{ id: 'place', name: '장소', entries: places }, { id: 'festival', name: '축제', entries: fests }, { id: 'legend', name: '전설', entries: legends },
        { id: 'creature', name: '생물', entries: creatures }, { id: 'friend', name: '친구', entries: friends }],
    };
  }
  function toggleBook() { if (ui.isOpen) ui.close(); else ui.open(bookData()); }

  function update(dt) {
    place();
    storyTick(dt);
    skyline();
    mascots(dt);
    birds(dt);
    narrate(dt);
  }

  return {
    update,
    /** A fish or bird id was seen (life/fish.js calls this on a leap, with where it leapt). */
    sawCreature,
    /** Begin the opening story (main.js, once the page has opened). */
    startIntro() { if (opening) opening.start(); },
    /** The 도감 book is open (the walk waits). */
    modal: () => ui.isOpen,
    /** Places of the 도감 found so far. */
    found: () => [...found],
    dispose() { window.removeEventListener('keydown', onKey); offBird(); offMoved(); if (opening) opening.dispose(); ui.dispose(); },
  };
}
