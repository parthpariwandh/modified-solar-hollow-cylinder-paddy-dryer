# SolidWorks reference model — 100 kg calculation case
**Review v1.0, 27 November 2026.** No native SolidWorks instance was available; STEP files were generated with CadQuery/OpenCascade and are geometrically valid solids, not a SolidWorks feature history.

## Dimensions (mm; exact reference)
| Part | Outer diameter | Inner diameter | Length | Nominal wall |
|---|---:|---:|---:|---:|
| Outer absorber | 670 | 666 | 600 | 2 |
| Inner shell | 250 | 247.6 | 600 | 1.2 |
Radial bed gap: 208. Axis Z, base at Z=0. Height equals nominal fill for the simplified shell-only model. Freeboard, inlet floor, core cap/damper, base ring, supports, hood and discharge are deliberately excluded. No dimensional tolerances are approved; discuss rolled-sheet roundness, seams, clearance and alignment with supervisor/workshop.

## Parametric rebuild
1. File > New > Part, MMGS units. On Top Plane start sketch. Add two center-point circles centered at origin; apply concentric and origin/coincident relations, Smart Dimension diameters 670 and 666. Verify sketch fully defined (black entities) and no redundant relation. Optionally use global variables `D_outer=670`, `t_outer=2`, `L=600`, inner diameter equation `D_outer-2*t_outer`.
2. Features > Extruded Boss/Base > Blind 600 mm. Save as `Outer_Absorber.SLDPRT` locally. Material: proposed galvanized steel substrate (actual grade to be confirmed), appearance matte black outside only. Do not assign a coating as a food-safe certification.
3. Create a separate part, repeat on Top Plane with diameters 250 and 247.6 and extrusion 600. Assign stainless steel 304 provisionally. Save as `Inner_Shell.SLDPRT`.
4. Create assembly, fix outer part, insert inner part. Mate cylindrical faces concentric and base planar faces coincident; lock rotation only if needed. Verify no interference using Evaluate > Interference Detection. The annulus gap should be 208 mm. Use Measure to confirm all diameters and height.
5. Optional visual pattern only after review: 1.5 mm inner holes on 6 mm triangular pitch. Use a tangent plane and a through-wall cut terminating at the inner face, not a cut across both walls. Stagger alternate axial rows by half pitch, row separation sqrt(3)/2 × pitch. Unrolled circumference is ~785 mm; choose whole pattern counts and seam margins after checking sheet manufacturer. Outer vents 2 mm holes on 12 mm pitch upper half only. Full pattern not modelled because fabrication detail is not approved. Use a simplified perforated-sheet appearance in large assemblies. Validate retention of small/broken grains and dust.
6. View > Section View through axis. Create Drawing from Assembly; insert front, top, right and isometric views and axial section. Add centerlines and exact reference dimensions. Label drawing preliminary; separate nominal CAD dimensions from supplier tolerances and grain-contact specifications.
7. For supplied STEP, File > Open > STEP, use 3D Interconnect or import solids; run Import Diagnostics and Measure. Save native parts/assembly on local SolidWorks installation. STEP will not automatically recreate constrained sketches; use steps 1–4 for editable feature tree.
8. Use `reference_shells.scad` in OpenSCAD or `build_cad.py` with CadQuery to reproduce the same geometry; STL files are millimetre tessellations for visualization, not manufacturing release. The exact analytical solid volumes are outer 2,518,300.67 mm³ and inner 562,772.34 mm³.

Official help: https://help.solidworks.com/2024/English/solidworks/sldworks/t_creating_an_extrude_feature.htm ; https://help.solidworks.com/2025/english/SolidWorks/sldworks/c_Step_Files.htm
