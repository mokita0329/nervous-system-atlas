/**
 * Functional units — the one thing an anatomy atlas cannot answer: *which part of the body* a lesion takes out.
 *
 * A unit is a piece of nervous tissue small enough that the fibres running through it all do one job:
 * "the hand band of the precentral gyrus", "the leg fibres of the posterior limb". A lesion either reaches
 * it or it does not; there is no percentage. That is deliberate. The meshes this atlas ships are 15-18 mm
 * out of place on the convexity (`docs/pipeline.md:34`), so "26 % of the posterior limb destroyed" would be
 * a number with no meaning behind it — while "the arm fibres are cut, the sensory fibres behind them are not"
 * survives that error and is the question a clinician actually asks.
 *
 * Where a unit sits is written as an existing mesh plus a coordinate window, never as new geometry: the
 * somatotopy is already authored as prose in `content/data/pathways/*.json` (`somatotopy`), and these windows
 * are that prose turned into millimetres. Left-sided units are authored once and mirrored.
 */

import * as THREE from 'three';

/** The body parts the symptom table has rows for. Ordered head-first, as the homunculus is drawn. */
export const BODY_PARTS = ['face', 'bulbar', 'arm', 'hand', 'trunk', 'leg', 'foot'] as const;
export type BodyPart = (typeof BODY_PARTS)[number];

/** Columns of the symptom table are the first three; the rest land in the "everything else" list. */
export const TABLE_MODALITIES = ['motor', 'touch-position', 'pain-temp'] as const;
export const MODALITIES = [...TABLE_MODALITIES, 'vision', 'cognitive', 'autonomic'] as const;
export type Modality = (typeof MODALITIES)[number];

/** Our own strings: these units are not part of the upstream content, so they carry their own names. */
export interface Text { en: string; ja: string; tr?: string }

/**
 * Which side of the body the deficit shows up on. Not always the opposite side — hemispatial neglect is
 * contralateral but only from the right hemisphere, an apraxia from the left supramarginal gyrus is bilateral.
 */
export interface Carries {
  mod: Modality;
  /** the body part, when the deficit has one; omitted for aphasia, neglect, akinesia and the like */
  body?: BodyPart;
  /** free text, for deficits that do not fit the body × modality table */
  sign?: Text;
  /** default 'contra' */
  side?: 'contra' | 'ipsi' | 'both';
  /** the deficit only appears when the lesion is in this hemisphere (language left, neglect right) */
  onlyHemisphere?: 'l' | 'r';
}

export type Range = [number, number];

/** Half-width of an unconstrained axis: wider than any head, narrow enough to stay exact in a float. */
export const OPEN = 1e4;

/** A mesh, narrowed to a window in MNI millimetres. Either part may be omitted; at least one must be present. */
export interface Where {
  mesh?: string;
  x?: Range;
  y?: Range;
  z?: Range;
}

/** The window a unit declares, as a box; an axis it does not constrain is left wide open. */
export function windowBox(where: Where): THREE.Box3 {
  const min = new THREE.Vector3(), max = new THREE.Vector3();
  const axes = [where.x, where.y, where.z];
  for (const i of [0, 1, 2] as const) {
    const r = axes[i];
    min.setComponent(i, r ? r[0] : -OPEN);
    max.setComponent(i, r ? r[1] : OPEN);
  }
  return new THREE.Box3(min, max);
}

export interface FunctionalUnit {
  id: string;
  /** units of the same group are siblings: the ones a lesion missed are shown as "spared" */
  group: Text;
  name: Text;
  side: 'l' | 'r' | 'midline';
  where: Where;
  carries: Carries[];
  /** where the claim comes from, shown next to every symptom */
  src: Text;
}

/** As authored: left side only, unless `side` says otherwise. `mirror: false` opts a midline unit out. */
export interface UnitSource extends Omit<FunctionalUnit, 'side'> {
  side?: 'l' | 'midline';
  mirror?: boolean;
}

const flipRange = (r: Range | undefined): Range | undefined => (r ? [-r[1], -r[0]] : undefined);

/** The right-sided twin of a left-sided unit: ids and mesh names swap suffix, x windows reflect. */
export function mirrored(u: FunctionalUnit): FunctionalUnit {
  return {
    ...u,
    id: u.id.replace(/-l$/, '-r'),
    side: 'r',
    where: {
      ...u.where,
      mesh: u.where.mesh?.replace(/-l$/, '-r'),
      x: flipRange(u.where.x),
    },
    carries: u.carries.map((c) => ({ ...c, onlyHemisphere: c.onlyHemisphere })),
  };
}

/** Expand the authored list: every paired unit gains its mirror image. */
export function expand(sources: readonly UnitSource[]): FunctionalUnit[] {
  const out: FunctionalUnit[] = [];
  for (const s of sources) {
    const side = s.side ?? 'l';
    const unit: FunctionalUnit = { ...s, side } as FunctionalUnit;
    out.push(unit);
    if (s.mirror !== false && side === 'l') out.push(mirrored(unit));
  }
  return out;
}

/**
 * Which side of the *body* a unit's deficit shows on, or null when this hemisphere does not produce it.
 * `unitSide` is the hemisphere the unit sits in; a midline unit reports both sides.
 */
export function bodySide(c: Carries, unitSide: FunctionalUnit['side']): 'l' | 'r' | 'both' | null {
  if (c.onlyHemisphere && unitSide !== c.onlyHemisphere) return null;
  if (unitSide === 'midline' || c.side === 'both') return 'both';
  if (c.side === 'ipsi') return unitSide;
  return unitSide === 'l' ? 'r' : 'l';                       // contralateral, the default
}
