import * as THREE from 'three';
import type { App } from '../app.ts';
import type { SystemId } from '../types/manifest.ts';
import type { AppState, Axis, Contrast, PresetName } from '../types/state.ts';
import { applyVisualState, type VisualState } from '../scene/materials.ts';
import { applyPreset } from '../scene/cameraPresets.ts';
import { setEq } from './store.ts';

/** Is a mesh currently meant to be visible according to state? */
export function meshShouldBeVisible(app: App, id: string): boolean {
  const s = app.store.get();
  const m = app.registry.byId.get(id);
  if (!m) return false;
  if (!s.showNc && m.nc) return false;
  if (s.hiddenStructures.has(id)) return false;
  if (s.shownStructures.has(id)) return true;
  if (!s.visibleSystems.has(m.system)) return false;
  return m.visible || s.shownStructures.has(id);
}

export function syncVisibility(app: App): void {
  const s = app.store.get();
  // make sure systems that are on are loaded
  for (const sys of s.visibleSystems) void app.registry.loadSystem(sys);
  for (const id of s.shownStructures) void app.registry.load(id);
  for (const mesh of app.registry.loaded()) app.registry.setVisible(mesh.userData.id, meshShouldBeVisible(app, mesh.userData.id));
  app.registry.invalidatePickCache();
  app.sm.requestRender();
}

export function applyStates(app: App): void {
  const s = app.store.get();
  for (const mesh of app.registry.loaded()) {
    const id = mesh.userData.id;
    let st: VisualState = 'normal';
    if (s.syndrome || s.involved.size) st = s.stepHighlight.has(id) ? 'selected' : s.shell.has(id) ? 'shell' : s.involved.has(id) ? 'involved' : 'dimmed';
    if (id === s.hoverId && !s.syndrome) st = 'hover';
    if (id === s.selectedId) st = 'selected';
    applyVisualState(mesh, st);
  }
  app.sm.requestRender();
}

export function toggleSystem(app: App, sys: SystemId, on?: boolean): void {
  const cur = app.store.get().visibleSystems;
  const next = new Set(cur);
  const want = on ?? !cur.has(sys);
  if (want) next.add(sys); else next.delete(sys);
  app.store.set({ visibleSystems: next });
}

export function setStructureVisible(app: App, id: string, on: boolean): void {
  const s = app.store.get();
  const hidden = new Set(s.hiddenStructures); const shown = new Set(s.shownStructures);
  if (on) { hidden.delete(id); shown.add(id); } else { shown.delete(id); hidden.add(id); }
  app.store.set({ hiddenStructures: hidden, shownStructures: shown });
}

/**
 * Show meshes for the duration of a teaching mode (a syndrome, a pathway, a quiz reveal, a topic) and hand back
 * the function that undoes exactly that. Only meshes that are not visible right now are touched, and each one
 * goes back to the override it had before (shown, hidden or neither): a mesh that was on screen through its
 * system's defaults was never "shown" by the mode, so leaving the mode cannot hide anatomy the reader had.
 */
export function showForMode(app: App, ids: Iterable<string>): () => void {
  const s = app.store.get();
  const prior = new Map<string, 'shown' | 'hidden' | 'none'>();
  const hidden = new Set(s.hiddenStructures); const shown = new Set(s.shownStructures);
  for (const id of ids) {
    if (prior.has(id) || !app.registry.byId.has(id) || meshShouldBeVisible(app, id)) continue;
    prior.set(id, shown.has(id) ? 'shown' : hidden.has(id) ? 'hidden' : 'none');
    hidden.delete(id); shown.add(id);
  }
  if (prior.size) app.store.set({ hiddenStructures: hidden, shownStructures: shown });
  let done = false;
  return () => {
    if (done) return; done = true;
    if (!prior.size) return;
    const st = app.store.get();
    const h = new Set(st.hiddenStructures); const sh = new Set(st.shownStructures);
    for (const [id, was] of prior) { h.delete(id); sh.delete(id); if (was === 'shown') sh.add(id); else if (was === 'hidden') h.add(id); }
    app.store.set({ hiddenStructures: h, shownStructures: sh });
  };
}

/**
 * Show or hide every mesh of a tree group at once (a system row or a subsystem row).
 * Ticking a group means "show all of it", so meshes the manifest hides by default come on too;
 * unticking hides them whatever their system flag says. Pass `system` for a whole-system row so
 * the system flag follows the same click.
 */
