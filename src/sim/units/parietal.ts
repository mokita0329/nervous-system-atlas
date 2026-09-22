/**
 * The parietal association cortex — the units that prove a deficit is not always contralateral.
 *
 * Hemispatial neglect comes from the *right* parietal lobe and shows on the left; an ideomotor apraxia comes
 * from the *left* supramarginal gyrus and shows on *both* hands; autotopagnosia comes from the left (or both)
 * parietal lobes and is bilateral. A model that assumed "contralateral" would get all three wrong, so every
 * entry states its own rule: `onlyHemisphere` for which side of the brain produces it, `side` for where it shows.
 */
import type { UnitSource } from '../units.ts';

const SUP = { en: 'Superior parietal lobule', ja: '上頭頂小葉' };
const INF = { en: 'Inferior parietal lobule', ja: '下頭頂小葉' };
const SMG = { en: 'Supramarginal gyrus', ja: '縁上回' };

const NEGLECT = {
  mod: 'cognitive',
  side: 'contra',
  onlyHemisphere: 'r',
  sign: { en: 'Hemispatial neglect of the opposite side', ja: '半側空間無視（対側を無視する）' },
} as const;

const AUTOTOPAGNOSIA = {
  mod: 'cognitive',
  side: 'both',
  onlyHemisphere: 'l',
  sign: { en: 'Autotopagnosia: cannot name or point to body parts, on both sides', ja: '身体部位失認（左右どちらの身体部位も同定できない）' },
} as const;

export const PARIETAL: UnitSource[] = [
  {
    id: 'parietal-superior-l',
    group: SUP,
    name: SUP,
    where: { mesh: 'dkt-superior-parietal-l' },
    carries: [NEGLECT, AUTOTOPAGNOSIA],
    src: { en: 'Superior parietal lobule', ja: '上頭頂小葉' },
  },
  {
    id: 'parietal-inferior-l',
    group: INF,
    name: INF,
    where: { mesh: 'dkt-inferior-parietal-l' },
    carries: [NEGLECT, AUTOTOPAGNOSIA],
    src: { en: 'Inferior parietal lobule (the commonest source of neglect on the right)', ja: '下頭頂小葉（右では無視の最多の原因）' },
  },
  {
    id: 'supramarginal-l',
    group: SMG,
    name: SMG,
    where: { mesh: 'dkt-supramarginal-l' },
    carries: [
      {
        mod: 'cognitive',
        side: 'both',
        onlyHemisphere: 'l',
        sign: { en: 'Ideomotor apraxia of both hands', ja: '観念運動失行（両手に出る）' },
      },
      NEGLECT,
    ],
    src: { en: 'Supramarginal gyrus', ja: '縁上回' },
  },
];
