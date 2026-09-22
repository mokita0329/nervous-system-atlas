import * as THREE from 'three';
import type { App } from '../app.ts';
import type { Tract, TractPoint } from '../tracts/index.ts';

/**
 * Draws one schematic tract curve into the scene's overlay group, as two tubes — before and after the
 * decussation — so the crossing is a change of colour and not a guess, plus a small sphere on every station.
 *
 * The tubes ignore the depth buffer (`depthTest: false`, drawn last). A pathway's own structures are opaque
 * while it is open, so a depth-tested curve would vanish inside the internal capsule and the brainstem — which
 * is exactly the part a reader wants to follow. Everything else in the scene is at 3 % opacity in this mode,
 * so there is nothing else for the curve to sit wrongly in front of.
 */
const DEFAULT_RADIUS = 1.3;
const STATION_RADIUS = 1.9;

export class TractLayer {
  private group = new THREE.Group();
  /** station spheres in point order, with the waypoint each belongs to */
  private stations: { w: number | undefined; pos: THREE.Vector3; mesh: THREE.Mesh; cross: boolean }[] = [];
  private tract: Tract | null = null;

  constructor(private app: App) {
    this.group.name = 'tract';
    this.group.renderOrder = 30;
    app.sm.overlayRoot.add(this.group);
  }

  /** A control point in MNI millimetres: a mesh centroid (plus any offset) or a written coordinate. */
  private resolve(p: TractPoint): THREE.Vector3 | null {
    if (p.mni) return new THREE.Vector3(p.mni[0], p.mni[1], p.mni[2]);
    if (!p.mesh) return null;
    const m = this.app.registry.byId.get(p.mesh);
    if (!m) return null;                                  // this edition does not ship that mesh
    const v = new THREE.Vector3(m.centroid[0], m.centroid[1], m.centroid[2]);
    if (p.offset) v.add(new THREE.Vector3(p.offset[0], p.offset[1], p.offset[2]));
    return v;
  }

  private tube(points: THREE.Vector3[], radius: number, colour: THREE.Color): void {
    if (points.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const geo = new THREE.TubeGeometry(curve, Math.max(40, points.length * 30), radius, 12, false);
    const mat = new THREE.MeshStandardMaterial({
      color: colour, emissive: colour.clone().multiplyScalar(0.25), roughness: 0.45, metalness: 0,
      depthTest: false, depthWrite: false, transparent: true, opacity: 0.97,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 31;
    this.group.add(mesh);
  }

  show(tract: Tract): void {
    this.clear();
    this.tract = tract;
    const pts: { p: TractPoint; v: THREE.Vector3 }[] = [];
    for (const p of tract.points) { const v = this.resolve(p); if (v) pts.push({ p, v }); }
    if (pts.length < 2) return;

    const before = new THREE.Color(tract.colour);
    const after = before.clone().lerp(new THREE.Color(0xffffff), 0.45);
    const crossAt = pts.findIndex((x) => x.p.cross);
    const radius = (i: number): number => pts[i]!.p.r ?? DEFAULT_RADIUS;
    if (crossAt <= 0) this.tube(pts.map((x) => x.v), radius(0), before);
    else {
      this.tube(pts.slice(0, crossAt + 1).map((x) => x.v), radius(0), before);
      this.tube(pts.slice(crossAt).map((x) => x.v), radius(crossAt), after);
    }

    for (const { p, v } of pts) {
      const cross = !!p.cross;
      const mat = new THREE.MeshStandardMaterial({
        color: cross ? 0xffc53d : 0xffffff, emissive: cross ? 0x6b4a00 : 0x333333,
        depthTest: false, depthWrite: false, transparent: true, opacity: 0.95, roughness: 0.4,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(cross ? STATION_RADIUS * 1.35 : STATION_RADIUS, 20, 14), mat);
      mesh.position.copy(v);
      mesh.renderOrder = 32;
      this.group.add(mesh);
      this.stations.push({ w: p.w, pos: v.clone(), mesh, cross });
    }
    this.app.sm.requestRender();
  }

  /** Enlarge the station of one waypoint (null clears). */
  highlight(w: number | null): void {
    for (const s of this.stations) {
      const on = w !== null && s.w === w;
      s.mesh.scale.setScalar(on ? 1.9 : 1);
      (s.mesh.material as THREE.MeshStandardMaterial).color.set(on ? 0xffe066 : s.cross ? 0xffc53d : 0xffffff);
    }
    this.app.sm.requestRender();
  }

  /** Where a waypoint's station sits, so the slices can be moved there. */
  positionOf(w: number): THREE.Vector3 | null {
    return this.stations.find((s) => s.w === w)?.pos.clone() ?? null;
  }

  get shown(): boolean { return !!this.tract; }

  clear(): void {
    for (const o of [...this.group.children]) {
      this.group.remove(o);
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material | undefined)?.dispose();
    }
    this.stations = [];
    this.tract = null;
    this.app.sm.requestRender();
  }
}
