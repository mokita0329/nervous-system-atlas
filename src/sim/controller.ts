/**
 * Holds the simulated lesion and keeps everything else in step with it: the sphere in the scene, the MRI
 * slices, which meshes are lit, and the panel.
 *
 * The lesion lives in the store rather than in this object, so it round-trips through the address bar and a
 * lesion can be sent to someone as a link. Everything else here is scene bookkeeping — in particular the
 * `showForMode` undo function, kept exactly as `state/syndrome.ts` keeps its own, so that moving the lesion
 * never leaves the previous lesion's structures switched on behind it.
 */
import * as THREE from 'three';
import type { App } from '../app.ts';
import { applyStates, setSlices, showForMode } from '../state/actions.ts';
import { ensureUnitMeshes, probe, type Lesion, type ProbeResult } from './probe.ts';
import { symptomsOf, type Symptoms } from './symptoms.ts';
import { anatomyAt, ensureAnatomy, type AnatomyResult } from './anatomy.ts';
import type { FunctionalUnit } from './units.ts';

export const DEFAULT_RADIUS_MM = 8;
export const MIN_RADIUS_MM = 3;
export const MAX_RADIUS_MM = 26;

export class LesionController {
  private restore: (() => void) | null = null;
  private wire: THREE.Mesh;
  private loading: Promise<void> | null = null;
  /** the panel subscribes to this; it is the only way results leave the controller */
  onResult: (s: Symptoms, res: ProbeResult, anat: AnatomyResult) => void = () => {};

  constructor(private app: App) {
    // A 45 %-opaque red ball is a smudge against a scene dimmed to 3 %. The second, wireframe copy is what
    // actually reads as a sphere sitting inside the anatomy.
    this.wire = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xff9a94, wireframe: true, transparent: true, opacity: 0.55, depthTest: false }),
    );
    this.wire.visible = false;
    this.wire.renderOrder = 21;
    app.sm.overlayRoot.add(this.wire);
  }

  get lesion(): Lesion | null {
    const l = this.app.store.get().lesion;
    return l ? { mni: l.mni, radiusMm: l.r } : null;
  }

  place(mni: [number, number, number], radiusMm = this.lesion?.radiusMm ?? DEFAULT_RADIUS_MM): void {
    const r = Math.min(MAX_RADIUS_MM, Math.max(MIN_RADIUS_MM, Math.round(radiusMm)));
    this.app.store.set({ lesion: { mni, r } });
    setSlices(this.app, { sagittal: Math.round(mni[0]), coronal: Math.round(mni[1]), axial: Math.round(mni[2]) });
    this.refresh();
  }

  setRadius(mm: number): void {
    const l = this.lesion;
    if (l) this.place(l.mni, mm);
  }

  /** The same lesion in the other hemisphere — the quickest way to see which deficits are lateralised. */
  mirror(): void {
    const l = this.lesion;
    if (l) this.place([-l.mni[0], l.mni[1], l.mni[2]], l.radiusMm);
  }

  clear(): void {
    this.restore?.(); this.restore = null;
    this.app.lesion.visible = false;
    this.wire.visible = false;
    this.app.store.set({ lesion: null, involved: new Set(), shell: new Set(), stepHighlight: new Set() });
    applyStates(this.app);
    this.app.sm.requestRender();
  }

  /** Spotlight the structure one symptom row came from, while the pointer is on it. */
  hover(unit: FunctionalUnit | null): void {
    this.hoverMesh(unit?.where.mesh ?? null);
  }

  /** The same, for a row that names a mesh directly (the anatomy list). */
  hoverMesh(meshId: string | null): void {
    this.app.store.set({ stepHighlight: meshId ? new Set([meshId]) : new Set() });
    applyStates(this.app);
  }

  /** Re-run the probe against the current lesion and push the result everywhere it has to go. */
  refresh(): void {
    const l = this.lesion;
    if (!l) { this.clear(); return; }

    this.app.lesion.position.set(...l.mni);
    this.app.lesion.scale.setScalar(l.radiusMm);
    this.app.lesion.visible = true;
    this.wire.position.set(...l.mni);
    this.wire.scale.setScalar(l.radiusMm);
    this.wire.visible = true;

    const res = probe(this.app, l);
    const anat = anatomyAt(this.app, l);

    // Meshes that have not arrived yet cannot be decided. Load them once, then answer again — the first
    // answer is still shown meanwhile, so the panel never sits empty waiting for geometry.
    if ((res.unresolved.length || anat.pending) && !this.loading) {
      this.loading = Promise.all([ensureUnitMeshes(this.app), ensureAnatomy(this.app, l)]).then(() => {
        this.loading = null;
        if (this.lesion) this.refresh();
      });
    }

    const unitMeshes = [...new Set(res.hit.map((u) => u.where.mesh).filter((m): m is string => !!m))];
    const meshes = [...new Set([...anat.hits.map((a) => a.meshId), ...unitMeshes])];
    this.restore?.();
    this.restore = showForMode(this.app, meshes);
    // `involved` is what switches the whole scene into "everything else is 3 %" mode (`actions.ts:36`) and
    // draws these solid. `shell` keeps the ones the lesion sits *inside* translucent, so the red ball is
    // still visible in there rather than swallowed by the structure it is destroying.
    const inside = new Set([...anat.hits.filter((a) => a.contains).map((a) => a.meshId), ...unitMeshes]);
    this.app.store.set({ involved: new Set(meshes), shell: inside, stepHighlight: new Set() });
    void this.app.registry.ensure(meshes).then(() => applyStates(this.app));
    applyStates(this.app);

    this.onResult(symptomsOf(res), res, anat);
    this.app.sm.requestRender();
  }
}
