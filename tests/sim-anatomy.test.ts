// Does "the structures this lesion bites into" agree with the structures the textbook lists for that lesion?
//
// The content already holds both halves of that question. 51 of the 125 syndromes carry a lesionMarker with a
// centre and a radius, and every syndrome carries localisation.structures — the structures its author says are
// involved. Putting a sphere where the author put it and asking sim/anatomy.ts what it hits turns a matter of
// opinion into a number.
//
// The comparison is restricted, and each restriction is a limit of the data, not a thumb on the scale:
//
//  - arteries, veins, arterial territories and the meninges are never reported as involved (NOT_STRUCTURE in
//    anatomy.ts), so scoring them would only measure that exclusion;
//  - whole lobes, and the brainstem "levels", are too big to be a finding — "the frontal lobe is involved" or
//    "the caudal pons is involved" says nothing a reader wants, and the level ids carry one or two incidental
//    nuclei that would otherwise be scored as if they were the level;
//  - a structure the public edition ships only as part of a coarse stand-in cannot be found individually. The
//    brainstem nuclei are the case that matters: their atlas is non-redistributable, so thirty-five of them
//    (the abducens nucleus, the PPRF, the facial nucleus...) all point at the one `brainstem` mesh. A pontine
//    lesion can therefore only ever be told "the brainstem", and the syndromes with nothing else left to score
//    are counted and named in the report rather than silently dropped.
//
// One ceiling is built into the content and cannot be engineered away: localisation.structures lists the
// structures a syndrome *can* arise from, not the ones this particular sphere touches. Ataxic hemiparesis is
// authored with its sphere in the pons and also names the internal capsule and the corona radiata, because the
// same picture comes from any of the three. Those alternatives count as misses here. A recall of 1.0 would mean
// the test had stopped measuring anything.
//
// The geometry is loaded from the same glb files the browser fetches, so this measures the real surfaces, not
// their bounding boxes — and at full detail, which is what the app settles on once its upgrade queue drains.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { MeshBVH } from 'three-mesh-bvh';
import { installBvh } from '../src/picking/bvh.ts';
import { anatomyAt, candidates, type MeshSource } from '../src/sim/anatomy.ts';
import type { Lesion } from '../src/sim/probe.ts';
import type { ManifestMesh, SystemId } from '../src/types/manifest.ts';

const ROOT = resolve(import.meta.dirname, '..');
const DATA = join(ROOT, 'public/data');
const MANIFEST = join(DATA, 'manifest.json');

/** public/data is fetched, not committed, so a machine without it skips instead of failing. */
const ready = existsSync(MANIFEST);

interface Syndrome {
  id: string;
  localisation: { structures: string[] };
  /** mni is either a point or a reference to a mesh, whose centroid the app uses (state/syndrome.ts:40). */
  lesionMarker: { kind: string; mni?: { x?: number; y?: number; z?: number; meshId?: string }; radiusMm?: number };
}
interface Structure { id: string; system: SystemId; meshIds?: string[] }

const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const readDir = (d: string) => readdirSync(join(ROOT, 'content/data', d)).filter((f) => f.endsWith('.json'))
  .map((f) => readJson(join(ROOT, 'content/data', d, f)));

/** Systems anatomy.ts refuses to call "involved", mirrored here so the expected set cannot ask for them. */
const NOT_STRUCTURE = new Set<string>(['arteries', 'venous', 'envelope', 'meninges', 'arterial-territories']);
/** Extras are structures a reader has to read past; the ventricles are scenery, not noise. */
const NOT_NOISE = new Set<string>([...NOT_STRUCTURE, 'ventricles-csf']);
/** A mesh this many different structures all point at is a stand-in for a region, not one structure's shape. */
const SHARED = 10;

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

