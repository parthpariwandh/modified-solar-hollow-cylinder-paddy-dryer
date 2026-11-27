// Hollow-cylinder paddy dryer — concept model
// Units: millimetres
// Open in OpenSCAD, or use as a dimension sheet while rebuilding in SolidWorks.
// Dimensions are STARTER values. They are not frozen.

$fn = 96;

// ----- Parameters (edit these) -----
H_shell     = 500;   // outer cylinder height
R_out       = 150;   // outer radius
t_out       = 3;     // outer wall
R_in        = 70;    // inner tube outer radius
t_in        = 2;     // inner wall
H_in        = 470;
z_shell     = 80;    // stand top to shell bottom
hole_d      = 4;     // perforation diameter  (smaller than a paddy grain)
hole_rows   = 10;
hole_around = 18;
stand_w     = 280;
stand_h     = 80;
leg         = 25;

module tube(h, r_out, t) {
    difference() {
        cylinder(h=h, r=r_out);
        translate([0,0,-1]) cylinder(h=h+2, r=r_out-t);
    }
}

module stand() {
    hw = stand_w/2;
    for (x=[-hw, hw-leg])
        for (y=[-hw, hw-leg])
            translate([x,y,0]) cube([leg,leg,stand_h]);
    translate([-hw,-hw,stand_h-leg]) cube([stand_w,leg,leg]);
    translate([-hw,hw-leg,stand_h-leg]) cube([stand_w,leg,leg]);
    translate([-hw,-hw,stand_h-leg]) cube([leg,stand_w,leg]);
    translate([hw-leg,-hw,stand_h-leg]) cube([leg,stand_w,leg]);
    translate([-hw,-hw,0]) cube([stand_w,leg,leg]);
    translate([-hw,hw-leg,0]) cube([stand_w,leg,leg]);
    translate([-hw,-hw,0]) cube([leg,stand_w,leg]);
    translate([hw-leg,-hw,0]) cube([leg,stand_w,leg]);
}

module outer_shell() {
    translate([0,0,z_shell])
        tube(H_shell, R_out, t_out);
}

module inner_shell() {
    translate([0,0,z_shell+15])
    difference() {
        tube(H_in, R_in, t_in);
        // perforations — visual only; in SolidWorks use Hole Wizard + Circular Pattern
        for (row=[0:hole_rows-1])
            for (k=[0:hole_around-1]) {
                z = 25 + row * (H_in-50)/(hole_rows-1);
                a = k*360/hole_around + (row%2)*180/hole_around;
                translate([0,0,z])
                    rotate([0,0,a])
                        rotate([0,90,0])
                            cylinder(h=R_in+5, r=hole_d/2, $fn=16);
            }
    }
}

module hopper() {
    translate([0,0,z_shell+H_shell])
        difference() {
            cylinder(h=120, r1=R_out, r2=90);
            translate([0,0,-1])
                cylinder(h=122, r1=R_out-t_out, r2=40);
        }
}

module discharge() {
    translate([0,0,30])
        difference() {
            cylinder(h=z_shell-30, r1=35, r2=R_out);
            translate([0,0,-1])
                cylinder(h=z_shell-28, r1=33, r2=R_out-t_out);
        }
}

stand();
color("DimGray") outer_shell();
color("Silver") inner_shell();
color("Gray") hopper();
color("Gray") discharge();
