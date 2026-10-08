// The see-through view decides two things without a browser, and both are easy to get wrong in a way that only
// shows as a picture: which of the structures a lesion reaches are drawn faint instead of lit, and which systems
// it takes away. Lighting a tract map or the hemisphere's white matter solid rebuilds the wall the view removes;
// hiding the internal capsule would hide the structure a capsular lacune is about.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { installBvh } from '../src/picking/bvh.ts';
import { faintInGlass, GLASS_HIDDEN_SYSTEMS, GLASS_LANDMARK_SYSTEMS } from '../src/sim/view.ts';
import { pointInMesh } from '../src/sim/probe.ts';

describe('what the see-through view draws faint', () => {
  it('draws the long tracts and the hemispheres\' white matter faint', () => {
    expect(faintInGlass({ id: 'tract-corticospinal-l', system: 'tracts' })).toBe(true);
    expect(faintInGlass({ id: 'tract-optic-radiation-r', system: 'tracts' })).toBe(true);
    expect(faintInGlass({ id: 'cerebral-white-matter-l', system: 'cerebrum' })).toBe(true);
    expect(faintInGlass({ id: 'cerebral-white-matter-r', system: 'cerebrum' })).toBe(true);
  });

  it('keeps lit the structures a lesion is read by: the capsule, the nuclei, the gyri', () => {
    for (const [id, system] of [
      ['internal-capsule-l', 'cerebrum'], ['corpus-callosum', 'cerebrum'], ['thalamus-ventrolateral-l', 'diencephalon'],
      ['putamen-l', 'basal-ganglia'], ['dkt-precentral-l', 'cerebrum'], ['brainstem', 'brainstem'],
    ] as const) expect(faintInGlass({ id, system }), id).toBe(false);
  });

  it('treats an unknown mesh as lit rather than guessing', () => {
    expect(faintInGlass(undefined)).toBe(false);
  });
});

describe('what the see-through view takes away and keeps', () => {
  it('takes the cortex away and keeps the landmarks, never both for one system', () => {
    expect(GLASS_HIDDEN_SYSTEMS).toContain('cerebrum');
    for (const sys of ['brainstem', 'cerebellum', 'ventricles-csf', 'envelope'] as const) expect(GLASS_LANDMARK_SYSTEMS).toContain(sys);
    expect(GLASS_HIDDEN_SYSTEMS.filter((s) => GLASS_LANDMARK_SYSTEMS.includes(s))).toEqual([]);
  });

  it('does not hide the systems the deep lesions are read in', () => {
    for (const sys of ['diencephalon', 'basal-ganglia', 'brainstem'] as const) expect(GLASS_HIDDEN_SYSTEMS).not.toContain(sys);
  });
});

describe('"the lesion is in this structure" does not depend on the view', () => {
  // The see-through view draws front faces only and the MRI view, peeled, draws both: the inside test must give
  // the same answer either way, or the panel's "the lesion is in here" flips when the view is switched.
  installBvh();
  const box = (): THREE.Mesh => {
    const g = new THREE.BoxGeometry(20, 20, 20).toNonIndexed();
    g.computeBoundingBox();
    (g as THREE.BufferGeometry & { computeBoundsTree(): void }).computeBoundsTree();
    return new THREE.Mesh(g, new THREE.MeshBasicMaterial());
  };
  for (const side of [THREE.FrontSide, THREE.BackSide, THREE.DoubleSide]) {
    it(`answers the same with the material drawn ${side === THREE.FrontSide ? 'front' : side === THREE.BackSide ? 'back' : 'double'}-sided`, () => {
      const m = box(); (m.material as THREE.Material).side = side;
      // off-centre: a ray from the exact centre runs along the diagonal that splits each face into two triangles
      expect(pointInMesh(m, new THREE.Vector3(1, 2, 3))).toBe(true);
      expect(pointInMesh(m, new THREE.Vector3(4, -3, 2))).toBe(true);
      expect(pointInMesh(m, new THREE.Vector3(15, 0, 0))).toBe(false);
      expect((m.material as THREE.Material).side).toBe(side);   // and the drawing is left as it was
    });
  }
});