/** One glb into one geometry in MNI millimetres — the same steps MeshRegistry.loadGeometry takes. */
async function loadGeometry(file: string): Promise<THREE.BufferGeometry> {
  const buf = readFileSync(join(DATA, file));
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  const gltf = await loader.parseAsync(ab, '');
  let found: THREE.Mesh | null = null;
  gltf.scene.traverse((o) => { if (!found && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh; });
  if (!found) throw new Error(`no mesh in ${file}`);
  const src = found as THREE.Mesh;
  src.updateWorldMatrix(true, false);
  const p = src.geometry.getAttribute('position');
  const pos = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { pos[3 * i] = p.getX(i); pos[3 * i + 1] = p.getY(i); pos[3 * i + 2] = p.getZ(i); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  if (src.geometry.index) g.setIndex(src.geometry.index.clone());
  g.applyMatrix4(src.matrixWorld);
  g.computeBoundingBox();
  g.computeBoundsTree();
  return g;
}

/**
 * A MeshSource backed by the files on disk. `anatomyAt` is synchronous — it answers from whatever the browser
 * has already fetched — so the meshes it will ask for have to be loaded before it is called: `preload`.
 */
function diskSource(meshes: ManifestMesh[]): MeshSource & { preload(ids: string[]): Promise<void> } {
  const byId = new Map(meshes.map((m) => [m.id, m]));
  const cache = new Map<string, THREE.Mesh>();
  return {
    registry: { byId, get: (id: string) => cache.get(id) },
    async preload(ids: string[]) {
      for (const id of ids) {
        if (cache.has(id)) continue;
        const entry = byId.get(id);
        if (entry) cache.set(id, new THREE.Mesh(await loadGeometry(entry.file)));
      }
    },
  };
}

/** Distance from a point to the nearest point of a mesh's surface; Infinity when the mesh is not loaded. */
function surfaceDistance(mesh: THREE.Mesh | undefined, p: [number, number, number]): number {
  // boundsTree is typed as the base BVH; nearest-point queries live on the mesh subclass.
  const tree = mesh?.geometry.boundsTree as MeshBVH | undefined;
  if (!tree) return Infinity;
  return tree.closestPointToPoint(new THREE.Vector3(...p))?.distance ?? Infinity;
}

interface Scored {
  id: string; expected: string[]; found: string[]; extras: { id: string; system: string }[];
  /** for each structure not found, how far outside the sphere its nearest surface lies, in millimetres */
  gaps: { id: string; mm: number }[];
}

async function scoreAll(): Promise<{ scored: Scored[]; unscorable: string[] }> {
  installBvh();
  const manifest = readJson(MANIFEST) as { meshes: ManifestMesh[] };
  const source = diskSource(manifest.meshes);
  const meshById = new Map(manifest.meshes.map((m) => [m.id, m]));

  const structures = [...readDir('structures'), ...readDir('cranial-nerves')] as Structure[];
  const byStructureId = new Map(structures.map((s) => [s.id, s]));

  // How many different structures claim each mesh; one claimed by many is a region, not a structure.
  const claims = new Map<string, number>();
  for (const s of structures) for (const id of s.meshIds ?? []) if (meshById.has(id)) claims.set(id, (claims.get(id) ?? 0) + 1);

  /** Meshes that would count as finding this structure — empty when the edition cannot show it on its own. */
  const ownMeshes = (id: string): string[] => {
    const s = byStructureId.get(id);
    if (!s || NOT_STRUCTURE.has(s.system) || id.startsWith('lobe-') || id.startsWith('level-')) return [];
    return (s.meshIds ?? []).filter((m) => meshById.has(m) && (claims.get(m) ?? 0) < SHARED);
  };

  /** A point, or the centroid of the mesh the marker names — the same two forms the app accepts. */
  const centreOf = (m: Syndrome['lesionMarker']['mni']): [number, number, number] | null => {
    if (!m) return null;
    if (typeof m.x === 'number') return [m.x, m.y!, m.z!];
    const entry = m.meshId ? meshById.get(m.meshId) : undefined;
    return entry ? [entry.centroid[0]!, entry.centroid[1]!, entry.centroid[2]!] : null;
  };

  const spheres = (readDir('syndromes') as Syndrome[])
    .filter((s) => s.lesionMarker?.kind === 'sphere' && s.lesionMarker.radiusMm && centreOf(s.lesionMarker.mni))
    .sort((a, b) => a.id.localeCompare(b.id));

  const scored: Scored[] = [], unscorable: string[] = [];
  for (const syn of spheres) {
    const expected = syn.localisation.structures.filter((id) => ownMeshes(id).length > 0);
    if (!expected.length) { unscorable.push(syn.id); continue; }

    const lesion: Lesion = { mni: centreOf(syn.lesionMarker.mni)!, radiusMm: syn.lesionMarker.radiusMm! };
    await source.preload(candidates(source, lesion));
    const hit = new Set(anatomyAt(source, lesion).hits.map((h) => h.meshId));

    const found = expected.filter((id) => ownMeshes(id).some((m) => hit.has(m)));
    const wanted = new Set(expected.flatMap(ownMeshes));
    const extraMeshes = [...hit].filter((m) => !wanted.has(m) && !NOT_NOISE.has(meshById.get(m)!.system));
    const extras = [...new Map(extraMeshes.map((m) => {
      const e = meshById.get(m)!;
      return [e.structureId, { id: e.structureId, system: e.system as string }] as const;
    })).values()];
    // A miss is worth a different answer depending on how far away it was: a few millimetres is a question
    // about tolerance and registration, forty is the syndrome naming a place this sphere was never put.
    const missed = expected.filter((id) => !found.includes(id));
    await source.preload(missed.flatMap(ownMeshes));
    const gaps = missed.map((id) => ({
      id,
      mm: Math.round(Math.max(0, Math.min(...ownMeshes(id).map((m) => surfaceDistance(source.registry.get(m), lesion.mni))) - lesion.radiusMm))
    }));
    scored.push({ id: syn.id, expected, found, extras, gaps });
  }
  return { scored, unscorable };
}

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const i = s.length >> 1;
  return s.length % 2 ? s[i]! : (s[i - 1]! + s[i]!) / 2;
};

const { scored, unscorable } = ready ? await scoreAll() : { scored: [] as Scored[], unscorable: [] as string[] };

describe.skipIf(!ready)('the lesion finds the structures its syndrome names', () => {
  const expected = scored.reduce((n, s) => n + s.expected.length, 0);
  const found = scored.reduce((n, s) => n + s.found.length, 0);
  const recall = found / expected;
  const extras = median(scored.map((s) => s.extras.length));

  it('reports what it measured', () => {
    const worst = [...scored].sort((a, b) => a.found.length / a.expected.length - b.found.length / b.expected.length).slice(0, 8);
    const bySystem = new Map<string, number>();
    for (const s of scored) for (const e of s.extras) bySystem.set(e.system, (bySystem.get(e.system) ?? 0) + 1);
    console.log([
      `scored ${scored.length} of ${scored.length + unscorable.length} sphere lesions`,
      `  no structure this edition ships on its own (${unscorable.length}): ${unscorable.join(', ')}`,
      `recall ${(100 * recall).toFixed(1)}%  (${found}/${expected} structures)`,
      `extra structures per lesion: median ${extras}, max ${Math.max(...scored.map((s) => s.extras.length))}`,
      `  where they come from: ${[...bySystem].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')}`,
      'weakest:',
      ...worst.map((s) => `  ${s.id}: ${s.found.length}/${s.expected.length}`
        + `  missed ${s.gaps.map((g) => `${g.id} (by ${g.mm}mm)`).join(', ')}`),
    ].join('\n'));
    expect(scored.length).toBeGreaterThan(30);
  });

  // Floors, not targets: these are what the code scored on 2026-09-23 (68.2% of 88 structures, a median of 10
  // extras), each with one step of slack so that adding a syndrome does not fail the build on its own. Raising
  // them after an improvement is the point of having them; a drop below means something got worse.
  //
  // Where the missing third goes is in the report above, and it is mostly not a matter of tolerance: the
  // structures that were missed were missed by 11 to 69 mm, which is the content naming a place this sphere was
  // never put. Only three near misses in the whole set (2-3 mm) are close enough to be about registration.
  it('finds two thirds of the structures its syndromes name', () => {
    expect(recall).toBeGreaterThanOrEqual(0.66);
  });

  // The extras are dominated by the long tracts: the HCP1065 maps are population probabilities, fatter than any
  // one person's bundle and heavily overlapping, so a deep lesion legitimately meets several at once.
  it('does not bury them under structures nobody asked about', () => {
    expect(extras).toBeLessThanOrEqual(12);
  });
});
