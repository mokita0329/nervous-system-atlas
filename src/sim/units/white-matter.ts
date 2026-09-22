/**
 * The long tracts, as the shapes the atlas already ships.
 *
 * These are HCP1065 population maps — real geometry, not a window I drew — so "the lesion cuts the
 * corticospinal tract" is answered against the tract itself wherever it runs, from the corona radiata to the
 * medulla. They overlap the internal capsule bands on purpose: a capsular lesion should report both the band
 * and the tract, because the band says *which part of the body* and the tract says *what is severed*.
 *
 * A population map is fatter than any one person's tract, so a small lesion beside one can be reported as
 * cutting it. That error is in the data, not in the test, and it is the reason the panel names its source on
 * every line rather than asserting a diagnosis.
 */
import type { BodyPart, UnitSource } from '../units.ts';

const LIMBS: BodyPart[] = ['arm', 'hand', 'trunk', 'leg', 'foot'];
const WHOLE: BodyPart[] = ['face', 'arm', 'hand', 'trunk', 'leg', 'foot'];
const TRACTS = { en: 'Long tracts', ja: '伝導路' };

export const WHITE_MATTER: UnitSource[] = [
  {
    id: 'tract-cst-l',
    group: TRACTS,
    name: { en: 'Corticospinal tract', ja: '皮質脊髄路' },
    where: { mesh: 'tract-corticospinal-l', strict: true },
    carries: LIMBS.map((b) => ({ mod: 'motor' as const, body: b })),
    src: { en: 'Lateral corticospinal tract', ja: '外側皮質脊髄路' },
  },
  {
    id: 'tract-corticobulbar-l',
    group: TRACTS,
    name: { en: 'Corticobulbar tract', ja: '皮質延髄路' },
    where: { mesh: 'tract-corticobulbar-l', strict: true },
    carries: [
      { mod: 'motor', body: 'face' },
      { mod: 'motor', body: 'bulbar' },
    ],
    src: { en: 'Corticobulbar tract', ja: '皮質延髄路' },
  },
  {
    id: 'tract-medial-lemniscus-l',
    group: TRACTS,
    name: { en: 'Medial lemniscus', ja: '内側毛帯' },
    where: { mesh: 'tract-medial-lemniscus-l', strict: true },
    carries: WHOLE.map((b) => ({ mod: 'touch-position' as const, body: b })),
    src: { en: 'Dorsal column–medial lemniscus pathway', ja: '後索–内側毛帯路' },
  },
  {
    id: 'tract-optic-radiation-l',
    group: TRACTS,
    name: { en: 'Optic radiation', ja: '視放線' },
    where: { mesh: 'tract-optic-radiation-l', strict: true },
    carries: [{ mod: 'vision', sign: { en: 'Homonymous hemianopia of the opposite field', ja: '対側の同名半盲' } }],
    src: { en: 'Visual pathway', ja: '視覚路' },
  },
  {
    id: 'tract-dentatorubrothalamic-l',
    group: TRACTS,
    name: { en: 'Dentatorubrothalamic tract', ja: '歯状核赤核視床路' },
    where: { mesh: 'tract-dentatorubrothalamic-l', strict: true },
    carries: [{
      mod: 'motor',
      sign: { en: 'Intention tremor and limb ataxia', ja: '企図振戦・四肢の運動失調' },
    }],
    src: { en: 'Cerebellar outflow', ja: '小脳の遠心路' },
  },
  {
    id: 'tract-arcuate-l',
    group: TRACTS,
    name: { en: 'Arcuate fasciculus', ja: '弓状束' },
    where: { mesh: 'tract-arcuate-fasciculus-l', strict: true },
    carries: [{
      mod: 'cognitive',
      side: 'none',
      onlyHemisphere: 'l',
      sign: { en: 'Conduction aphasia: comprehension and fluency are kept, repetition is not', ja: '伝導失語（理解と流暢さは保たれ、復唱ができない）' },
    }],
    src: { en: 'Conduction aphasia', ja: '伝導失語' },
  },
  {
    id: 'tract-reticulospinal-l',
    group: TRACTS,
    name: { en: 'Reticulospinal tract', ja: '網様体脊髄路' },
    where: { mesh: 'tract-reticulospinal-l', strict: true },
    carries: [{
      mod: 'motor',
      side: 'both',
      sign: { en: 'Loss of postural and proximal tone; part of the spasticity that follows', ja: '姿勢・近位筋の緊張の障害（のちの痙縮に関わる）' },
    }],
    src: { en: 'Reticulospinal tracts', ja: '網様体脊髄路' },
  },
  {
    id: 'tract-thalamic-radiation-superior-l',
    group: TRACTS,
    name: { en: 'Superior thalamic radiation', ja: '上視床放線' },
    where: { mesh: 'tract-thalamic-radiation-superior-l', strict: true },
    carries: WHOLE.map((b) => ({ mod: 'touch-position' as const, body: b })),
    src: { en: 'Thalamocortical sensory fibres', ja: '視床皮質路（感覚）' },
  },
];
