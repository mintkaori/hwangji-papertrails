// FROZEN contract (owner: orchestrator): what counts as progress in Pop-up Atlas.
// SCRAPS: small paper collectables lying on the page, one kind per biome plus a rare night-only one.
export const SCRAPS = {
  leaf: { biome: 'heartland', name: '개나리 꽃잎' },
  shell: { biome: 'desert', name: '바람개비 종이' },
  snowflake: { biome: 'snow', name: '태백산 눈꽃' },
  petal: { biome: 'blossom', name: '금대봉 꽃잎' },
  feather: { biome: 'pinewood', name: '어치 깃털' },
  star: { biome: null, name: '태백 은하수 별', night: true },
};
export const SCRAP_IDS = Object.keys(SCRAPS);
