# Test report

Date: 27 November 2026. Local review only. This is not a public deployment.

## Formula checks

`node --experimental-strip-types --test src/lib/dryer/model.test.ts` passed.

The reference case matches `master_specification.json` for water removed, dry solids, final mass, required volume, annulus area, capacity, required outer diameter, radial gap, humidity ratios, dry air flow, volume flow, superficial velocity, refined and legacy bed pressure drop, useful heat, the 1.5 allowance, air preheat, bed enthalpy rise, gross solar, and both open fractions.

Guards that passed: NaN input, zero duration, negative thickness, relative humidity above 100 percent, overlapping shells, wet basis and dry basis conversion, a changed moisture, a changed voidage, empty kinetics input, and a user supplied CSV that is labelled as not a project measurement.

## Browser checks

Playwright, headless Chromium, against the local dev server.

| Width | Horizontal scroll | Water at 22 percent | Water at 25 percent | After reset | Invalid 200 mm shell blocked | Lab case asks for thickness | Canvas | Page errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 390 | none | 9.302 kg | 12.791 kg | 9.302 kg | yes | yes | yes | none |
| 768 | none | 9.302 kg | 12.791 kg | 9.302 kg | yes | yes | yes | none |
| 1440 | none | 9.302 kg | 12.791 kg | 9.302 kg | yes | yes | yes | none |

Section, explode, and top camera controls ran without a page error. The silent video reports duration 227 seconds and stays paused until played. The technical report PDF link resolves to `/assets/docs/JU_Technical_Report.pdf`.

A combined desktop and mobile smoke pass reported no console errors and no horizontal overflow. The one second smoke snapshot did not always see the WebGL canvas, because the shell view mounts after the page hydrates. The longer Playwright pass did see the canvas.

## Production build

`npm run build` completed. The built server was opened locally and checked with the same desktop and mobile smoke script, using the dev page text as the baseline. The built page matched the dev page (same visible text, no horizontal overflow, no console errors, no page errors). That local production check is not a public URL.
