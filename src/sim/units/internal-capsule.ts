/**
 * The internal capsule, split front to back.
 *
 * The order is the one the corticospinal pathway's own somatotopy states: "internal capsule: face anterior
 * (genu), then arm, then leg", with the thalamocortical sensory fibres behind them and the optic radiation
 * behind those. The windows are y millimetres inside `internal-capsule-l` (which spans y -25 … +21): the genu
 * sits at roughly y = 0, the anterior limb in front of it, the posterior limb behind.
 *
 * This is the part of the brain where a few millimetres change the answer, which is exactly why the unit is
 * a band and not the whole capsule: a small posterior lacune spares the face, an anterior one spares the leg.
 */
import type { UnitSource } from '../units.ts';

const IC = { en: 'Internal capsule', ja: '内包' };
const POST_LIMB = { en: 'Internal capsule, posterior limb', ja: '内包 後脚' };
const CST = { en: 'Lateral corticospinal tract', ja: '外側皮質脊髄路' };

export const INTERNAL_CAPSULE: UnitSource[] = [
  {
    id: 'ic-anterior-limb-l',
    group: IC,
    name: { en: 'Anterior limb', ja: '内包 前脚' },
    where: { mesh: 'internal-capsule-l', y: [2, 21] },
    carries: [
      {
        mod: 'cognitive',
        side: 'none',
        sign: { en: 'Abulia, loss of initiative (frontopontine fibres)', ja: '自発性の低下・無為（前頭橋路）' },
      },
    ],
    src: { en: 'Frontopontine fibres', ja: '前頭橋路' },
  },
  {
    id: 'ic-genu-l',
    group: POST_LIMB,
    name: { en: 'Genu (face)', ja: '内包 膝部（顔）' },
    where: { mesh: 'internal-capsule-l', y: [-4, 4] },
    carries: [
      { mod: 'motor', body: 'face' },
      { mod: 'motor', body: 'bulbar' },
    ],
    src: { en: 'Corticobulbar tract', ja: '皮質延髄路' },
  },
  {
    id: 'ic-arm-l',
    group: POST_LIMB,
    name: { en: 'Posterior limb, arm and hand', ja: '内包 後脚 上肢・手' },
    where: { mesh: 'internal-capsule-l', y: [-11, -3] },
    carries: [
      { mod: 'motor', body: 'arm' },
      { mod: 'motor', body: 'hand' },
    ],
    src: CST,
  },
  {
    id: 'ic-leg-l',
    group: POST_LIMB,
    name: { en: 'Posterior limb, leg and foot', ja: '内包 後脚 下肢・足' },
    where: { mesh: 'internal-capsule-l', y: [-17, -10] },
    carries: [
      { mod: 'motor', body: 'leg' },
      { mod: 'motor', body: 'foot' },
    ],
    src: CST,
  },
  {
    id: 'ic-sensory-l',
    group: POST_LIMB,
    name: { en: 'Posterior limb, sensory fibres', ja: '内包 後脚 後方（感覚）' },
    where: { mesh: 'internal-capsule-l', y: [-22, -15] },
    carries: [
      { mod: 'touch-position', body: 'face' },
      { mod: 'touch-position', body: 'arm' },
      { mod: 'touch-position', body: 'hand' },
      { mod: 'touch-position', body: 'trunk' },
      { mod: 'touch-position', body: 'leg' },
      { mod: 'pain-temp', body: 'hand' },
      { mod: 'pain-temp', body: 'leg' },
    ],
    src: { en: 'Thalamocortical sensory fibres', ja: '視床皮質路（感覚）' },
  },
  {
    id: 'ic-retrolenticular-l',
    group: POST_LIMB,
    name: { en: 'Posterior limb, retrolenticular part (optic radiation)', ja: '内包 後脚 レンズ核後部（視放線）' },
    where: { mesh: 'internal-capsule-l', y: [-25, -20] },
    carries: [
      { mod: 'vision', sign: { en: 'Homonymous hemianopia', ja: '同名半盲' } },
    ],
    src: { en: 'Visual pathway', ja: '視覚路' },
  },
];
