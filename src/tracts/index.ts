/**
 * Schematic tract curves — the one thing this atlas could not show: a pathway as an unbroken line.
 *
 * The English content already says which stations a pathway passes and where it crosses
 * (`content/data/pathways/<id>.json`, `waypoints[].structureId` / `.sideRelativeToOrigin`), but four or five
 * consecutive waypoints of a descending tract all name the single `brainstem` mesh, so their centroids collapse
 * onto one point and no line can be read off them. A curve therefore needs control points of its own: anchored
 * to a mesh where one exists, and written as MNI millimetres where the mesh is the whole brainstem or cord.
 *
 * These curves are a teaching figure, not tractography: the stations, their order and the side they are on are
 * the atlas's, the shape between them is drawn. The panel says so wherever a curve is shown.
 */
import lateralCorticospinal from './pathway-lateral-corticospinal.json';

export interface TractPoint {
  /** the point is this mesh's centroid (`manifest.meshes[].centroid`), which keeps it on the real anatomy */
  mesh?: string;
  /** …or a plain MNI mm coordinate, for the places no mesh names on its own (inside the brainstem, along the cord) */
  mni?: [number, number, number];
  /** millimetres added to the mesh centroid */
  offset?: [number, number, number];
  /** tube radius in mm at this point (default 2.4) */
  r?: number;
  /** the fibres cross the midline here: the colour changes and the side flips from this point on */
  cross?: boolean;
  /** `order` of the pathway waypoint this point belongs to, so the step list can drive the curve */
  w?: number;
}

export interface Tract {
  /** id of the pathway entry this curve belongs to */
  pathway: string;
  /** the side the curve starts on (the mirror image is drawn from it) */
  side: 'l' | 'r';
  /** CSS colour before the decussation; after it the same colour lightened */
  colour: string;
  points: TractPoint[];
}

const TRACTS: Tract[] = [lateralCorticospinal as unknown as Tract];

export function tractFor(pathwayId: string): Tract | undefined {
  return TRACTS.find((t) => t.pathway === pathwayId);
}

/** Every pathway that has a curve, for the list panel's marker. */
export const TRACT_PATHWAYS: ReadonlySet<string> = new Set(TRACTS.map((t) => t.pathway));
