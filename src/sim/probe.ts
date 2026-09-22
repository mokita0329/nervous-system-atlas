/**
 * Does a lesion reach a functional unit? Yes or no — nothing else is computed.
 *
 * Three stages, cheapest first: the unit's box (its mesh's bounding box narrowed by its coordinate windows,
 * straight from the manifest, no geometry loaded) rejects almost everything; then the real surface is tested
 * against the sphere with the BVH every mesh already carries (`MeshRegistry.ts:83`); finally, a lesion that sits
 * entirely inside a thick structure — no surface within reach — is caught by a parity raycast.
 */
import * as THREE from 'three';
import { INTERSECTED, NOT_INTERSECTED } from 'three-mesh-bvh';
import type { App } from '../app.ts';
import { windowBox, OPEN, type FunctionalUnit } from './units.ts';
import { UNITS, UNIT_MESHES } from './units/index.ts';

export interface Lesion {
  mni: [number, number, number];
  radiusMm: number;
}

/**
 * Where the unit actually is: its window, clipped to its mesh's bounding box. Null when the unit names a mesh
 * this edition does not ship (the public build drops the non-redistributable atlases) or the two do not overlap.
 */
export function regionBox(app: App, u: FunctionalUnit): THREE.Box3 | null {
  const box = windowBox(u.where);
  if (!u.where.mesh) return box.min.x <= -OPEN && box.max.x >= OPEN ? null : box;
  const entry = app.registry.byId.get(u.where.mesh);
  if (!entry) return null;
  const [lo, hi] = entry.bbox;
  box.intersect(new THREE.Box3(new THREE.Vector3(...lo), new THREE.Vector3(...hi)));
  return box.isEmpty() ? null : box;
}

/** An unbounded region, for callers that want the plain "does the sphere reach this mesh" question. */
export function windowBoxAll(): THREE.Box3 {
  return new THREE.Box3(new THREE.Vector3(-OPEN, -OPEN, -OPEN), new THREE.Vector3(OPEN, OPEN, OPEN));
}

/** Units whose box the lesion's own box overlaps. Manifest-only, so this is safe before anything is loaded. */
export function unitsNear(app: App, lesion: Lesion): FunctionalUnit[] {
  const c = new THREE.Vector3(...lesion.mni);
  const ball = new THREE.Box3(c.clone().subScalar(lesion.radiusMm), c.clone().addScalar(lesion.radiusMm));
  const out: FunctionalUnit[] = [];
  for (const u of UNITS) {
    const r = regionBox(app, u);
    if (r && r.intersectsBox(ball)) out.push(u);
  }
  return out;
}

/** Meshes the units need, at full detail — the LOD stand-in is too coarse to decide a 3 mm question. */
export async function ensureUnitMeshes(app: App): Promise<void> {
  await app.registry.ensure(UNIT_MESHES);
  await Promise.all(UNIT_MESHES.map((id) => app.registry.ensureFull(id)));
}

const tmp = new THREE.Vector3();
const ray = new THREE.Raycaster();

/**
 * Is the point inside this mesh? Odd number of surface crossings along +x.
 *
 * The bounding box is checked first, and not only to save the raycast: these meshes are not all watertight,
 * and a parity test on an open surface can answer "inside" for a point nowhere near it. Refusing to ask the
 * question outside the box keeps that mistake local.
 */
export function pointInMesh(mesh: THREE.Mesh, p: THREE.Vector3): boolean {
  const box = mesh.geometry.boundingBox;
  if (box && !box.containsPoint(p)) return false;
  ray.set(p, new THREE.Vector3(1, 0, 0));
  ray.far = OPEN;
  (ray as THREE.Raycaster & { firstHitOnly?: boolean }).firstHitOnly = false;
  return ray.intersectObject(mesh, false).length % 2 === 1;
}

/**
 * True when the sphere reaches the part of the mesh that lies inside the region.
 * Pass an unbounded region to ask the plain question "does this lesion reach this structure at all".
 */
export function sphereMeetsMesh(mesh: THREE.Mesh, centre: THREE.Vector3, r: number, region: THREE.Box3): boolean {
  const tree = mesh.geometry.boundsTree;
  if (!tree) return false;
  const sphere = new THREE.Sphere(centre, r);
  const surface = tree.shapecast({
    intersectsBounds: (box) => (box.intersectsSphere(sphere) && box.intersectsBox(region) ? INTERSECTED : NOT_INTERSECTED),
    intersectsTriangle: (tri) => {
      tri.closestPointToPoint(centre, tmp);
      return tmp.distanceToSquared(centre) <= r * r && region.containsPoint(tmp);
    },
  });
  if (surface) return true;
  return region.containsPoint(centre) && pointInMesh(mesh, centre);   // lesion swallowed by a thick structure
}

export interface ProbeResult {
  /** units the lesion reaches */
  hit: FunctionalUnit[];
  /** units of the same groups it did not reach — the clinically interesting half of the answer */
  spared: FunctionalUnit[];
  /** units that could not be decided because their mesh is not loaded yet */
  unresolved: FunctionalUnit[];
}

/** The whole question, answered against whatever is loaded. Synchronous, so it is cheap to re-run while dragging. */
export function probe(app: App, lesion: Lesion): ProbeResult {
  const centre = new THREE.Vector3(...lesion.mni);
  const hit: FunctionalUnit[] = [], unresolved: FunctionalUnit[] = [];
  const candidates = unitsNear(app, lesion);
  for (const u of candidates) {
    const region = regionBox(app, u);
    if (!region) continue;
    if (!u.where.mesh) { hit.push(u); continue; }               // a plain coordinate box needs no geometry
    const mesh = app.registry.get(u.where.mesh);
    if (!mesh) { unresolved.push(u); continue; }
    const reach = u.where.strict ? lesion.radiusMm * 0.5 : lesion.radiusMm;
    const meets = sphereMeetsMesh(mesh, centre, reach, region)
      || (u.where.strict ? region.containsPoint(centre) && pointInMesh(mesh, centre) : false);
    if (meets) hit.push(u);
  }
  const groups = new Set(hit.map((u) => u.group.en));
  const sides = new Set(hit.map((u) => u.side));
  const isHit = new Set(hit);
  const spared = UNITS.filter((u) => groups.has(u.group.en) && sides.has(u.side) && !isHit.has(u));
  return { hit, spared, unresolved };
}
