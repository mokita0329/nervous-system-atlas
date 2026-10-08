/**
 * The simulator's second view: the brain made see-through, so the lesion and what it bites into are seen where
 * they sit in three dimensions instead of as a cut through one MRI slice.
 *
 * What stands in the way is the cortex. Its seventy-odd parcels, even at the 3 % every unlit mesh is drawn at,
 * stack along the line of sight into a pale wall; so this view takes the cerebral system off, keeps the brain's
 * outline and a few landmarks faintly drawn to tell up from down, and leaves lit only what the lesion touches.
 * The MRI slices and the peel go too: the slice is how a lesion is placed, and in this view it is a screen
 * across the middle of the picture. Leaving the view puts back the systems, slices, peel and camera as they
 * were when it was entered.
 *
 * The visibility state is never touched directly for the lesion's own structures: the controller leases them
 * with `showForMode` every time it refreshes, so a structure the lesion reaches in a system this view hides
 * still comes on, and goes back off when the lesion moves away from it.
 */
import * as THREE from 'three';
import type { App } from '../app.ts';
import type { ManifestMesh, SystemId } from '../types/manifest.ts';
import type { AppState } from '../types/state.ts';
import type { LesionController } from './controller.ts';

/** Off in this view: the cortex is the wall the view exists to remove, and the cranial nerves are clutter in front of it. */
export const GLASS_HIDDEN_SYSTEMS: readonly SystemId[] = ['cerebrum', 'cranial-nerves'];

/** Drawn faint rather than at 3 %, so the reader can tell where in the brain the lesion is. */
export const GLASS_LANDMARK_SYSTEMS: readonly SystemId[] = ['brainstem', 'cerebellum', 'ventricles-csf', 'envelope'];

/**
 * Structures the lesion reaches that this view draws faint instead of lit. The long tracts are HCP1065
 * population probability maps, several millimetres wider than the real bundles and overlapping one another,
 * and the hemisphere's white matter is the whole interior of the hemisphere: lit solid, either rebuilds the
 * wall the view removes. They remain in the panel's list, and hovering their row still spotlights them.
 */
export function faintInGlass(m: Pick<ManifestMesh, 'id' | 'system'> | undefined): boolean {
  return !!m && (m.system === 'tracts' || m.id.startsWith('cerebral-white-matter-'));
}

type Pose = { position: THREE.Vector3; target: THREE.Vector3 };
/** What entering the view changed, kept so that leaving it (or sharing a link from it) can undo exactly that. */
interface Saved { removed: SystemId[]; slicesVisible: AppState['slices']['visible']; peel: AppState['peel']; camera: Pose }

const sideOf = (mni: readonly number[]): 1 | -1 => ((mni[0] ?? 0) > 0 ? 1 : -1);

/** A three-quarter view from the lesion's own side, from in front and above: the lesion nearest the camera, the brainstem below it showing which way is down. */
function aim(app: App, side: 1 | -1): void {
  const target = app.sm.controls.target.clone();
  const dist = app.sm.camera.position.distanceTo(target) || 420;
  app.sm.moveCamera(target.clone().add(new THREE.Vector3(side, 0.7, 0.6).normalize().multiplyScalar(dist)), target, 400);
}

function enter(app: App, side: 1 | -1): Saved {
  const s = app.store.get();
  const saved: Saved = {
    removed: GLASS_HIDDEN_SYSTEMS.filter((sys) => s.visibleSystems.has(sys)),
    slicesVisible: s.slices.visible, peel: s.peel,
    camera: { position: app.sm.camera.position.clone(), target: app.sm.controls.target.clone() },
  };
  const visible = new Set(s.visibleSystems);
  for (const sys of saved.removed) visible.delete(sys);
  app.store.set({
    visibleSystems: visible,
    slices: { ...s.slices, visible: { axial: false, coronal: false, sagittal: false } },
    peel: {},
    contextSystems: new Set(GLASS_LANDMARK_SYSTEMS),
  });
  aim(app, side);
  return saved;
}

/** The MRI view's share of the state: the see-through view's changes taken back out. */
function asMri(s: AppState, saved: Saved): AppState {
  const visibleSystems = new Set(s.visibleSystems);
  for (const sys of saved.removed) visibleSystems.add(sys);
  return { ...s, simView: 'mri', visibleSystems, slices: { ...s.slices, visible: saved.slicesVisible }, peel: saved.peel, contextSystems: new Set(), faint: new Set() };
}

function leave(app: App, saved: Saved): void {
  const m = asMri(app.store.get(), saved);
  app.store.set({ visibleSystems: m.visibleSystems, slices: m.slices, peel: m.peel, contextSystems: m.contextSystems });
  app.sm.moveCamera(saved.camera.position, saved.camera.target, 400);
}

export interface SimView {
  /** Back to the MRI view if the see-through view is open: for anything that takes the reader away from the simulator. */
  leave(): void;
  /**
   * The state and camera a shared link should carry. From the see-through view that is the MRI view behind it:
   * a link that hid the cortex and the slices would open on a simulator with nothing to click, and the view
   * itself is one button away once the lesion is there.
   */
  forShare(s: AppState): { state: AppState; camera: Pose | null };
}

/** Follow `simView` in the store: enter or leave the see-through view, and let the lesion re-light its structures. */
export function wireSimView(app: App, ctl: LesionController): SimView {
  let saved: Saved | null = null;
  app.store.subscribe((s) => s.simView, (view) => {
    if (view === 'glass' && !saved) saved = enter(app, ctl.lesion ? sideOf(ctl.lesion.mni) : -1);
    else if (view === 'mri' && saved) { leave(app, saved); saved = null; }
    if (ctl.lesion) ctl.refresh();
  });
  // Mirror, or a link, can move the lesion to the other hemisphere while the view is open: follow it round.
  app.store.subscribe((s) => (s.simView === 'glass' && s.lesion ? sideOf(s.lesion.mni) : 0), (side, prev) => {
    if (saved && side && prev && side !== prev) aim(app, side);
  });
  return {
    leave: () => { if (app.store.get().simView === 'glass') app.store.set({ simView: 'mri' }); },
    forShare: (s) => (saved ? { state: asMri(s, saved), camera: saved.camera } : { state: s, camera: null }),
  };
}
