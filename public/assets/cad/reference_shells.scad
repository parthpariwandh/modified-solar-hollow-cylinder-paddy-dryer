// mm. 100 kg calculation case, not fabrication approved. Smooth reference shells.
$fn=240;
D=670; t=2; d=250; ti=1.2; H=600;
assert(D-2*t>d && d>2*ti && H>0);
module tube(od,wall) { difference(){cylinder(d=od,h=H);translate([0,0,-1])cylinder(d=od-2*wall,h=H+2);} }
color([.15,.18,.21])tube(D,t);
color([.72,.75,.78])tube(d,ti);
