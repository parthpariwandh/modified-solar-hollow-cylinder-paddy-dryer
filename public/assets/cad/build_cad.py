"""Reference shell-only geometry; perforations, floor, mounts and connections intentionally omitted."""
import cadquery as cq
from pathlib import Path
p=Path(__file__).parent
outer=cq.Workplane('XY').circle(335).circle(333).extrude(600)
inner=cq.Workplane('XY').circle(125).circle(123.8).extrude(600)
assembly=cq.Assembly(name='Reference_shells'); assembly.add(outer,name='outer_absorber',color=cq.Color(.15,.18,.21));assembly.add(inner,name='inner_shell',color=cq.Color(.72,.75,.78));assembly.save(str(p/'reference_shells.step'))
for name,part in [('outer_shell',outer),('inner_shell',inner)]:
 cq.exporters.export(part,str(p/(name+'.step')));cq.exporters.export(part,str(p/(name+'.stl')),tolerance=.05,angularTolerance=.05);print(name,part.val().isValid(),part.val().Volume(),part.val().BoundingBox().zlen)