export function toggleGroup(app: App, meshIds: Iterable<string>, on: boolean, system?: SystemId): void {
  const s = app.store.get();
  const hidden = new Set(s.hiddenStructures); const shown = new Set(s.shownStructures);
  for (const id of meshIds) {
    if (on) { hidden.delete(id); shown.add(id); } else { shown.delete(id); hidden.add(id); }
  }
  const patch: Partial<AppState> = { hiddenStructures: hidden, shownStructures: shown };
  if (system) { const v = new Set(s.visibleSystems); if (on) v.add(system); else v.delete(system); patch.visibleSystems = v; }
  app.store.set(patch);
}

/** Master switch behind the tree's "All structures" box: every mesh in the atlas on, or nothing at all. */
export function setAllSystems(app: App, on: boolean): void {
  const s = app.store.get();
  if (!on) { app.store.set({ visibleSystems: new Set<SystemId>(), hiddenStructures: new Set<string>(), shownStructures: new Set<string>() }); return; }
  const shown = new Set<string>(app.manifest.meshes.filter((m) => s.showNc || !m.nc).map((m) => m.id));
  app.store.set({ visibleSystems: new Set<SystemId>(app.manifest.systems.map((x) => x.id)), hiddenStructures: new Set<string>(), shownStructures: shown });
}

/** Back to the manifest's own defaults (the view you get on a fresh load). */
export function resetSystems(app: App): void {
  app.store.set({
    visibleSystems: new Set<SystemId>(app.manifest.systems.filter((x) => x.defaultVisible).map((x) => x.id)),
    hiddenStructures: new Set<string>(), shownStructures: new Set<string>(),
  });
}

/** Show only this group: everything else off, the group fully on. */
export function soloGroup(app: App, meshIds: Iterable<string>): void {
  app.store.set({ visibleSystems: new Set<SystemId>(), hiddenStructures: new Set<string>(), shownStructures: new Set(meshIds) });
}

export function selectStructure(app: App, id: string | null, opts: { moveSlices?: boolean; ensureVisible?: boolean; fit?: boolean } = {}): void {
  const s = app.store.get();
  if (id && opts.ensureVisible !== false && !meshShouldBeVisible(app, id)) setStructureVisible(app, id, true);
  app.store.set({ selectedId: id, selectedStructureId: null });
  if (id) {
    void app.registry.ensureFull(id).then((mesh) => {
      // a slower load must not move the slices or the camera to something no longer selected
      if (!mesh || app.store.get().selectedId !== id) return;
      const entry = app.registry.byId.get(id)!;
      if (opts.moveSlices !== false && !app.store.get().slices.pinned) {
        const c = entry.centroid;
        setSlices(app, { sagittal: Math.round(c[0]), coronal: Math.round(c[1]), axial: Math.round(c[2]) });
      }
      if (opts.fit) app.sm.fitToBox(new THREE.Box3(new THREE.Vector3(...entry.bbox[0]), new THREE.Vector3(...entry.bbox[1])).expandByScalar(15));
      applyStates(app);
    });
  }
}

export function setHover(app: App, id: string | null): void {
  if (app.store.get().hoverId !== id) app.store.set({ hoverId: id });
}

export function setSlices(app: App, pos: Partial<Record<Axis, number>>): void {
  const s = app.store.get();
  app.store.set({ slices: { ...s.slices, ...pos } });
}

export function setSliceVisible(app: App, axis: Axis, v: boolean): void {
  const s = app.store.get();
  app.store.set({ slices: { ...s.slices, visible: { ...s.slices.visible, [axis]: v } } });
}

/** A contrast this edition does not ship (a `?c=subject-…` link opened against a bundle without that scan) is ignored. */
export function setContrast(app: App, c: Contrast): void { if (app.manifest.volumes[c]) app.store.set({ contrast: c }); }

/** The intensity contrasts in menu order: the template's T1 and T2, then every subject scan the manifest carries. */
export function contrasts(app: App): Contrast[] {
  const subjects = Object.entries(app.manifest.volumes).filter(([k, v]) => v.kind === 'subject' && k.startsWith('subject-')).map(([k]) => k as Contrast);
  return (['t1w', 't2w'] as Contrast[]).filter((k) => app.manifest.volumes[k]).concat(subjects);
}

export function setPeel(app: App, axis: Axis, side: 'positive' | 'negative' | null): void {
  const peel = { ...app.store.get().peel };
  if (side) peel[axis] = side; else delete peel[axis];
  app.store.set({ peel });
}

export function applyCameraPreset(app: App, name: PresetName): void {
  const target = app.sm.controls.target.clone();
  applyPreset(name, app.sm, target);
  const peel = { ...app.store.get().peel };
  if (name === 'medial-l') { peel.sagittal = 'positive'; setSlices(app, { sagittal: 0 }); }
  else if (name === 'medial-r') { peel.sagittal = 'negative'; setSlices(app, { sagittal: 0 }); }
  app.store.set({ camera: name, peel });
}

export function sameSet<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean { return setEq(a, b); }
