# User guide

Everything the atlas can do, for someone who has it running (the [README](../README.md) gets you there in three
lines). Hosting a copy, showing your own MRI and regenerating the data are in the
[developer guide](developing.md). Türkçe: [Kullanım kılavuzu](guide.tr.md).

## What is in it

| Kind | Count | Notes |
|---|---|---|
| Structures | 379 | deep cerebral veins, cord segments, lobes and gyri, hippocampal subfields, basal forebrain, thalamic and hypothalamic nuclei, brainstem nuclei, cerebellar lobules, white-matter tracts, arterial territories, ventricles, meninges, arteries, peripheral and cutaneous nerves, autonomic |
| Cranial nerves | 12 | nuclei, course, branches, reflexes, bedside tests, localising signs |
| Pathways | 25 | neuron chain, decussation, clickable waypoints, lesion effects by level |
| Syndromes | 125 | localisation, deficits with substrates, crossing logic, imaging, mimics, management pearls |
| Topics | 19 | development, CSF and the blood–brain barrier, neurotransmitters, sleep and EEG, epilepsy, headache, dementia, movement disorders, neuromuscular patterns, paediatric syndromes, localisation, imaging, stroke, infection, tumours, leukodystrophies, nerve injury, cortical layers, coma |
| Glossary | 205 | |
| Quiz | 60 | original vignettes; the answer spotlights the structures in 3D |
| Meshes | 587 public / 657 private | MNI atlases remeshed from label masks, the VENAT venous atlas, BodyParts3D and Z-Anatomy geometry registered by landmarks, and meshes constructed here from geometry no atlas provides (12 in both editions, 40 in the public one); 36 MB at full detail, about 3.5 MB on first paint |
| Citations | 2388 | to 657 open-access sources, across all 825 entries |

## Sections, tracts and territories

Every slice is the same MRI the meshes are registered to, so a structure can be read on the section and in
three dimensions at once. Click the slice to select what is under the cursor, or click a structure to move the
slices to it.

| | |
|---|---|
| ![Axial T1 through the internal capsule at z = 16 mm, the caudate and thalamus drawn over the slice and the left internal capsule outlined, its content panel open on the right](screenshots/axial-capsule.webp) | ![Coronal T1 at the hippocampal body, the lateral ventricles in blue and the hippocampi and amygdalae in pink over the slice, the left hippocampus outlined](screenshots/coronal-temporal.webp) |
| **Axial, through the internal capsule.** The label overlay paints the deep grey nuclei on the MRI; the selected structure is outlined. | **Coronal, at the hippocampus.** The temporal horn, the hippocampi and the amygdalae on the section that shows them. |
| ![Near-midline sagittal T1 with the left hemisphere peeled away, showing the corpus callosum, the lateral ventricle, the brainstem and the cerebellum painted on the section](screenshots/sagittal-midline.webp) | ![The left arcuate fasciculus arching over a sagittal T1 at x = -30 mm, with the tract atlas painted faintly on the slice and the tract tree open on the left](screenshots/tracts.webp) |
| **Sagittal, hemisected.** Peel mode hides everything on one side of the plane, so you look at the cut surface with the MRI behind it. | **Tracts.** Sixty white-matter bundles from the HCP1065 atlas, in 3D and painted on the slice. |
| ![Axial T1 tinted with the arterial territories, anterior cerebral in orange, middle cerebral in pink, posterior cerebral in blue, with the arteries in 3D](screenshots/territories.webp) | ![The sagittal slice continuing below the foramen magnum into the cord MRI, the cervical cord segment outlined in orange and the thoracic segment in green](screenshots/cord-mri.webp) |
| **Arterial territories.** The territory tint answers "which vessel would do this?" on the section itself. | **The cord.** Below the foramen magnum the slices continue into a cord MRI reformatted along the atlas's own cord, with the spinal levels painted. |

## Features

