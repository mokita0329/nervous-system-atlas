/**
 * Which anatomical structures the lesion actually bites into.
 *
 * Not "what might it spread to" — that is a guess about how a haematoma dissects white matter, and this model
 * has no business making it. How far a lesion reaches is the reader's own control: the radius. Turn it up and
 * a thalamic bleed takes in the internal capsule, the pallidum and the putamen, one at a time, and you can
 * watch which deficits arrive with each of them.
 *
 * This is the same sphere-against-BVH test the functional units use (`probe.ts`), asked of every mesh in the
 * edition instead of a handful. The manifest's bounding boxes throw out all but a few dozen before any
 * geometry is touched, so the question stays cheap enough to answer while the radius slider is moving.
 */
import * as THREE from 'three';
import type { App } from '../app.ts';
import type { ManifestMesh, SystemId } from '../types/manifest.ts';
import { pointInMesh, sphereMeetsMesh, windowBoxAll, type Lesion } from './probe.ts';

/**
 * All these two questions need of the app: the manifest, and whatever geometry has been loaded so far.
 * `App` satisfies it, and so does a test that loads the same glb files from disk — which is how the
 * 51 authored lesions are scored without a browser (`tests/sim-anatomy.test.ts`).
 */
export interface MeshSource {
  registry: { byId: ReadonlyMap<string, ManifestMesh>; get(id: string): THREE.Mesh | undefined };
}

/** Vessels and wrappings are not what a lesion "involves" in any useful sense; the envelope is scenery. */
const NOT_STRUCTURE: ReadonlySet<SystemId> = new Set<SystemId>(['arteries', 'venous', 'envelope', 'meninges', 'arterial-territories']);

/** How a structure was reached, so the panel can say which ones the lesion sits inside. */
export interface AnatomyHit {
  meshId: string;
  system: SystemId;
  /** the lesion's centre is inside this mesh — it is the structure the lesion is *in*, not one it clips */
  contains: boolean;
}

export interface AnatomyResult {
  hits: AnatomyHit[];
  /** arterial territories the lesion overlaps: a separate readout, never a source of deficits */
  territories: AnatomyHit[];
  /** true while candidate meshes are still loading, so the panel can wait instead of claiming nothing */
  pending: boolean;
}

/** Meshes whose bounding box the lesion's own box overlaps. Manifest only — nothing is loaded to answer this. */
export function candidates(app: MeshSource, lesion: Lesion): string[] {
  const c = new THREE.Vector3(...lesion.mni);
  const lo = c.clone().subScalar(lesion.radiusMm), hi = c.clone().addScalar(lesion.radiusMm);
  const out: string[] = [];
  for (const m of app.registry.byId.values()) {
    const [a, b] = m.bbox;
    if (hi.x < a[0] || lo.x > b[0] || hi.y < a[1] || lo.y > b[1] || hi.z < a[2] || lo.z > b[2]) continue;
    out.push(m.id);
  }
  return out;
}

/** Load what the question needs. The low-detail stand-in is accurate enough to say "the putamen is involved". */
export async function ensureAnatomy(app: App, lesion: Lesion): Promise<void> {
  await app.registry.ensure(candidates(app, lesion));
}

export function anatomyAt(app: MeshSource, lesion: Lesion): AnatomyResult {
  const centre = new THREE.Vector3(...lesion.mni);
  const all = windowBoxAll();
  const hits: AnatomyHit[] = [], territories: AnatomyHit[] = [];
  let pending = false;

  for (const id of candidates(app, lesion)) {
    const entry = app.registry.byId.get(id)!;
    const mesh = app.registry.get(id);
    if (!mesh) { pending = true; continue; }
    if (!sphereMeetsMesh(mesh, centre, lesion.radiusMm, all)) continue;
    // "the lesion is in the thalamus" has to mean the real shape, not its bounding box — the box of almost
    // any deep structure contains the centre of almost any deep lesion.
    const hit: AnatomyHit = { meshId: id, system: entry.system, contains: pointInMesh(mesh, centre) };
    if (entry.system === 'arterial-territories') territories.push(hit);
    else if (!NOT_STRUCTURE.has(entry.system)) hits.push(hit);
  }

  // The structure the lesion sits inside comes first; after that, keep meshes of the same system together.
  hits.sort((x, y) => Number(y.contains) - Number(x.contains) || x.system.localeCompare(y.system) || x.meshId.localeCompare(y.meshId));
  return { hits, territories, pending };
}
