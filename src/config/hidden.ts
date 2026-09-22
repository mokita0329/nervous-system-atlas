/**
 * What the lesion simulator does not put on screen.
 *
 * Two different reasons, kept apart on purpose.
 *
 * The systems below are switched off because the question here is "what does this lesion cost the patient",
 * and arteries, veins, peripheral nerves and the skull envelope answer a different one. Every mesh the atlas
 * dims sits at 3 % opacity, but ninety of them stacked along the line of sight still add up to an opaque wall,
 * so leaving them on does not merely clutter the view — it hides the lesion inside it.
 *
 * The meshes below are switched off because they are in the wrong place. The dura and the tentorium come from
 * BodyParts3D, carried into MNI space by an affine fitted on deep landmarks, and on the convexity that lands
 * them 15-18 mm off (`docs/pipeline.md:34`) — the tentorium ends up embedded in the occipital lobe rather than
 * between it and the cerebellum. They are not wrong enough to be worth removing from the atlas, and far too
 * wrong to draw a lesion against.
 *
 * Both lists are reversible in one line, and neither is applied in atlas mode.
 */
import type { SystemId } from '../types/manifest.ts';

/** Systems the simulator starts with switched off. */
export const SIM_HIDDEN_SYSTEMS: readonly SystemId[] = [
  'arteries', 'arterial-territories', 'venous', 'peripheral', 'autonomic', 'meninges',
];

/** Individual meshes hidden wherever they appear, because their position is not trustworthy. */
export const MISPLACED_MESHES: readonly string[] = [
  'dura-mater-cranial', 'tentorium-cerebelli', 'falx-cerebri', 'spinal-dura',
];