- **One coordinate frame.** Meshes, T1/T2 volumes, label volumes and the cord MRI are all MNI152NLin2009cAsym RAS mm.
- **Tree, search and selection.** Tri-state checkboxes per system and subsystem, an all-structures master switch, Alt-click to solo a group, and a search over structures, pathways and syndromes (`>` for syndromes only).
- **3D view.** Orbit, pan and zoom toward the cursor; click a mesh or the MRI slice to select, double-click to frame it; eight camera presets on keys `1`–`8`. Physically based materials with an anatomical palette, and a **Quality** switch for ambient occlusion, soft shadows and anti-aliasing.
- **Slices.** Axial, coronal and sagittal with T1/T2, peel modes, arterial-territory tint, label outlines and an "all labels" paint; the cord MRI switches itself on as soon as a slice reaches the foramen magnum, names the spinal level under the cursor and lets you click one to select that cord segment.
- **Syndrome mode.** `#/syndrome/<id>` dims the scene, highlights the involved structures, places the lesion marker and steps through the deficits; **Mirror** moves the lesion to the other side.
- **Your own MRI.** A personal T1 scan can be registered into the atlas space and shown on the slices next to the template's T1/T2, with every mesh and label already lined up on it — see [Showing your own MRI](developing.md#showing-your-own-mri) in the developer guide. Defaced before it ships, always.
- **Two languages.** English and Turkish, switched with the **TR / EN** button or `L`, kept in the URL so a link opens in the language it was copied in.
- **Everything addressable.** `#/structure/<id>`, `#/pathway/<id>`, `#/syndrome/<id>?step=n&side=l`, `#/topic/<id>`, `#/glossary`, `#/quiz`, `#/about`. Press `?` for the shortcuts.
- **Share view.** The toolbar's **Share view** copies a link that reproduces the scene exactly — camera, visible structures, slices, peels, contrast, open panel — where a plain link carries only the route and the slice positions.
- **Quiz that remembers.** Answers stay in your browser across reloads; filter the vignettes by type or difficulty, or review only the ones you missed.

## Keyboard shortcuts

Press `?` in the app for this list.

| Key | Does |
|---|---|
| `1`–`8` | camera presets: lateral (L), lateral (R), anterior, posterior, superior, inferior, medial (L), medial (R) |
| `a` / `c` / `s` | toggle the axial / coronal / sagittal slice |
| `↑` / `↓` | move the last touched slice by 1 mm |
| `t` | cycle the contrast: T1 / T2 / your own scan |
| `p` | peel at the last slice toggled with `a` / `c` / `s` (each slider also has a peel menu) |
| `[` / `]` | toggle the left / right panel |
| `f` | search |
| `A`–`E` | answer the open quiz vignette; `←` / `→` move between vignettes |
| `L` | switch language (English / Türkçe) |
| `Esc` | clear the selection / leave a syndrome |
| `Shift+S` | screenshot of the 3D view |
| `Shift`+click | select without moving the slices |
| `Alt`+click a system or group in the tree | show only that group |
| double-click | frame the clicked structure; on empty space, re-centre on the brain |

## Links and sharing a view

Every route is a hash: `#/structure/<id>`, `#/pathway/<id>`, `#/syndrome/<id>?step=n&side=l`, `#/topic/<id>`,
`#/glossary`, `#/quiz`, `#/about`. A plain link also carries the slice positions (`ax`, `cor`, `sag`), a
non-default contrast (`c=t2w`, `c=subject-<id>`) and a non-default language (`lang=tr`), so the address bar is
always a link to roughly what you see.

**Share view** in the toolbar writes the *exact* scene into the link and copies it: camera position and
target, the visible systems and per-structure overrides, which slices are on, the peels, the pin, the contrast
and the open panel. Ordinary links stay short; the long form is only written when you ask for it.

## Content and citations

**Every non-glossary entry cites open-access sources only**: StatPearls chapters on the NCBI Bookshelf, articles in PubMed Central, openly licensed reference pages. No printed textbook is cited anywhere in the shipped atlas, and no paywalled article. Today that is **2388 citations over 657 sources**, and a citation names the section it came from, read from the live chapter.

`verified: true` on a bibliography entry is only ever written by a tool from live source metadata, never by hand. The build fails on an unknown reference, and `npm run citations:check` fails on a malformed citation, an unverified entry or an entry nothing cites. See [Content and citations](content.md) for the schemas, the authoring tools and the rules.

## Turkish edition

The interface exists in English and Turkish (`src/i18n/en.ts` and `src/i18n/tr.ts`, 293 strings, the Turkish table typed against the English one so a missing key fails the typecheck). In Turkish mode structures, cranial nerves and pathways are named the way Turkish medical teaching names them — by their Latin term, from FIPAT's *Terminologia Neuroanatomica* and *Terminologia Anatomica 2* — with the English name as a secondary line.

All 825 entries' clinical prose is translated too, as overlays under `content/i18n/tr/` that pin a hash of the English text they were made from, so an English edit shows up as stale rather than as silently wrong Turkish.

![The atlas in Turkish: the structure tree and panel naming structures by their Latin terms with the English name beneath, the interface in Turkish, and the machine-assisted translation notice along the foot of the 3D view](screenshots/turkish.webp)

