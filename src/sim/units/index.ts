import { expand, type FunctionalUnit } from '../units.ts';
import { CENTRAL } from './central.ts';
import { INTERNAL_CAPSULE } from './internal-capsule.ts';
import { PARIETAL } from './parietal.ts';

/** Every functional unit, left-sided authoring expanded to both hemispheres. */
export const UNITS: readonly FunctionalUnit[] = expand([...CENTRAL, ...INTERNAL_CAPSULE, ...PARIETAL]);

export const UNIT_BY_ID: ReadonlyMap<string, FunctionalUnit> = new Map(UNITS.map((u) => [u.id, u]));

/** Meshes the units refer to, so a caller can load exactly those and no more. */
export const UNIT_MESHES: readonly string[] = [...new Set(UNITS.map((u) => u.where.mesh).filter((m): m is string => !!m))];
