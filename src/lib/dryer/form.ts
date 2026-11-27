import { evaluate, referenceInputs, SPEC_VERSION, type Evaluation, type ModelInputs } from "./model.ts";

export type CaseId = "reference" | "september" | "lab" | "custom";

export type FormState = {
  caseId: CaseId;
  thicknessNote: string;
  m_kg: number;
  Mi_pct: number;
  Mf_pct: number;
  rho: number;
  D_mm: number;
  d_mm: number;
  t_mm: number | null;
  ti_mm: number | null;
  L_mm: number;
  outer_H_mm: number;
  inner_H_mm: number;
  P_kPa: number;
  Ta_C: number;
  RH_pct: number;
  Tin_C: number;
  To_C: number;
  RHout_pct: number;
  hours: number;
  epsilon: number;
  dp_mm: number;
  mu: number;
  alpha: number;
  G: number;
  hfg: number;
  cp: number;
  dT: number;
  eta: number;
  inner_hole_mm: number;
  inner_pitch_mm: number;
  outer_hole_mm: number;
  outer_pitch_mm: number;
  k_steel: number;
  k_ss: number;
};

const REF_NOTE =
  "October reference shells, 670 mm and 250 mm. Smooth CAD only. Fill height equals shell height in this simplified model. Not fabrication approved.";

const SEPT_NOTE =
  "September starter CAD only: 300 mm and 140 mm outside diameters, outer height 500 mm, inner height 470 mm. Wall thicknesses 3 mm and 2 mm are starter values in that OpenSCAD file, not frozen dimensions, and not the October reference.";

const LAB_NOTE =
  "October lab case: 400 mm and 220 mm outside diameters, 500 mm fill, described as about 24 kg. Wall thickness is not in the source. Enter a trial thickness. It stays labelled as your assumption.";

export function referenceForm(): FormState {
  const s = referenceInputs();
  return {
    caseId: "reference",
    thicknessNote: REF_NOTE,
    m_kg: s.m_kg,
    Mi_pct: s.Mi * 100,
    Mf_pct: s.Mf * 100,
    rho: s.rho_b_kg_m3,
    D_mm: s.D_m * 1000,
    d_mm: s.d_m * 1000,
    t_mm: s.t_m * 1000,
    ti_mm: s.ti_m * 1000,
    L_mm: s.L_m * 1000,
    outer_H_mm: s.L_m * 1000,
    inner_H_mm: s.L_m * 1000,
    P_kPa: s.P_kPa,
    Ta_C: s.Ta_C,
    RH_pct: s.RH_in * 100,
    Tin_C: s.Tin_C,
    To_C: s.To_C,
    RHout_pct: s.RH_out * 100,
    hours: s.hours,
    epsilon: s.epsilon,
    dp_mm: s.dp_m * 1000,
    mu: s.mu_Pa_s,
    alpha: s.alpha,
    G: s.G_W_m2,
    hfg: s.hfg_kJ_kg,
    cp: s.cp_kJ_kgK,
    dT: s.dT_K,
    eta: s.eta,
    inner_hole_mm: s.inner_hole_m * 1000,
    inner_pitch_mm: s.inner_pitch_m * 1000,
    outer_hole_mm: s.outer_hole_m * 1000,
    outer_pitch_mm: s.outer_pitch_m * 1000,
    k_steel: s.k_steel,
    k_ss: s.k_stainless,
  };
}

export function applyCase(current: FormState, caseId: CaseId): FormState {
  if (caseId === "reference") {
    const air = current;
    const next = referenceForm();
    return {
      ...next,
      Ta_C: air.Ta_C,
      RH_pct: air.RH_pct,
      Tin_C: air.Tin_C,
      To_C: air.To_C,
      RHout_pct: air.RHout_pct,
      hours: air.hours,
      P_kPa: air.P_kPa,
      epsilon: air.epsilon,
      dp_mm: air.dp_mm,
      mu: air.mu,
      alpha: air.alpha,
      G: air.G,
      hfg: air.hfg,
      cp: air.cp,
      dT: air.dT,
      eta: air.eta,
    };
  }
  if (caseId === "september") {
    return {
      ...current,
      caseId,
      thicknessNote: SEPT_NOTE,
      D_mm: 300,
      d_mm: 140,
      t_mm: 3,
      ti_mm: 2,
      L_mm: 470,
      outer_H_mm: 500,
      inner_H_mm: 470,
    };
  }
  return {
    ...current,
    caseId: "lab",
    thicknessNote: LAB_NOTE,
    D_mm: 400,
    d_mm: 220,
    t_mm: null,
    ti_mm: null,
    L_mm: 500,
    outer_H_mm: 500,
    inner_H_mm: 500,
  };
}

