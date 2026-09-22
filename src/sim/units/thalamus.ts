/**
 * The thalamus, one nucleus at a time.
 *
 * No coordinate windows are needed here: the atlas already ships the nuclei as separate meshes, so a
 * functional unit is exactly one mesh. That is why a thalamic bleed can say which deficits it will produce —
 * sensory from the ventral posterior group, tremor and ataxia from the ventrolateral relay of the cerebellum,
 * amnesia and drowsiness from the mediodorsal nucleus — rather than "the thalamus is involved".
 */
import type { BodyPart, UnitSource } from '../units.ts';

const TH = { en: 'Thalamus', ja: '視床' };
const ALL: BodyPart[] = ['face', 'arm', 'hand', 'trunk', 'leg', 'foot'];

/** The ventral posterior group is the sensory relay for the whole opposite half of the body. */
const sensory = ALL.flatMap((b) => [
  { mod: 'touch-position' as const, body: b },
  { mod: 'pain-temp' as const, body: b },
]);

const THALAMIC_PAIN = {
  mod: 'pain-temp',
  sign: { en: 'Thalamic pain: a burning, delayed pain over the same half of the body', ja: '視床痛（遅れて出る、焼けるような半身の痛み）' },
} as const;

export const THALAMUS: UnitSource[] = [
  {
    id: 'thal-vp-l',
    group: TH,
    name: { en: 'Ventral posterior nucleus (VPL/VPM)', ja: '視床 後腹側核（VPL/VPM）' },
    where: { mesh: 'thalamus-ventral-posterior-ventrolateral-l' },
    carries: [...sensory, THALAMIC_PAIN],
    src: { en: 'Thalamic syndrome (Dejerine–Roussy)', ja: '視床症候群（Dejerine–Roussy）' },
  },
  {
    id: 'thal-lp-vp-l',
    group: TH,
    name: { en: 'Lateral posterior / ventral posterior group', ja: '視床 外側後核・後腹側核群' },
    where: { mesh: 'thalamus-lateral-posterior-ventral-posterior-l' },
    carries: [...sensory, THALAMIC_PAIN],
    src: { en: 'Thalamic syndrome (Dejerine–Roussy)', ja: '視床症候群（Dejerine–Roussy）' },
  },
  {
    id: 'thal-vl-l',
    group: TH,
    name: { en: 'Ventrolateral nucleus (VL)', ja: '視床 外側腹側核（VL）' },
    where: { mesh: 'thalamus-ventrolateral-l' },
    carries: [{
      mod: 'motor',
      sign: { en: 'Intention tremor and limb ataxia: the cerebellar relay is cut', ja: '企図振戦・四肢の運動失調（小脳からの中継が切れる）' },
    }],
    src: { en: 'Cerebellothalamic relay', ja: '小脳視床路の中継核' },
  },
  {
    id: 'thal-va-l',
    group: TH,
    name: { en: 'Ventral anterior nucleus (VA)', ja: '視床 前腹側核（VA）' },
    where: { mesh: 'thalamus-ventral-anterior-l' },
    carries: [{
      mod: 'motor',
      sign: { en: 'Slow to start a movement; the basal ganglia relay is cut', ja: '運動の開始が遅れる（大脳基底核からの中継が切れる）' },
    }],
    src: { en: 'Pallidothalamic relay', ja: '淡蒼球視床路の中継核' },
  },
  {
    id: 'thal-md-l',
    group: TH,
    name: { en: 'Mediodorsal nucleus (MD)', ja: '視床 背内側核（MD）' },
    where: { mesh: 'thalamus-mediodorsal-l' },
    carries: [{
      mod: 'cognitive',
      side: 'none',
      sign: { en: 'Amnesia, apathy and a fluctuating level of consciousness', ja: '健忘・無為・意識レベルの変動' },
    }],
    src: { en: 'Paramedian thalamic infarction', ja: '傍正中視床梗塞' },
  },
  {
    id: 'thal-pulvinar-l',
    group: TH,
    name: { en: 'Pulvinar', ja: '視床枕' },
    where: { mesh: 'thalamus-pulvinar-l' },
    carries: [{
      mod: 'cognitive',
      sign: { en: 'Inattention to the opposite side of space', ja: '対側空間への注意の低下' },
    }],
    src: { en: 'Pulvinar', ja: '視床枕' },
  },
  {
    id: 'lgn-l',
    group: { en: 'Geniculate bodies', ja: '膝状体' },
    name: { en: 'Lateral geniculate nucleus', ja: '外側膝状体' },
    where: { mesh: 'lateral-geniculate-nucleus-l' },
    carries: [{ mod: 'vision', sign: { en: 'Homonymous hemianopia', ja: '同名半盲' } }],
    src: { en: 'Visual pathway', ja: '視覚路' },
  },
  {
    id: 'mgn-l',
    group: { en: 'Geniculate bodies', ja: '膝状体' },
    name: { en: 'Medial geniculate nucleus', ja: '内側膝状体' },
    where: { mesh: 'medial-geniculate-nucleus-l' },
    carries: [{
      mod: 'cognitive',
      side: 'none',
      sign: { en: 'Hearing is barely affected: above the cochlear nuclei both ears are represented on both sides', ja: '難聴はほとんど出ない（蝸牛神経核より上では両耳が両側に表現されるため）' },
    }],
    src: { en: 'Auditory pathway', ja: '聴覚路' },
  },
];
