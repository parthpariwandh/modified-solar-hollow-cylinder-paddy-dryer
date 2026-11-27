import { useEffect, useMemo, useState } from "react";
import { Eq } from "@/components/dryer/Eq";
import { AirflowChart, ErgunChart } from "@/components/dryer/Charts";
import { DryerScene, type ViewMode } from "@/components/dryer/Scene";
import { Schematic } from "@/components/dryer/Schematic";
import { fmt } from "@/lib/dryer/format";
import {
  applyCase,
  exportPayload,
  formToEvaluation,
  geometryReady,
  payloadToCsv,
  referenceForm,
  type FormState,
} from "@/lib/dryer/form";
import { fitKinetics, parseMoistureCsv, type KineticOutcome } from "@/lib/dryer/kinetics";
import { airflowGrid, ergunGrid, SPEC } from "@/lib/dryer/model";

const NAV = [
  ["overview", "Overview"],
  ["literature", "Literature"],
  ["model", "Model"],
  ["theory", "Theory"],
  ["calculators", "Calculators"],
  ["gallery", "Gallery"],
  ["demonstration", "Demonstration"],
  ["roadmap", "Roadmap"],
  ["downloads", "Downloads"],
  ["references", "References"],
] as const;

const REFERENCES = SPEC.references;

export function Portfolio() {
  const [form, setForm] = useState<FormState>(() => referenceForm());
  const [view, setView] = useState<ViewMode>("iso");
  const [explode, setExplode] = useState(0);
  const [section, setSection] = useState(false);
  const [holes, setHoles] = useState(false);
  const [sceneOn, setSceneOn] = useState(false);
  const [fit, setFit] = useState<KineticOutcome | null>(null);
  const [xePct, setXePct] = useState(12);

  useEffect(() => setSceneOn(true), []);

  const ev = useMemo(() => formToEvaluation(form), [form]);
  const ready = geometryReady(form) && form.t_mm != null && form.ti_mm != null;
  const r = ev.results;

  function edit<K extends keyof FormState>(key: K, value: FormState[K], geometry = false) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (geometry && current.caseId !== "custom") {
        next.caseId = "custom";
        next.thicknessNote =
          "These dimensions were edited away from a named case. Do not read them as a second official geometry.";
      }
      return next;
    });
  }

  const flowRows =
    r != null
      ? airflowGrid(r.water_kg, r.specific_volume_m3_kg, [4, 6, 8], [0.005, 0.008, 0.01, 0.015, 0.02, 0.025, 0.03])
      : [];
  const ergunRows =
    r != null
      ? ergunGrid(
          form.L_mm / 1000,
          form.dp_mm / 1000,
          form.mu,
          r.rho_air,
          [0.4, 0.45, 0.5],
          Array.from({ length: 17 }, (_, i) => 0.02 + i * 0.01),
        )
      : [];

  function download(kind: "json" | "csv") {
    const payload = exportPayload(form, ev);
    const text = kind === "json" ? JSON.stringify(payload, null, 2) : payloadToCsv(payload);
    const blob = new Blob([text], { type: kind === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paddy-dryer-${SPEC.version}.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-paper text-navy">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="bg-navy text-paper">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <p className="text-xs font-medium tracking-widest text-teal uppercase">
            Jadavpur University · Department of Mechanical Engineering
          </p>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight md:text-5xl">
            Modified Solar-Assisted Hollow-Cylinder Paddy Dryer
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-paper/90">
            A static annular bed for drying paddy before milling. Clean air is forced from a bottom plenum. The dark outer wall can collect solar heat. Combustion products stay physically separate.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-paper/80">
            Parth Pariwandh, B.E. Mechanical Engineering, 2023 to 2027, Section A3. Supervisor: Prof. Dulal Krishna Mandal. Working title, pending formal confirmation. The earlier name was Solar-Assisted Hollow-Cylinder Mini Rice Mill. This portfolio covers the dryer module only.
          </p>
          <p className="mt-5 inline-block border border-amber bg-navy-deep px-3 py-2 text-sm text-paper" role="status">
            Current status: preliminary, untested, and not fabrication approved. No prototype, no measured drying rate, no CFD, and no FEA.
          </p>
        </div>
      </header>

      <nav aria-label="Portfolio" className="sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-1 md:px-4">
          {NAV.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-teal-ink hover:text-navy">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main id="content" className="mx-auto max-w-6xl space-y-16 px-4 py-10 md:px-6 md:py-14">
        <section id="overview" className="scroll-mt-24 space-y-6">
          <SectionTitle kicker="Overview" title="What this page is" />
          <p className="max-w-3xl leading-relaxed">
            The objective is to size and question a low capital batch dryer, then to say clearly what is still unmeasured. Fresh paddy carries water that can spoil the grain if drying is delayed. The worked target is 14 percent wet basis. Storage use can change that target. Hulling is outside this scope.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric value="100 kg" label="Reference batch for analysis only" />
            <Metric value="9.30 kg" label="Water removed, 22 to 14 percent wet basis" />
            <Metric value="670 mm" label="Reference outer diameter" />
            <Metric value="40 to 45 °C" label="Proposed first trial plenum air" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <CaseCard
              title="September starter"
              body="300 mm and 140 mm outside diameters. Outer height 500 mm, inner height 470 mm. Visual 4 mm holes in the starter file. Not the calculation case."
            />
            <CaseCard
              title="October lab proposal"
              body="400 mm and 220 mm outside diameters, 500 mm fill, about 24 kg. Suggested first build only after approval. Wall thickness is not stated."
            />
            <CaseCard
              title="October reference"
              body="670 mm and 250 mm outside diameters, 600 mm fill, nominal 100 kg. This is the analytical and smooth CAD case. It is not an approved operating mode."
            />
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-muted">
            Semesters 4.1 and 4.2 are one major project. Codes ME(M2)/Pr/B/S/414 and ME(M2)/Pr/B/S/423, 1.5 credits each, from Module 2 reproductions and prior planning. The official repository PDF was not directly accessible. Confirm the rubric with the department. Reproduced assessment is 100 marks each semester, 50 from the supervisor and 50 from the board. An S grade is not claimed.
          </p>
        </section>

        <section id="literature" className="scroll-mt-24 space-y-4">
          <SectionTitle kicker="Literature" title="What earlier dryers already show" />
          <p className="max-w-3xl leading-relaxed">
            Fixed beds dry through moving zones, and local equilibrium matters. Cross flow bins, radial flow bins, rotating solar drums and fluidized hybrid beds already exist. They do not copy onto this annulus. The proposed comparison is quantitative: open core against a capped core, and solar on against solar off, on the same bed. That is not a patent novelty claim.
          </p>
          <ul className="grid gap-3 md:grid-cols-2">
            <li className="border border-line bg-card p-4">FAO drying notes describe fixed bed zones and solar drying practice. They are precedent, not a validation of this shell.</li>
            <li className="border border-line bg-card p-4">Tohidi, Sadeghi and Torki-Harchegani report energy and quality effects of air temperature, velocity and humidity in deep bed paddy drying.</li>
            <li className="border border-line bg-card p-4">A perforated solar drum is a moving dryer. This project is a static annulus.</li>
            <li className="border border-line bg-card p-4">Radial and cross flow bins already move air through a perforated core or duct. Reported times are not this six hour assumption.</li>
          </ul>
        </section>

        <section id="model" className="scroll-mt-24 space-y-5">
          <SectionTitle kicker="Model" title="Shell geometry" />
          <p className="max-w-3xl text-sm leading-relaxed text-muted">{form.thicknessNote}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" data-testid="preset-reference" className="btn" onClick={() => setForm((c) => applyCase(c, "reference"))}>
              Reference 670 / 250
            </button>
            <button type="button" data-testid="preset-lab" className="btn" onClick={() => setForm((c) => applyCase(c, "lab"))}>
              Lab 400 / 220
            </button>
            <button type="button" className="btn" onClick={() => setForm((c) => applyCase(c, "september"))}>
              September 300 / 140
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Num id="D" testId="outer-od" label="Outer OD" unit="mm" value={form.D_mm} onChange={(v) => edit("D_mm", v ?? Number.NaN, true)} />
            <Num id="d" label="Inner OD" unit="mm" value={form.d_mm} onChange={(v) => edit("d_mm", v ?? Number.NaN, true)} />
            <Num id="t" label="Outer wall" unit="mm" value={form.t_mm} onChange={(v) => edit("t_mm", v, true)} />
            <Num id="ti" label="Inner wall" unit="mm" value={form.ti_mm} onChange={(v) => edit("ti_mm", v, true)} />
            <Num id="L" label="Fill height" unit="mm" value={form.L_mm} onChange={(v) => edit("L_mm", v ?? Number.NaN, true)} />
            <Num id="Ho" label="Outer shell height" unit="mm" value={form.outer_H_mm} onChange={(v) => edit("outer_H_mm", v ?? Number.NaN, true)} />
            <Num id="Hi" label="Inner shell height" unit="mm" value={form.inner_H_mm} onChange={(v) => edit("inner_H_mm", v ?? Number.NaN, true)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="space-y-3 lg:col-span-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Camera presets">
                {(["iso", "front", "side", "top"] as ViewMode[]).map((mode) => (
                  <button key={mode} type="button" data-testid={`camera-${mode}`} className="btn" aria-pressed={view === mode} onClick={() => setView(mode)}>
                    {mode === "iso" ? "Isometric" : mode[0].toUpperCase() + mode.slice(1)}
                  </button>
                ))}
                <button type="button" className="btn" onClick={() => setView("iso")}>Reset camera</button>
                <button type="button" data-testid="section-toggle" className="btn" aria-pressed={section} onClick={() => setSection((v) => !v)}>
                  {section ? "Close section" : "Clipping section"}
                </button>
                <button type="button" data-testid="explode-toggle" className="btn" aria-pressed={explode > 0} onClick={() => setExplode((v) => (v > 0 ? 0 : 1))}>
                  {explode > 0 ? "Assemble inner shell" : "Explode inner shell"}
                </button>
                <button type="button" className="btn" aria-pressed={holes} onClick={() => setHoles((v) => !v)}>
                  {holes ? "Hide hole suggestion" : "Show hole suggestion"}
                </button>
              </div>
              <label className="block text-sm" htmlFor="explode">
                Explode distance
                <input id="explode" className="mt-1 w-full" type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(Number(e.target.value))} />
              </label>
              {holes ? (
                <p className="border border-amber bg-warn px-3 py-2 text-sm text-navy">
                  Proposed pattern only: inner 1.5 mm holes on a 6 mm triangular pitch, outer 2 mm holes on a 12 mm pitch in the upper half. This drawing is visual. The STEP and STL files stay smooth. Nothing here is a manufacturing release.
                </p>
              ) : null}
              <div className="h-80 overflow-hidden border border-line bg-card md:h-96" data-testid="scene-canvas">
                {sceneOn && ready && form.t_mm != null && form.ti_mm != null ? (
                  <DryerScene
                    D_mm={form.D_mm}
                    d_mm={form.d_mm}
                    t_mm={form.t_mm}
                    ti_mm={form.ti_mm}
                    fill_mm={form.L_mm}
                    outer_H_mm={form.outer_H_mm}
                    inner_H_mm={form.inner_H_mm}
                    explode={explode}
                    section={section}
                    holes={holes}
                    view={view}
                    holeInner={form.inner_hole_mm}
                    pitchInner={form.inner_pitch_mm}
                    holeOuter={form.outer_hole_mm}
                    pitchOuter={form.outer_pitch_mm}
                  />
                ) : (
                  <p className="grid h-full place-items-center px-6 text-center text-sm text-muted">
                    {ready ? "Loading the shell view." : "The shell is hidden until the diameters and thicknesses are positive and do not intersect."}
                  </p>
                )}
              </div>
              <ul className="flex flex-wrap gap-4 text-sm" aria-label="Colour legend">
                <li><span className="mr-2 inline-block size-3 bg-navy align-middle" /> Dark outer absorber</li>
                <li><span className="mr-2 inline-block size-3 bg-amber align-middle" /> Annular paddy</li>
                <li><span className="mr-2 inline-block size-3 border border-line bg-card align-middle" /> Silver inner shell</li>
                <li>Empty core</li>
              </ul>
              <p className="text-sm text-muted">Orbit and zoom with the pointer or the keyboard focus on the view. Front and side match because the shell is round. Units on the drawing are millimetres. Analysis uses metres.</p>
            </div>
            <div className="space-y-3 lg:col-span-2">
              {ready && form.t_mm != null && form.ti_mm != null ? (
                <Schematic
                  D_mm={form.D_mm}
                  d_mm={form.d_mm}
                  t_mm={form.t_mm}
                  ti_mm={form.ti_mm}
                  fill_mm={form.L_mm}
                  outer_H_mm={form.outer_H_mm}
                  inner_H_mm={form.inner_H_mm}
                />
              ) : (
                <p className="border border-line bg-card p-4 text-sm">Dimensioned views wait for a valid thickness.</p>
              )}
              <dl className="grid grid-cols-2 gap-2 text-sm" data-testid="dimension-gap">
                <Dim k="Outer ID" v={r ? `${fmt(r.outer_ID_mm, 1)} mm` : "Not computed"} />
                <Dim k="Inner ID" v={r ? `${fmt(r.inner_ID_mm, 1)} mm` : "Not computed"} />
                <Dim k="Radial gap" v={r ? `${fmt(r.radial_gap_mm, 1)} mm` : "Not computed"} />
                <Dim k="Annulus area" v={r ? `${fmt(r.area_m2, 4)} m²` : "Not computed"} />
                <Dim k="Bed volume" v={r ? `${fmt(r.volume_m3, 4)} m³` : "Not computed"} />
                <Dim k="Capacity" v={r ? `${fmt(r.capacity_kg, 2)} kg` : "Not computed"} />
              </dl>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <p className="border border-line bg-card p-4 text-sm leading-relaxed">Proposed materials: SS304 on the grain side, galvanized steel outside with a matte black coat on the exterior only, and a verified clean surface inside. Galvanized duct and plenum, mild steel stand, and a refractory lined mild steel biomass chamber are proposals. Conductivities of 45 and 16 W/(m·K) are indicative only.</p>
            <p className="border border-line bg-card p-4 text-sm leading-relaxed">First trials stay at 40 to 45 °C plenum air. Source notes keep grain below about 50 °C, and a conservative late stage near 40 °C or lower still needs approval. Heat needs an independent cutout, an airflow interlock, a leak check, ventilation, and supervised review. No floor, stand, duct or exchanger in the CAD is approved for fabrication.</p>
          </div>
        </section>

        <section id="theory" className="scroll-mt-24 space-y-4">
          <SectionTitle kicker="Theory" title="Relations used on this page" />
          <div className="grid gap-3">
            <EqBlock title="Dry basis and water removed" tex={"X=\\dfrac{M}{1-M}\\qquad m_{ev}=m\\dfrac{M_i-M_f}{1-M_f}"} note="Wet basis M is water divided by wet mass. Final moisture is a fraction of the smaller final mass, so the water removed is not simply 8 kg." />
            <EqBlock title="Annulus" tex={"A=\\dfrac{\\pi}{4}\\left[(D-2t)^2-d^2\\right]"} note="Bulk density includes voids. Required outside diameter follows from the target mass, density, fill and inner diameter, then adds both outer walls." />
            <EqBlock title="Humidity ratio" tex={"p_{sat}\\approx 0.61094\\exp\\left(\\dfrac{17.625T}{T+243.04}\\right)\\quad \\omega=0.622\\dfrac{\\mathrm{RH}\\,p_{sat}}{P-\\mathrm{RH}\\,p_{sat}}"} note="T is Celsius and p is in kPa. This is an approximation, limited here to 0 to 90 °C. Sensible heating does not change the humidity ratio." />
            <EqBlock title="Moist air enthalpy" tex={"h=1.006T+\\omega(2501+1.86T)"} note="Enthalpy is per kilogram of dry air. The bed rise ṁ(h_out − h_in) is not a heater nameplate, and it must not be added again to the latent estimate." />
            <EqBlock title="Ergun screening drop" tex={"\\Delta P=L\\left[\\dfrac{150\\mu(1-\\varepsilon)^2 u}{\\varepsilon^3 d_p^2}+\\dfrac{1.75\\rho(1-\\varepsilon)u^2}{\\varepsilon^3 d_p}\\right]"} note="Bed only. Floor, perforations and duct are extra and unmeasured." />
            <EqBlock title="Open area and wall resistance" tex={"\\beta=\\dfrac{\\pi}{2\\sqrt{3}}\\left(\\dfrac{d_h}{p}\\right)^2\\qquad R_{th}=\\dfrac{\\ln(r_o/r_i)}{2\\pi k L}"} note="Thin metal is not the thermal bottleneck. A large conduction flux from a guessed temperature drop is not available solar power." />
          </div>
          <p className="text-sm text-muted">
            Kinetics need a measured series: MR = (X − Xe)/(X0 − Xe) = exp(−kt) or exp(−kt^n). No k, n or Xe from this project is stored on the page.
          </p>
        </section>

        <section id="calculators" className="scroll-mt-24 space-y-6">
          <SectionTitle kicker="Calculators" title="Shared preliminary model" />
          <div className="flex flex-wrap gap-2">
            <button type="button" data-testid="reset-inputs" className="btn" onClick={() => { setForm(referenceForm()); setFit(null); }}>
              Reset reference case
            </button>
            <button type="button" className="btn" onClick={() => edit("Tin_C", 42)}>
              Illustrate 42 °C inlet
            </button>
            <button type="button" className="btn" onClick={() => edit("Tin_C", 80)}>
              Restore 80 °C alternate inlet
            </button>
            <button type="button" className="btn" onClick={() => download("json")}>Export JSON</button>
            <button type="button" className="btn" onClick={() => download("csv")}>Export CSV</button>
          </div>
          <div role="status" aria-live="polite" data-testid="alert-list" className="space-y-2">
            <p className="text-sm text-muted">{ev.status} Specification {ev.version}.</p>
            {ev.issues.map((issue) => (
              <p key={issue.code + issue.message} className={issue.severity === "error" ? "border border-amber bg-warn px-3 py-2 text-sm" : "border border-line bg-card px-3 py-2 text-sm"}>
                <strong className="font-medium">{issue.severity === "error" ? "Input blocked. " : "Check. "}</strong>
                {issue.message}
              </p>
            ))}
            {!fit ? <p className="border border-line bg-card px-3 py-2 text-sm">No measured kinetic fit is loaded.</p> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Num id="m" label="Batch mass" unit="kg" value={form.m_kg} onChange={(v) => edit("m_kg", v ?? Number.NaN)} />
            <Num id="Mi" testId="moisture-initial" label="Initial moisture" unit="percent wet basis" value={form.Mi_pct} onChange={(v) => edit("Mi_pct", v ?? Number.NaN)} />
            <Num id="Mf" testId="moisture-final" label="Final moisture" unit="percent wet basis" value={form.Mf_pct} onChange={(v) => edit("Mf_pct", v ?? Number.NaN)} />
            <Num id="rho" label="Bulk density" unit="kg/m³" value={form.rho} onChange={(v) => edit("rho", v ?? Number.NaN)} />
            <Num id="Ta" label="Ambient temperature" unit="°C" value={form.Ta_C} onChange={(v) => edit("Ta_C", v ?? Number.NaN)} />
            <Num id="RHi" label="Ambient RH" unit="percent" value={form.RH_pct} onChange={(v) => edit("RH_pct", v ?? Number.NaN)} />
            <Num id="Tin" label="Inlet temperature" unit="°C" value={form.Tin_C} onChange={(v) => edit("Tin_C", v ?? Number.NaN)} />
            <Num id="To" label="Assumed exhaust" unit="°C" value={form.To_C} onChange={(v) => edit("To_C", v ?? Number.NaN)} />
            <Num id="RHo" label="Assumed exhaust RH" unit="percent" value={form.RHout_pct} onChange={(v) => edit("RHout_pct", v ?? Number.NaN)} />
            <Num id="hours" label="Assumed duration" unit="h" value={form.hours} onChange={(v) => edit("hours", v ?? Number.NaN)} />
            <Num id="P" label="Pressure" unit="kPa" value={form.P_kPa} onChange={(v) => edit("P_kPa", v ?? Number.NaN)} />
            <Num id="eps" label="Voidage" unit="fraction" value={form.epsilon} onChange={(v) => edit("epsilon", v ?? Number.NaN)} />
            <Num id="dp" label="Particle diameter" unit="mm" value={form.dp_mm} onChange={(v) => edit("dp_mm", v ?? Number.NaN)} />
            <Num id="mu" label="Viscosity" unit="Pa·s" value={form.mu} onChange={(v) => edit("mu", v ?? Number.NaN)} />
            <Num id="alpha" label="Absorptance" unit="fraction" value={form.alpha} onChange={(v) => edit("alpha", v ?? Number.NaN)} />
            <Num id="G" label="Irradiance" unit="W/m²" value={form.G} onChange={(v) => edit("G", v ?? Number.NaN)} />
            <Num id="hfg" label="Latent heat" unit="kJ/kg" value={form.hfg} onChange={(v) => edit("hfg", v ?? Number.NaN)} />
            <Num id="cp" label="Grain specific heat" unit="kJ/(kg·K)" value={form.cp} onChange={(v) => edit("cp", v ?? Number.NaN)} />
            <Num id="dT" label="Assumed grain rise" unit="K" value={form.dT} onChange={(v) => edit("dT", v ?? Number.NaN)} />
            <Num id="eta" label="Fan efficiency" unit="fraction" value={form.eta} onChange={(v) => edit("eta", v ?? Number.NaN)} />
            <Num id="ih" label="Inner hole" unit="mm" value={form.inner_hole_mm} onChange={(v) => edit("inner_hole_mm", v ?? Number.NaN)} />
            <Num id="ip" label="Inner pitch" unit="mm" value={form.inner_pitch_mm} onChange={(v) => edit("inner_pitch_mm", v ?? Number.NaN)} />
            <Num id="oh" label="Outer hole" unit="mm" value={form.outer_hole_mm} onChange={(v) => edit("outer_hole_mm", v ?? Number.NaN)} />
            <Num id="op" label="Outer pitch" unit="mm" value={form.outer_pitch_mm} onChange={(v) => edit("outer_pitch_mm", v ?? Number.NaN)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric value={r ? `${fmt(r.water_kg, 3)} kg` : "Not computed"} label="Water removed" testId="result-water" />
            <Metric value={r ? `${fmt(r.dry_solids_kg, 2)} kg` : "Not computed"} label="Dry solids" />
            <Metric value={r ? `${fmt(r.final_mass_kg, 2)} kg` : "Not computed"} label="Final batch" />
            <Metric value={r ? `${fmt(r.flow_m3_h, 2)} m³/h` : "Not computed"} label="Flow at the stated inlet" testId="result-flow" />
            <Metric value={r ? `${fmt(r.superficial_m_s, 4)} m/s` : "Not computed"} label="Superficial velocity" />
            <Metric value={r ? `${fmt(r.bed_dp_Pa, 2)} Pa` : "Not computed"} label="Refined bed pressure drop" />
            <Metric value={r ? `${fmt(r.useful_MJ, 2)} MJ` : "Not computed"} label="Useful heat estimate" />
            <Metric value={r ? `${fmt(r.legacy_margin_kW, 3)} kW` : "Not computed"} label="Legacy 1.5 allowance, not efficiency" />
            <Metric value={r ? `${fmt(r.air_preheat_kW, 3)} kW` : "Not computed"} label="Upstream air preheat" />
            <Metric value={r ? `${fmt(r.bed_enthalpy_increase_kW, 3)} kW` : "Not computed"} label="Bed air enthalpy rise" />
            <Metric value={r ? `${fmt(r.solar_gross_kW, 3)} kW` : "Not computed"} label="Gross solar, projected area" />
            <Metric value={r ? `${fmt(r.conditional_43C_m3_h, 1)} m³/h` : "Not computed"} label="Conditional 43 °C, pickup 0.01, 6 h" />
          </div>
          {r ? (
            <div className="grid gap-3">
              <p className="font-mono text-sm leading-relaxed">
                {`m_ev = ${fmt(form.m_kg, 2)} × (${fmt(form.Mi_pct / 100, 2)} − ${fmt(form.Mf_pct / 100, 2)}) / (1 − ${fmt(form.Mf_pct / 100, 2)}) = ${fmt(r.water_kg, 4)} kg.`}
              </p>
              <p className="font-mono text-sm leading-relaxed">
                {`ω_in = ${fmt(r.omega_in, 6)}, ω_out = ${fmt(r.omega_out, 6)}, dry air = ${fmt(r.dry_air_kg_s, 6)} kg/s, v = ${fmt(r.specific_volume_m3_kg, 4)} m³/kg.`}
              </p>
              <p className="font-mono text-sm leading-relaxed">
                {`Legacy screening drop at 0.057 m/s and density 1 kg/m³ is ${fmt(r.legacy_dp_Pa, 2)} Pa. Bed air power ${fmt(r.air_power_W, 2)} W. Shaft at the stated efficiency ${fmt(r.shaft_power_W, 2)} W. That is not a selected fan.`}
              </p>
              <p className="font-mono text-sm leading-relaxed">
                {`Inner open fraction ${fmt(r.inner_open_pct, 3)} percent. Outer local open fraction ${fmt(r.outer_open_pct, 3)} percent. Outer vents are proposed for the upper half only, so the whole wall is not open at that fraction.`}
              </p>
              <p className="font-mono text-sm leading-relaxed">
                {`Outer steel resistance ${fmt(r.R_outer_steel_K_W, 6)} K/W at k = ${form.k_steel}. Inner stainless resistance ${fmt(r.R_inner_ss_K_W, 6)} K/W at k = ${form.k_ss}. Illustrative long wave exchange at 45 °C to 30 °C surroundings is ${fmt(r.illustrative_radiation_W, 1)} W and is not a measurement.`}
              </p>
            </div>
          ) : (
            <p>Substitutions stay blank while an input is invalid, so a NaN is never shown as a result.</p>
          )}
          <div className="grid gap-8 lg:grid-cols-2">
            {flowRows.length > 0 ? <AirflowChart rows={flowRows} /> : <p>Airflow chart waits for a valid case.</p>}
            {ergunRows.length > 0 ? <ErgunChart rows={ergunRows} /> : <p>Pressure chart waits for a valid case.</p>}
          </div>
          <div className="border border-line bg-card p-4">
            <h3 className="font-serif text-xl">Optional kinetics from your file</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Upload a CSV with time_h and moisture_wb, or the trial template with time_s and the MC columns. Equilibrium moisture is your input. An empty file produces no coefficients.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium" htmlFor="xe">
                Equilibrium moisture, percent wet basis
                <input id="xe" className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" type="number" value={xePct} onChange={(e) => setXePct(Number(e.target.value))} />
              </label>
              <label className="block text-sm font-medium" htmlFor="csv">
                Measured CSV
                <input
                  id="csv"
                  className="mt-1 block w-full text-sm"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const parsed = parseMoistureCsv(await file.text());
                    if (parsed.message) {
                      setFit({ ok: false, message: parsed.message });
                      return;
                    }
                    setFit(fitKinetics(parsed.points, xePct / 100));
                  }}
                />
              </label>
            </div>
            {fit && !fit.ok ? <p className="mt-3 text-sm">{fit.message}</p> : null}
            {fit && fit.ok ? (
              <p className="mt-3 font-mono text-sm leading-relaxed">
                {`Newton k = ${fmt(fit.fit.newton_k_per_h, 4)} per hour, RMSE ${fmt(fit.fit.newton_rmse, 4)}. Page k = ${fmt(fit.fit.page_k, 4)}, n = ${fmt(fit.fit.page_n, 2)}, RMSE ${fmt(fit.fit.page_rmse, 4)}. Residual SD ${fmt(fit.fit.residual_sd, 4)}. ${fit.fit.note}`}
              </p>
            ) : null}
          </div>
        </section>

        <section id="gallery" className="scroll-mt-24 space-y-4">
          <SectionTitle kicker="Gallery" title="Figures and their status" />
          <div className="grid gap-4 md:grid-cols-2">
            <Figure src="/assets/figures/concept.png" alt="Early solar assisted hollow cylinder concept with heat and moisture arrows." caption="Early concept illustration. Not a photograph and not a tested dryer." />
            <Figure src="/assets/figures/original_concept_user.png" alt="User supplied concept drawing of the solar assisted hollow cylinder dryer." caption="Original supplied concept image. Conceptual only." />
            <Figure src="/assets/figures/modified_3.jpeg" alt="Cutaway of the modified dryer with blower, stand, annulus and indirect biomass chamber." caption="29 October conceptual cutaway. Not CAD and not a manufactured prototype." />
            <Figure src="/assets/figures/modified_0.jpeg" alt="Diagram of solar wall, electric heat and indirect biomass paths into a paddy dryer." caption="Energy and moisture path diagram. Working hypothesis, not a measured result." />
            <Figure src="/assets/figures/dimensioned_views.png" alt="Top and axial section of the 670 mm reference shell with a 208 mm radial gap." caption="Reference dimension graphic. Shell only. Not a fabrication drawing." />
            <Figure src="/assets/figures/construction.png" alt="Three step construction of outer shell, inner shell and annular space without holes." caption="Construction sequence for the smooth shells. Perforations are not modelled." />
            <Figure src="/assets/figures/mass_balance.png" alt="Bar chart conserving dry solids and removing about 9.3 kilograms of water." caption="Calculated mass balance from the October reference case. Not a weighing trial." />
            <Figure src="/assets/figures/enthalpy.png" alt="Bar chart of moist air enthalpy at ambient, plenum and assumed exhaust." caption="Calculated enthalpy states. The exhaust bar is an assumption." />
            <Figure src="/assets/figures/sensitivity.png" alt="Curves of airflow against humidity pickup and pressure drop against velocity." caption="Calculated sensitivity. Not an experimental curve." />
          </div>
        </section>

        <section id="demonstration" className="scroll-mt-24 space-y-4">
          <SectionTitle kicker="Demonstration" title="Silent slide film" />
          <video
            className="w-full border border-line bg-navy"
            controls
            playsInline
            preload="metadata"
            data-testid="demo-video"
            aria-label="Silent technical demonstration. No audio track."
          >
            <source src="/assets/docs/JU_Silent_Technical_Demonstration.mp4" type="video/mp4" />
            The video file is not available in this browser.
          </video>
          <p className="text-sm text-muted">Duration about 227 seconds, 1280 by 720, picture only. There is no narration and no audio stream. The film is a slide sequence, not a screen recording of a running dryer and not a CAD animation.</p>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            <li>Title and the modified cutaway. Status is a reference design.</li>
            <li>Drying before milling, with the early concept graphic.</li>
            <li>Clean air path: blower, heater, plenum, annulus, exhaust. Core direction is unverified.</li>
            <li>Reference geometry card: 670 mm, 250 mm, 600 mm, gap 208 mm.</li>
            <li>Smooth CAD sequence and the materials proposals.</li>
            <li>Mass balance, bed sizing, heat transfer paths, and kinetics that still need a fit.</li>
            <li>Psychrometrics, the alternate airflow near 63 m³/h, and the thermal budget.</li>
            <li>Enthalpy check, solar estimate near 217 W, Ergun drop, and proposed perforations.</li>
            <li>Safe trial limits, the validation matrix, semester 4.1 record, and semester 4.2 gates.</li>
          </ol>
        </section>

        <section id="roadmap" className="scroll-mt-24 space-y-4">
          <SectionTitle kicker="Roadmap" title="Recorded work and the next gates" />
          <div className="grid gap-4 md:grid-cols-2">
            <article className="border border-line bg-card p-4">
              <h3 className="font-serif text-xl">Semester 4.1, documented</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                <li>September: concept, starter CAD, illustration and short videos.</li>
                <li>9 October: preliminary 100 kg calculation.</li>
                <li>29 October: kinetics reading and a status note. No prototype and no drying rate.</li>
                <li>This review package: recalculated model, smooth shells, figures, and this page. AI assistance is part of the record, not evidence of a test.</li>
              </ul>
            </article>
            <article className="border border-line bg-card p-4">
              <h3 className="font-serif text-xl">Semester 4.2, still planned</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                <li>Gate 1. Supervisor selects scale, flow path, materials and safety.</li>
                <li>Gate 2. Fabrication review, cold flow, core bypass, then controlled drying if approved.</li>
                <li>Gate 3. Calibrate the model, compare solar on and off, and write the uncertainty.</li>
              </ul>
            </article>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed">
            There are no measurements in this package. The recommended first build, if approved, is the smaller lab shell, kept separate from the 100 kg reference. Assessment language in the reproduced Module 2 syllabus is 100 marks, split 50 and 50. Verify that split with the department. A grade is not guaranteed.
          </p>
        </section>

        <section id="downloads" className="scroll-mt-24 space-y-4">
          <SectionTitle kicker="Downloads" title="Source files" />
          <ul className="grid gap-3 md:grid-cols-2">
            <FileLink href="/assets/docs/JU_Major_Project_Presentation.pptx" title="Presentation slides" detail="31 slides with presenter notes." testId="download-pptx" />
            <FileLink href="/assets/docs/JU_Major_Project_Presentation.pdf" title="Presentation PDF" detail="Same deck for reading." />
            <FileLink href="/assets/docs/JU_Technical_Report.docx" title="Technical report, DOCX" detail="Integrated review edition." />
            <FileLink href="/assets/docs/JU_Technical_Report.pdf" title="Technical report, PDF" detail="Integrated review edition." testId="download-report" />
            <FileLink href="/assets/analysis/Mathematical_Analysis.pdf" title="Mathematical analysis PDF" detail="Typeset derivations." />
            <FileLink href="/assets/analysis/Mathematical_Analysis.tex" title="Mathematical analysis TeX" detail="Source for the analysis PDF." />
            <FileLink href="/assets/analysis/model.py" title="Python model" detail="Independent check of the same equations." />
            <FileLink href="/assets/master_specification.json" title="Master specification JSON" detail="Sole numerical source for the reference case." />
            <FileLink href="/assets/cad/reference_shells.step" title="Reference STEP" detail="Two smooth shells from CadQuery. Not a native SolidWorks part." />
            <FileLink href="/assets/cad/outer_shell.step" title="Outer shell STEP" detail="Smooth absorber only." />
            <FileLink href="/assets/cad/inner_shell.step" title="Inner shell STEP" detail="Smooth inner shell only." />
            <FileLink href="/assets/cad/outer_shell.stl" title="Outer shell STL" detail="Watertight mesh of the smooth outer shell." />
            <FileLink href="/assets/cad/inner_shell.stl" title="Inner shell STL" detail="Watertight mesh of the smooth inner shell." />
            <FileLink href="/assets/cad/reference_shells.scad" title="OpenSCAD reference" detail="Parametric smooth shells, millimetres." />
            <FileLink href="/assets/cad/Reference_Engineering_Drawing.pdf" title="Dimensioned drawing PDF" detail="Shell drawing, not a fabrication release." />
            <FileLink href="/assets/cad/SolidWorks_Rebuild_Guide.md" title="SolidWorks rebuild guide" detail="How to remodel the shells. The STEP file is not an editable feature tree." />
            <FileLink href="/assets/docs/Viva_and_Evaluation_Guide.md" title="Viva preparation notes" detail="Questions and defensible limits." />
            <FileLink href="/assets/analysis/Trial_Data_Template.csv" title="Trial data template" detail="Empty columns for a future supervised test. No sample results." />
            <FileLink href="/assets/docs/JU_Silent_Technical_Demonstration.mp4" title="Silent demonstration" detail="Same film as the player above." />
            <FileLink href="/assets/cad/historical/Hollow_Cylinder_Paddy_Dryer.scad" title="September OpenSCAD" detail="Starter model, separate from the reference shells." />
            <FileLink href="/assets/cad/historical/Hollow_Cylinder_Paddy_Dryer_Concept.stl" title="September concept STL" detail="Starter mesh. Not the October reference." />
          </ul>
        </section>

        <section id="references" className="scroll-mt-24 space-y-4">
          <SectionTitle kicker="References" title="Source trail" />
          <ol className="space-y-3">
            {REFERENCES.map((item) => (
              <li key={item.id} id={item.id} className="border-l-4 border-teal pl-3">
                <p className="text-sm font-medium text-teal-ink">{item.id}</p>
                <p className="text-sm leading-relaxed">{item.description}</p>
                {item.url.startsWith("http") ? (
                  <a className="text-sm text-teal-ink underline" href={item.url}>
                    {item.url}
                  </a>
                ) : (
                  <p className="text-sm text-muted">{item.url}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      </main>
      <footer className="bg-navy text-paper">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-8 text-sm leading-relaxed md:px-6">
          <p>Jadavpur University, Department of Mechanical Engineering. Parth Pariwandh. Supervisor: Prof. Dulal Krishna Mandal.</p>
          <p>AI assistance was used for drafting, compatible CAD and calculation checking. The student must reproduce the work and obtain supervisor review. This page is a local portfolio, not a public release, and it is not an official university document.</p>
          <p>Roll number and registration number are omitted from this page.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-widest text-teal-ink uppercase">{kicker}</p>
      <h2 className="mt-1 font-serif text-3xl text-navy">{title}</h2>
    </div>
  );
}

function Metric({ value, label, testId }: { value: string; label: string; testId?: string }) {
  return (
    <article className="border border-line border-t-4 border-t-teal bg-card px-4 py-3" data-testid={testId}>
      <p className="font-mono text-xl text-navy">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </article>
  );
}

function CaseCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="border border-line bg-card p-4">
      <h3 className="font-serif text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </article>
  );
}

function Dim({ k, v }: { k: string; v: string }) {
  return (
    <div className="border border-line bg-card px-3 py-2">
      <dt className="text-muted">{k}</dt>
      <dd className="font-mono">{v}</dd>
    </div>
  );
}

function EqBlock({ title, tex, note }: { title: string; tex: string; note: string }) {
  return (
    <article className="min-w-0 max-w-full border border-line bg-card p-4">
      <h3 className="font-medium">{title}</h3>
      <Eq tex={tex} display />
      <p className="text-sm leading-relaxed text-muted">{note}</p>
    </article>
  );
}

function Num({
  id,
  label,
  unit,
  value,
  onChange,
  testId,
}: {
  id: string;
  label: string;
  unit: string;
  value: number | null;
  onChange: (value: number | null) => void;
  testId?: string;
}) {
  return (
    <label htmlFor={id} className="block min-w-0 text-sm font-medium">
      {label}
      <span className="font-normal text-muted"> ({unit})</span>
      <input
        id={id}
        data-testid={testId}
        className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 font-mono font-normal"
        type="number"
        step="any"
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? null : Number(raw));
        }}
      />
    </label>
  );
}

function Figure({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="border border-line bg-card">
      <img src={src} alt={alt} className="h-auto w-full" />
      <figcaption className="px-3 py-2 text-sm text-muted">{caption}</figcaption>
    </figure>
  );
}

function FileLink({ href, title, detail, testId }: { href: string; title: string; detail: string; testId?: string }) {
  const [state, setState] = useState<"check" | "ok" | "missing">("check");
  useEffect(() => {
    let live = true;
    fetch(href, { method: "HEAD" })
      .then(async (res) => {
        if (!live) return;
        if (res.ok || res.status === 405) {
          setState("ok");
          return;
        }
        if (res.status === 404) {
          setState("missing");
          return;
        }
        const probe = await fetch(href, { headers: { Range: "bytes=0-16" } });
        if (!live) return;
        setState(probe.ok || probe.status === 206 ? "ok" : "missing");
      })
      .catch(() => {
        if (live) setState("missing");
      });
    return () => {
      live = false;
    };
  }, [href]);

  if (state === "missing") {
    return (
      <li className="border border-line bg-warn p-4">
        <p className="font-medium">{title}</p>
        <p className="text-sm">This file is not in the current build. The download is disabled.</p>
      </li>
    );
  }

  return (
    <li className="border border-line bg-card p-4">
      <a
        data-testid={testId}
        href={state === "ok" ? href : undefined}
        download={state === "ok"}
        className={state === "ok" ? "font-medium text-teal-ink underline" : "pointer-events-none font-medium text-muted"}
        aria-disabled={state !== "ok"}
      >
        {title}
      </a>
      <p className="mt-1 text-sm text-muted">{detail}</p>
      {state === "check" ? <p className="text-sm text-muted">Checking that the file is present.</p> : null}
    </li>
  );
}
