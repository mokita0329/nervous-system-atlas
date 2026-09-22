/**
 * Turns "these units are cut" into "this is what the patient cannot do".
 *
 * Two shapes come out, because deficits come in two shapes. A weakness or a sensory loss belongs to a part of
 * the body, so it goes in a grid of body part × modality — that grid *is* the answer the reader came for.
 * An aphasia, a neglect, an akinesia has no body part; those are listed separately, each with the unit it came
 * from, so nothing is asserted without saying where the claim comes from.
 */
import { BODY_PARTS, TABLE_MODALITIES, bodySide, type BodyPart, type Carries, type FunctionalUnit, type Modality, type Text } from './units.ts';
import type { ProbeResult } from './probe.ts';

export type Side = 'l' | 'r' | 'both' | 'none';

export interface Cell {
  side: Side;
  /** the units that account for it, so the reader can ask "why do you say that" */
  from: FunctionalUnit[];
}

export interface Other {
  /** every unit that accounts for this same deficit — the superior and inferior parietal lobules both
   *  produce neglect, and the reader wants one line saying so, not the same sentence twice */
  units: FunctionalUnit[];
  carry: Carries;
  side: Side;
}

export interface SparedGroup {
  group: Text;
  side: FunctionalUnit['side'];
  names: Text[];
}

export interface Symptoms {
  /** `table[body][modality]`, absent where nothing is lost */
  table: Map<BodyPart, Map<Modality, Cell>>;
  others: Other[];
  spared: SparedGroup[];
  /** true when nothing at all was reached */
  empty: boolean;
}

/** "Internal capsule, posterior limb, leg" listed under "posterior limb" is just "leg". */
function shorten(name: Text, group: Text): Text {
  const cut = (v: string, g: string) => v.startsWith(g) ? (v.slice(g.length).replace(/^[\s,、・]+/, '') || v) : v;
  return { en: cut(name.en, group.en), ja: cut(name.ja, group.ja), tr: name.tr && group.tr ? cut(name.tr, group.tr) : name.tr };
}

function merge(a: Side, b: Side): Side {
  if (a === b) return a;
  if (a === 'none') return b;
  if (b === 'none') return a;
  return 'both';
}

export function symptomsOf(res: ProbeResult): Symptoms {
  const table = new Map<BodyPart, Map<Modality, Cell>>();
  const others: Other[] = [];

  for (const unit of res.hit) {
    for (const carry of unit.carries) {
      const side = bodySide(carry, unit.side);
      if (!side) continue;                                   // this hemisphere does not produce that deficit
      const isTableCell = carry.body && (TABLE_MODALITIES as readonly string[]).includes(carry.mod);
      if (!isTableCell) {
        const key = carry.sign?.en ?? carry.mod;
        const same = others.find((o) => (o.carry.sign?.en ?? o.carry.mod) === key);
        if (same) { same.units.push(unit); same.side = merge(same.side, side); }
        else others.push({ units: [unit], carry, side });
        continue;
      }
      const row = table.get(carry.body!) ?? new Map<Modality, Cell>();
      const prev = row.get(carry.mod);
      row.set(carry.mod, prev
        ? { side: merge(prev.side, side), from: [...prev.from, unit] }
        : { side, from: [unit] });
      table.set(carry.body!, row);
    }
  }

  // Spared siblings are grouped so the panel can say "the posterior limb's sensory fibres were spared"
  // on one line instead of listing every band that happened to be missed.
  const spared: SparedGroup[] = [];
  for (const u of res.spared) {
    const short = shorten(u.name, u.group);
    const g = spared.find((x) => x.group.en === u.group.en && x.side === u.side);
    if (g) g.names.push(short);
    else spared.push({ group: u.group, side: u.side, names: [short] });
  }

  return { table, others, spared, empty: res.hit.length === 0 };
}

/** Rows to draw, in homunculus order, skipping the body parts nothing touched. */
export function rowsOf(s: Symptoms): BodyPart[] {
  return BODY_PARTS.filter((b) => s.table.has(b));
}