const MISSING: Evaluation = {
  ok: false,
  version: SPEC_VERSION,
  status:
    "Preliminary calculation only. No prototype measurement, heater certificate, or supervisor approval is included.",
  issues: [
    {
      severity: "error",
      code: "thickness",
      message:
        "Wall thickness is not stated for this case. Enter a trial outer thickness and a trial inner thickness. Those values are your assumption, not an official dimension.",
    },
  ],
  results: null,
};

export function formToEvaluation(form: FormState): Evaluation {
  if (form.t_mm == null || form.ti_mm == null || Number.isNaN(form.t_mm) || Number.isNaN(form.ti_mm)) {
    const issues = [...MISSING.issues];
    if (form.caseId === "lab") {
      issues.unshift({
        severity: "warning",
        code: "lab-thickness",
        message:
          "The October lab note does not give wall thickness. Capacity near 24 kg cannot be confirmed until you enter a thickness and a bulk density.",
      });
    }
    return { ...MISSING, issues };
  }
  const input: ModelInputs = {
    m_kg: form.m_kg,
    Mi: form.Mi_pct / 100,
    Mf: form.Mf_pct / 100,
    rho_b_kg_m3: form.rho,
    D_m: form.D_mm / 1000,
    d_m: form.d_mm / 1000,
    t_m: form.t_mm / 1000,
    ti_m: form.ti_mm / 1000,
    L_m: form.L_mm / 1000,
    P_kPa: form.P_kPa,
    Ta_C: form.Ta_C,
    RH_in: form.RH_pct / 100,
    Tin_C: form.Tin_C,
    To_C: form.To_C,
    RH_out: form.RHout_pct / 100,
    hours: form.hours,
    epsilon: form.epsilon,
    dp_m: form.dp_mm / 1000,
    mu_Pa_s: form.mu,
    alpha: form.alpha,
    G_W_m2: form.G,
    hfg_kJ_kg: form.hfg,
    cp_kJ_kgK: form.cp,
    dT_K: form.dT,
    eta: form.eta,
    inner_hole_m: form.inner_hole_mm / 1000,
    inner_pitch_m: form.inner_pitch_mm / 1000,
    outer_hole_m: form.outer_hole_mm / 1000,
    outer_pitch_m: form.outer_pitch_mm / 1000,
    k_steel: form.k_steel,
    k_stainless: form.k_ss,
  };
  const ev = evaluate(input);
  if (form.caseId === "lab") {
    ev.issues = [
      {
        severity: "warning",
        code: "lab-thickness",
        message:
          "Lab case thickness was typed on this page. It is not taken from the October note, and about 24 kg remains a source estimate rather than this calculation.",
      },
      ...ev.issues,
    ];
  }
  if (form.caseId === "september") {
    ev.issues = [
      {
        severity: "warning",
        code: "september",
        message:
          "You are viewing the September starter geometry. Do not mix these diameters with the 670 mm reference results.",
      },
      ...ev.issues,
    ];
  }
  return ev;
}

export function geometryReady(form: FormState): boolean {
  if (form.t_mm == null || form.ti_mm == null) return false;
  if (!(form.t_mm > 0 && form.ti_mm > 0 && form.D_mm > 0 && form.d_mm > 0)) return false;
  if (!(form.L_mm > 0 && form.outer_H_mm > 0 && form.inner_H_mm > 0)) return false;
  return form.D_mm - 2 * form.t_mm > form.d_mm && form.d_mm > 2 * form.ti_mm;
}

export function exportPayload(form: FormState, ev: Evaluation) {
  return {
    version: SPEC_VERSION,
    status: ev.status,
    caseId: form.caseId,
    thicknessNote: form.thicknessNote,
    generated: "local browser export",
    assumptions:
      "Every number is a preliminary calculation. Nothing here is a measured drying trial.",
    inputs: form,
    issues: ev.issues,
    results: ev.results,
  };
}

export function payloadToCsv(payload: ReturnType<typeof exportPayload>): string {
  const rows: string[][] = [
    ["version", payload.version],
    ["status", payload.status],
    ["case", payload.caseId],
    ["note", payload.thicknessNote],
  ];
  for (const [key, value] of Object.entries(payload.inputs)) {
    rows.push([`input.${key}`, value == null ? "" : String(value)]);
  }
  if (payload.results) {
    for (const [key, value] of Object.entries(payload.results)) {
      rows.push([`result.${key}`, String(value)]);
    }
  }
  for (const issue of payload.issues) {
    rows.push([`issue.${issue.severity}`, issue.message]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
