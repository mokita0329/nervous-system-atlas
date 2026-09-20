# <img src="docs/icon/icon.png" alt="" height="40" align="absmiddle"> Clinical Neuroanatomy Atlas

A browser-based 3D atlas of clinical neuroanatomy: 587 meshes and synchronised MRI slices in one MNI
coordinate frame, arterial territories, traced pathways, a lesion mode that shows what a syndrome does and why,
clinical topics, a glossary and a quiz — in English and Turkish, with every entry cited to open-access sources.
It runs from static files, with no server and no account.

**[Open the live demo →](https://aycibatuhan.github.io/nervous-system-atlas/)** — nothing to install.
Türkçe: [README](docs/README.tr.md) · [Kullanım kılavuzu](docs/guide.tr.md)

## Quick start

With [Node.js](https://nodejs.org) 22 or newer installed:

```bash
git clone https://github.com/aycibatuhan/nervous-system-atlas.git
cd nervous-system-atlas
npm start
```

The first run installs the dependencies and downloads the atlas data (49 MB), then opens the app at
<http://localhost:5173>. From then on `npm start` just starts it.

![The atlas on first paint: the cortical surface and the vessels in the 3D view, the structure tree on the left, the slice controls along the foot of the window](docs/screenshots/overview.webp)

## What it looks like

| | |
|---|---|
| ![An axial T1 slice with the deep grey nuclei painted on it and the putamen outlined in orange, its content panel open on the right](docs/screenshots/slices-mri.webp) | ![The lateral medullary syndrome in lesion mode: the scene dimmed to the involved structures, the lesion marker on the left medulla, and the deficit table stepping through the signs](docs/screenshots/syndrome-wallenberg.webp) |
| **Slices and 3D in one frame.** Click the MRI to select a structure, or a structure to move the slices. | **Lesion mode.** A syndrome dims the scene to what it involves and steps through its deficits. |
| ![The lateral corticospinal tract with its neuron chain, decussation and numbered course in the right-hand panel](docs/screenshots/pathway.webp) | ![The cranial nerves seen from below with the arteries, the trigeminal nerve selected and its course, nuclei and branches listed](docs/screenshots/cranial-nerves.webp) |
| **Pathways.** Neuron chain, where it crosses, and every station as a clickable waypoint. | **Cranial nerves.** Nuclei, course, branches, reflexes, bedside tests and localising signs. |
| ![A clinical vignette asking where the lesion is, with five answer options](docs/screenshots/quiz.webp) | ![The same syndrome page in Turkish, with Latin structure names and the machine-assisted translation notice along the foot of the view](docs/screenshots/turkish-syndrome.webp) |
| **Quiz.** 60 original vignettes; answering spotlights the structures in 3D. | **Turkish.** The whole interface and all the clinical prose, structures named in Latin. |

> **Not for clinical use.** This is an educational reference. Its structures are group-average templates and a registered specimen, not any patient's anatomy, and its clinical text is a teaching summary that may be incomplete, out of date or wrong. Nothing in it is medical advice; clinical decisions belong to qualified clinicians using current guidelines and the patient's own findings.

## Documentation

| If you want to… | Read |
|---|---|
| use the atlas — every feature, the keyboard shortcuts, links that reproduce a view, what is in it, its limitations | [User guide](docs/guide.md) · [Türkçe](docs/guide.tr.md) |
| host a copy, show your own MRI on the slices, regenerate the data, run the checks, or work on the code | [Developer guide](docs/developing.md) |
| send a change back — the branch rules, what must never be committed, the content and translation rules | [Contributing](CONTRIBUTING.md) |
| see what changed in each version | [Changelog](CHANGELOG.md) |

## Licence

The code is Apache-2.0 ([LICENSE](LICENSE)); the authored content and the generated data are CC BY-SA 4.0
([content/LICENSE](content/LICENSE)). The meshes and volumes are derivatives of the datasets credited in
[NOTICE](NOTICE) and in the app's **About** panel, each under its own licence. How to cite the atlas and its
sources: [user guide](docs/guide.md#licences-and-attribution).

## Contact

Batuhan Ayci, <batuhanayci@gmail.com>. Pull requests are welcome — read [CONTRIBUTING.md](CONTRIBUTING.md)
first. Licence, redistribution or data-integrity concerns go to the address in [SECURITY.md](SECURITY.md)
rather than a public issue; clinically wrong content is an ordinary issue, and a welcome one.
