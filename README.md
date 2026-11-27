# Modified Solar-Assisted Hollow-Cylinder Paddy Dryer

Preliminary portfolio for Parth Pariwandh, Jadavpur University, Department of Mechanical Engineering. Supervisor: Prof. Dulal Krishna Mandal.

This is a review copy. It is not a fabrication release, not a measured drying trial, and not an official university document. The working title still needs formal confirmation. Roll number and registration number are intentionally left off the pages.

AI assistance was used for the page, the compatible shell geometry, and the calculation check. Reproduce the arithmetic and the CAD, then obtain supervisor review before any build.

## What the page does

The reference case is the October 100 kg shell: 670 mm outer diameter, 2 mm outer wall, 250 mm inner diameter, 1.2 mm inner wall, 600 mm fill. The September starter (300 mm and 140 mm) and the October lab proposal (400 mm and 220 mm, about 24 kg) stay as separate choices. Lab wall thickness is not invented.

Numbers come from `src/data/master_specification.json`. The same equations are in `src/lib/dryer/model.ts` and in `public/assets/analysis/model.py`. `npm test` checks the TypeScript model against the JSON.

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```

`npm run dev` serves the site for local review. `npm test` runs the formula checks, including invalid inputs, moisture changes, voidage, and an uploaded kinetics file. `npm run build` produces the host build used by the connected publisher.

## Deployment

Do not publish a public URL until you approve it.

This app is a TanStack Start site. The production build is a server app for the connected host, not a folder you can drop onto GitHub Pages by itself. A repository is the source. A running public site is a separate decision.

The private source repository is [modified-solar-hollow-cylinder-paddy-dryer](https://github.com/parthpariwandh/modified-solar-hollow-cylinder-paddy-dryer). It stays private because the reports still include the roll number and the registration number, and this package is not an approved public release. The older public repository Solar-Assisted-Hollow-Cylinder-Paddy-Dryer is the 29 October note set only. It was not replaced.

Calculations run in the browser from the bundled model. They do not call an external formula service.

## Geometry files

STEP and STL files under `public/assets/cad` are smooth shells generated with CadQuery. They are not native SolidWorks parts, and they do not include holes, a floor, a stand, or a heater.
