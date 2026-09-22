// The functional units decide, for a given lesion, which part of the body loses which function. Three things
// have to hold for that answer to be trustworthy, and none of them needs a browser: the left-sided authoring
// must mirror correctly, the laterality rules must not collapse into "always contralateral", and the bands of
// a somatotopic structure must not leave a gap a small lesion could fall through unnoticed.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { bodySide, expand, windowBox, BODY_PARTS, type UnitSource, type Carries } from '../src/sim/units.ts';
import { UNITS, UNIT_MESHES } from '../src/sim/units/index.ts';
import { INTERNAL_CAPSULE } from '../src/sim/units/internal-capsule.ts';

const MANIFEST = resolve(import.meta.dirname, '../public/data/manifest.json');

describe('authoring one side and mirroring the other', () => {
  it('gives every paired unit a right-sided twin with the window reflected', () => {
    const src: UnitSource[] = [{
      id: 'x-l', group: { en: 'G', ja: 'G' }, name: { en: 'N', ja: 'N' },
      where: { mesh: 'internal-capsule-l', x: [-29, -7], y: [-11, -3] },
      carries: [{ mod: 'motor', body: 'hand' }], src: { en: 'S', ja: 'S' },
    }];
    const [left, right] = expand(src);
    expect(left!.id).toBe('x-l');
    expect(right!.id).toBe('x-r');
    expect(right!.where.mesh).toBe('internal-capsule-r');
    expect(right!.where.x).toEqual([7, 29]);          // reflected, and still low-to-high
    expect(right!.where.y).toEqual([-11, -3]);        // front-to-back is untouched
  });

  it('does not mirror a midline unit', () => {
    const src: UnitSource[] = [{
      id: 'm', group: { en: 'G', ja: 'G' }, name: { en: 'N', ja: 'N' }, side: 'midline',
      where: { z: [-40, -20] }, carries: [], src: { en: 'S', ja: 'S' },
    }];
    expect(expand(src)).toHaveLength(1);
  });

  it('ships both hemispheres and no duplicate ids', () => {
    const ids = UNITS.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(UNITS.filter((u) => u.side === 'l').length).toBe(UNITS.filter((u) => u.side === 'r').length);
  });
});

describe('which side of the body the deficit shows on', () => {
  const motor: Carries = { mod: 'motor', body: 'hand' };
  const neglect: Carries = { mod: 'cognitive', side: 'contra', onlyHemisphere: 'r' };
  const apraxia: Carries = { mod: 'cognitive', side: 'both', onlyHemisphere: 'l' };

  it('defaults to the opposite side', () => {
    expect(bodySide(motor, 'l')).toBe('r');
    expect(bodySide(motor, 'r')).toBe('l');
  });

  it('reports both sides for a midline unit', () => {
    expect(bodySide(motor, 'midline')).toBe('both');
  });

  // The textbook rule these encode: neglect comes from the right hemisphere and shows on the left; an
  // ideomotor apraxia comes from the left supramarginal gyrus and shows on both hands.
  it('produces a hemisphere-specific deficit only from that hemisphere', () => {
    expect(bodySide(neglect, 'r')).toBe('l');
    expect(bodySide(neglect, 'l')).toBeNull();
    expect(bodySide(apraxia, 'l')).toBe('both');
    expect(bodySide(apraxia, 'r')).toBeNull();
  });

  it('keeps an ipsilateral deficit on the side of the lesion', () => {
    expect(bodySide({ mod: 'motor', body: 'face', side: 'ipsi' }, 'l')).toBe('l');
  });
});

describe('the windows themselves', () => {
  it('leaves an unconstrained axis open', () => {
    const b = windowBox({ mesh: 'm', y: [-11, -3] });
    expect(b.min.y).toBe(-11);
    expect(b.max.y).toBe(-3);
    expect(b.min.x).toBeLessThan(-1000);
    expect(b.max.z).toBeGreaterThan(1000);
  });

  // A lacune is a few millimetres across. If two neighbouring bands of the internal capsule did not touch,
  // a lesion in the gap would silently report no deficit at all, which is the worst failure this can have.
  it('leaves no gap between consecutive bands of the internal capsule', () => {
    const bands = INTERNAL_CAPSULE
      .filter((u) => u.where.y)
      .map((u) => ({ id: u.id, y: u.where.y! }))
      .sort((a, b) => b.y[0] - a.y[0]);                      // front to back
    expect(bands.length).toBeGreaterThan(4);
    for (let i = 1; i < bands.length; i++) {
      const front = bands[i - 1]!, back = bands[i]!;
      expect(back.y[1], `${back.id} must reach ${front.id}`).toBeGreaterThanOrEqual(front.y[0]);
    }
  });

  it('only uses body parts the table has a row for', () => {
    for (const u of UNITS) for (const c of u.carries) {
      if (c.body) expect(BODY_PARTS, `${u.id}`).toContain(c.body);
      else expect(c.sign, `${u.id}: a deficit with no body part needs its own wording`).toBeTruthy();
    }
  });

  it('names only meshes this edition ships', () => {
    if (!existsSync(MANIFEST)) return;                       // data is fetched, not committed
    const ids = new Set((JSON.parse(readFileSync(MANIFEST, 'utf8')) as { meshes: { id: string }[] }).meshes.map((m) => m.id));
    expect(UNIT_MESHES.filter((m) => !ids.has(m))).toEqual([]);
  });
});
