/**
 * The central gyri, split along the homunculus.
 *
 * The windows are read off the somatotopy already authored for the corticospinal and dorsal-column pathways
 * ("cortex: leg medial, arm and face lateral") and pinned to the usual MNI landmarks — the hand knob near
 * (-38, -22, 56), the face at (-50, -10, 38), the foot on the medial surface in the paracentral lobule.
 * Bands deliberately overlap: the homunculus has no borders, and a lesion in an overlap should report both.
 */
import type { UnitSource } from '../units.ts';

const PRE = { en: 'Precentral gyrus', ja: '中心前回' };
const POST = { en: 'Postcentral gyrus', ja: '中心後回' };
const SRC_PRE = { en: 'Precentral gyrus (homunculus)', ja: '中心前回（ホムンクルス）' };
const SRC_POST = { en: 'Postcentral gyrus (homunculus)', ja: '中心後回（ホムンクルス）' };

/** z window, x window, and the names, for one band of both gyri. */
const BANDS = [
  { body: 'bulbar', z: [10, 32], x: [-70, -40], en: 'tongue and pharynx', ja: '舌・咽頭' },
  { body: 'face', z: [28, 48], x: [-68, -38], en: 'face', ja: '顔面' },
  { body: 'hand', z: [44, 62], x: [-56, -26], en: 'hand', ja: '手' },
  { body: 'arm', z: [54, 70], x: [-44, -16], en: 'arm', ja: '上肢近位' },
  { body: 'trunk', z: [60, 76], x: [-30, -8], en: 'trunk', ja: '体幹' },
  { body: 'leg', z: [62, 84], x: [-24, -1], en: 'leg', ja: '下肢' },
] as const;

const bands: UnitSource[] = BANDS.flatMap((b) => [
  {
    id: `m1-${b.body}-l`,
    group: PRE,
    name: { en: `Primary motor cortex, ${b.en}`, ja: `一次運動野 ${b.ja}` },
    where: { mesh: 'dkt-precentral-l', z: [...b.z] as [number, number], x: [...b.x] as [number, number] },
    carries: [{ mod: 'motor', body: b.body }],
    src: SRC_PRE,
  },
  {
    id: `s1-${b.body}-l`,
    group: POST,
    name: { en: `Primary somatosensory cortex, ${b.en}`, ja: `一次感覚野 ${b.ja}` },
    where: { mesh: 'dkt-postcentral-l', z: [...b.z] as [number, number], x: [...b.x] as [number, number] },
    carries: [
      { mod: 'touch-position', body: b.body },
      { mod: 'pain-temp', body: b.body },
    ],
    src: SRC_POST,
  },
]);

export const CENTRAL: UnitSource[] = [
  ...bands,
  {
    // The medial surface carries foot and leg for both gyri, plus the cortical bladder area — the reason an
    // anterior cerebral artery infarct is incontinent while a convexity infarct is not.
    id: 'paracentral-l',
    group: { en: 'Paracentral lobule', ja: '傍中心小葉' },
    name: { en: 'Paracentral lobule (foot, leg, bladder)', ja: '傍中心小葉（足・下肢・排尿）' },
    where: { mesh: 'dkt-paracentral-l' },
    carries: [
      { mod: 'motor', body: 'foot' },
      { mod: 'motor', body: 'leg' },
      { mod: 'touch-position', body: 'foot' },
      { mod: 'touch-position', body: 'leg' },
      { mod: 'pain-temp', body: 'foot' },
      {
        mod: 'autonomic',
        side: 'none',
        sign: { en: 'Urinary incontinence (cortical micturition area)', ja: '尿失禁（皮質性排尿中枢）' },
      },
    ],
    src: { en: 'Paracentral lobule', ja: '傍中心小葉' },
  },
];