> **The Turkish clinical prose is a machine-assisted translation and is still under specialist review.** It has been checked mechanically and for terminology, but not by a Turkish neurologist. Where the two texts differ, the English is the reference. The app says so in Turkish mode, and an entry whose translation is missing or stale carries an *English* tag instead.

[The Turkish edition](turkish-edition.md) covers the terminology table, the overlay format and the tooling.

## Beyond the app

Everything below needs more than `npm start` and lives in the [developer guide](developing.md):

- **Hosting a copy.** `npm run build` writes a static `dist/` that any web server can serve — [Hosting a copy](developing.md#hosting-a-copy).
- **Your own MRI on the slices.** A personal T1 scan can be registered into the atlas space, defaced and shown next to the template's T1/T2 — [Showing your own MRI](developing.md#showing-your-own-mri).
- **Regenerating the data.** The bundle `npm start` downloads can be rebuilt from the source atlases — [Building the data yourself](developing.md#building-the-data-yourself).
- **The two editions.** The public edition leaves out four datasets whose licences forbid redistribution and substitutes openly licensed data for each — [The two editions](developing.md#the-two-editions).

## Licences and attribution

| What | Licence | File |
|---|---|---|
| Code (`src/`, `scripts/`, `pipeline/`, `tools/`, `blender/`) | Apache License 2.0 | [LICENSE](../LICENSE) |
| Authored content (`content/`) | CC BY-SA 4.0 | [content/LICENSE](../content/LICENSE) |
| Generated data (`public/data/`) | CC BY-SA 4.0 | written by the pipeline into `public/data/LICENSE` |

The meshes and volumes are **derivatives** of the third-party datasets listed in [NOTICE](../NOTICE), used under their own licences, with changes: registration into MNI152NLin2009cAsym space, remeshing of the label masks through a signed-distance field, smoothing, decimation to per-class triangle budgets, welding of neighbouring parcels, relabelling and recolouring, and the construction of meshes no source atlas provides. Each source licence keeps applying to what is derived from it, alongside CC BY-SA 4.0.

`NOTICE` is generated, never edited by hand — one block per dataset with its citation, licence and download URLs — and `npm run notice -- --check` fails if it is stale. Verbatim licence texts ship with the data in `public/data/licenses/`. In the app, **About** (or `#/about`) lists every source in the loaded build with its licence, its citation and a link to the full text.

**How to cite:** Ayci B. *Clinical Neuroanatomy Atlas*, v1.0.3, 2026. Code Apache 2.0, data and content CC BY-SA 4.0, derived from the datasets in `NOTICE`. Cite the source datasets themselves when you use the meshes, and the open-access references in `content/bibliography/` for the text.

## Known limitations

- **The Turkish clinical prose has not been reviewed by a clinician** (see above). The English text is the reference.
- **The atlas is a template, not a patient.** Group-average parcellations and one registered specimen; nothing in it is a measurement of an individual.
- **The public edition's brainstem nuclei are location markers**, not delineations: ellipsoids of the published volume placed against open landmarks, because no openly licensed 7 T nucleus atlas exists to copy. They are honest about their own construction in the panel and in `manifest.derived`.
- **Some structures have no mesh in either edition.** The thalamostriate vein is not separable from the internal cerebral vein in the venous atlas, and a handful of entries are text-only for the same kind of reason.
- **Twelve meshes are constructed, not segmented** — the phrenic nerves, cord segment blocks, the lumbosacral trunk, the fourth-ventricle choroid plexus — and are flagged as schematic wherever they appear.
- **General neuron and glial biology is covered only where it touches a topic** (transmitters, nerve injury, cortical layers).
- **Built for a desktop window.** Below 1100px the panels narrow, and below 900px they float over the 3D view and start closed, so the atlas stays usable on a tablet or a half-width window — but the three-column layout is still what it is designed around, and a phone gets a workable 3D view rather than a phone interface.

## Roadmap

- A Turkish neurologist's review of the translated prose, entry by entry.
- A licence for the PAM50 template. `pipeline/raw/pam50/LICENSE_REQUEST_DRAFT.txt` is a drafted, unsent request; if the authors state one, the private cord MRI, the measured cord segments and the PAM50-cut filum could all ship publicly and the two editions would differ by that much less.
- More of the peripheral nervous system: the current coverage is the clinically load-bearing nerves, not a complete peripheral atlas.
- A layout designed for phones, rather than the desktop one degrading gracefully.
