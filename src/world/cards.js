// OWNER: world agent. Which soft filler cards of a tile model never stand ("thinning", gold pass / shortfall pass).
// One rule for the two places that must agree: world.js (the card stays down) and book.js (its flat print is left out
// of the folded-flat twin, so no print lies on the page with nothing rising from it).
// 황지 페이퍼트레일: two more reasons a card stays down, both decided once before anything is drawn or baked:
//   * road clearing: a decorative card that stands on the middle of a road (bush across the lane, a crate on the
//     street) never rises - world.js computes the set from the prototypes (clearRoads) and hands it to setRoadCleared;
//   * the per-device density: phones thin more soft filler cards (CONFIG.world.cards.thin, set in main.js at boot).
import { CONFIG } from '../core/config.js';
import { MODELS } from '../core/models.js';

/** Soft fillers only: they never block. */
export const THIN_RX = /^(bush|tuft|flowers|fern|desert_flowers|thorn|snowbush|mushrooms)/;

export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

/** 'model/name' of every card that stands in the middle of a road (world.js clearRoads). */
let roadCleared = new Set();
/** Hand over the cards that must stay down because they would stand on a road. Call before tiles rise or bake. */
export function setRoadCleared(set) { roadCleared = set instanceof Set ? set : new Set(set || []); }
/** true: this card of this model was cleared off a road. */
export function isRoadCleared(model, name) { return roadCleared.has(model + '/' + name); }

/**
 * true: the top-level flap `name` ('bush_g10', loader prefix already stripped) of tile model `model` stays down in every
 * cell. Share = CONFIG.world.cards.thin (thinHouse on house tiles); thin: 0 or cards.enabled: false switches it off.
 * Fixed per model + name (it was seeded per cell, which no baked print could follow). Cards cleared off a road
 * (setRoadCleared) always stay down.
 */
export function isThinned(model, name) {
  if (roadCleared.size && roadCleared.has(model + '/' + name)) return true;
  const C = CONFIG.world.cards;
  if (!C || C.enabled === false || !(C.thin > 0) || !THIN_RX.test(name)) return false;
  const tags = MODELS[model] && MODELS[model].tags;
  const rate = ((tags && tags.includes('house') ? C.thinHouse : C.thin) || 0) * 100;
  const k = Math.imul(hashStr(model + '/' + name) ^ 0x9e3779b9, 2654435761) >>> 0;
  return (k >>> 8) % 100 < rate;
}
