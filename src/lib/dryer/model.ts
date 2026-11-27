/**
 * Preliminary annular paddy dryer calculations.
 * Pure functions. No measurements. Arguments are SI unless the name says mm.
 * Numerical defaults are read only from master_specification.json.
 */
import spec from "../../data/master_specification.json" with { type: "json" };

export const SPEC_VERSION = spec.version;
export const SPEC = spec;

const SIGMA = 5.670374419e-8;

export type Issue = {
  code: string;
  severity: "error" | "warning";
  message: string;
};

export type ModelInputs = {
  m_kg: number;
  Mi: number;
  Mf: number;
  rho_b_kg_m3: number;
  D_m: number;
  d_m: number;
  t_m: number;
  ti_m: number;
  L_m: number;
  P_kPa: number;
  Ta_C: number;
  RH_in: number;
  Tin_C: number;
  To_C: number;
  RH_out: number;
  hours: number;
  epsilon: number;
  dp_m: number;
  mu_Pa_s: number;
  alpha: number;
  G_W_m2: number;
  hfg_kJ_kg: number;
  cp_kJ_kgK: number;
  dT_K: number;
  eta: number;
  inner_hole_m: number;
  inner_pitch_m: number;
  outer_hole_m: number;
  outer_pitch_m: number;
  k_steel: number;
  k_stainless: number;
};

export type ModelResults = {
  dry_solids_kg: number;
  final_mass_kg: number;
  water_kg: number;
  X_initial: number;
  X_final: number;
  area_m2: number;
  volume_m3: number;
  required_volume_m3: number;
  capacity_kg: number;
  capacity_mismatch: number;
  required_outer_OD_mm: number;
  radial_gap_mm: number;
  outer_ID_mm: number;
  inner_ID_mm: number;
  omega_in: number;
  omega_out: number;
  humidity_pickup: number;
  dry_air_kg_s: number;
  specific_volume_m3_kg: number;
  flow_m3_s: number;
  flow_m3_h: number;
  superficial_m_s: number;
  rho_air: number;
  bed_dp_Pa: number;
  legacy_dp_Pa: number;
  air_power_W: number;
  shaft_power_W: number;
  useful_kJ: number;
  useful_MJ: number;
  legacy_margin_kW: number;
  h_ambient: number;
  h_in: number;
  h_out: number;
  air_preheat_kW: number;
  bed_enthalpy_increase_kW: number;
  solar_gross_W: number;
  solar_gross_kW: number;
  solar_gross_MJ_over_duration: number;
  conditional_43C_m3_h: number;
  inner_open_fraction: number;
  outer_open_fraction: number;
  inner_open_pct: number;
  outer_open_pct: number;
  R_outer_steel_K_W: number;
  R_inner_ss_K_W: number;
  illustrative_radiation_W: number;
};

export type Evaluation = {
  ok: boolean;
  version: string;
  status: string;
  issues: Issue[];
  results: ModelResults | null;
};

export function referenceInputs(): ModelInputs {
  const r = spec.reference;
  const a = spec.alternate_case;
  return {
    m_kg: r.batch_kg,
    Mi: r.moisture_initial_wb,
    Mf: r.moisture_final_wb,
    rho_b_kg_m3: r.bulk_density_kg_m3,
    D_m: r.outer_od_mm / 1000,
    d_m: r.inner_od_mm / 1000,
    t_m: r.outer_wall_mm / 1000,
    ti_m: r.inner_wall_mm / 1000,
    L_m: r.fill_mm / 1000,
    P_kPa: a.pressure_kPa,
    Ta_C: a.ambient_C,
    RH_in: a.ambient_RH,
    Tin_C: a.inlet_C,
    To_C: a.outlet_C,
    RH_out: a.outlet_RH,
    hours: a.hours,
    epsilon: a.voidage,
    dp_m: a.particle_d_m,
    mu_Pa_s: a.mu_Pa_s,
    alpha: a.solar_alpha,
    G_W_m2: a.solar_G_W_m2,
    hfg_kJ_kg: a.h_fg_kJ_kg,
    cp_kJ_kgK: a.cp_grain_kJ_kgK,
    dT_K: 15,
    eta: 0.45,
    inner_hole_m: r.inner_hole_mm / 1000,
    inner_pitch_m: r.inner_pitch_mm / 1000,
    outer_hole_m: r.outer_hole_mm / 1000,
    outer_pitch_m: r.outer_pitch_mm / 1000,
    k_steel: 45,
    k_stainless: 16,
  };
}

export function saturationPressureKPa(T_C: number): number {
  return 0.61094 * Math.exp((17.625 * T_C) / (T_C + 243.04));
}

export function humidityRatio(T_C: number, rh: number, P_kPa: number): number {
  const pv = rh * saturationPressureKPa(T_C);
  const denom = P_kPa - pv;
  if (!(denom > 0) || !Number.isFinite(pv)) return Number.NaN;
  return (0.622 * pv) / denom;
}

export function moistEnthalpy(T_C: number, omega: number): number {
  return 1.006 * T_C + omega * (2501 + 1.86 * T_C);
}

export function specificVolume(T_C: number, omega: number, P_kPa: number): number {
  if (!(P_kPa > 0) || !Number.isFinite(omega)) return Number.NaN;
  return (0.287042 * (T_C + 273.15) * (1 + 1.607858 * omega)) / P_kPa;
}

export function ergunDropPa(
  u: number,
  L: number,
  epsilon: number,
  dp: number,
  mu: number,
  rho: number,
): number {
  const e3 = epsilon ** 3;
  if (!(e3 > 0) || !(dp > 0) || !Number.isFinite(u) || !Number.isFinite(rho)) return Number.NaN;
  const viscous = (150 * mu * (1 - epsilon) ** 2 * u) / (e3 * dp * dp);
  const inertial = (1.75 * rho * (1 - epsilon) * u * u) / (e3 * dp);
  return L * (viscous + inertial);
}

export function triangularOpenFraction(hole: number, pitch: number): number {
  if (!(pitch > 0) || !(hole >= 0) || !Number.isFinite(hole)) return Number.NaN;
  return (Math.PI / (2 * Math.sqrt(3))) * (hole / pitch) ** 2;
}

export function wetToDry(M: number): number {
  if (!(M >= 0) || !(M < 1) || !Number.isFinite(M)) return Number.NaN;
  return M / (1 - M);
}

export function dryToWet(X: number): number {
  if (!(X >= 0) || !Number.isFinite(X)) return Number.NaN;
  return X / (1 + X);
}

export function conductionResistance(ro: number, ri: number, k: number, L: number): number {
  if (!(ro > ri) || !(ri > 0) || !(k > 0) || !(L > 0)) return Number.NaN;
  return Math.log(ro / ri) / (2 * Math.PI * k * L);
}

function finite(n: number): boolean {
  return typeof n === "number" && Number.isFinite(n);
}

function inTemp(T: number): boolean {
  return finite(T) && T >= 0 && T <= 90;
}

export function airflowDemandM3h(
  water_kg: number,
  hours: number,
  deltaOmega: number,
  vSpec: number,
): number {
  if (!(water_kg > 0) || !(hours > 0) || !(deltaOmega > 0) || !(vSpec > 0)) return Number.NaN;
  return (water_kg * vSpec) / (hours * deltaOmega);
}

export type AirflowRow = { deltaOmega: number; byHours: Record<string, number> };

export function airflowGrid(
  water_kg: number,
  vSpec: number,
  hoursList: number[],
  deltas: number[],
): AirflowRow[] {
  return deltas.map((deltaOmega) => {
    const byHours: Record<string, number> = {};
    for (const h of hoursList) {
      byHours[String(h)] = airflowDemandM3h(water_kg, h, deltaOmega, vSpec);
    }
    return { deltaOmega, byHours };
  });
}

export type ErgunRow = { velocity: number; byVoidage: Record<string, number> };

export function ergunGrid(
  L: number,
  dp: number,
  mu: number,
  rho: number,
  voidages: number[],
  velocities: number[],
): ErgunRow[] {
  return velocities.map((velocity) => {
    const byVoidage: Record<string, number> = {};
    for (const eps of voidages) {
      byVoidage[eps.toFixed(2)] = ergunDropPa(velocity, L, eps, dp, mu, rho);
    }
    return { velocity, byVoidage };
  });
}

const STATUS =
  "Preliminary calculation only. No prototype measurement, heater certificate, or supervisor approval is included.";

function fail(issues: Issue[]): Evaluation {
  return { ok: false, version: SPEC_VERSION, status: STATUS, issues, results: null };
}

export function evaluate(input: ModelInputs): Evaluation {
  const issues: Issue[] = [];

  for (const [key, value] of Object.entries(input)) {
    if (!finite(value)) {
      issues.push({
        severity: "error",
        code: "nan",
        message: `${key} is missing or not a finite number.`,
      });
    }
  }
  if (issues.length > 0) return fail(issues);

  if (!(input.m_kg > 0)) issues.push({ severity: "error", code: "mass", message: "Batch mass must be positive." });
  if (!(input.rho_b_kg_m3 > 0)) {
    issues.push({ severity: "error", code: "density", message: "Bulk density must be positive." });
  }
  if (!(input.L_m > 0)) issues.push({ severity: "error", code: "length", message: "Fill length must be positive." });
  if (!(input.hours > 0)) {
    issues.push({ severity: "error", code: "duration", message: "Duration must be greater than zero." });
  }
  if (!(input.D_m > 0 && input.d_m > 0)) {
    issues.push({ severity: "error", code: "diameter", message: "Outer and inner diameters must be positive." });
  }
  if (!(input.t_m > 0 && input.ti_m > 0)) {
    issues.push({
      severity: "error",
      code: "thickness",
      message: "Wall thickness must be positive. A missing source thickness is not filled in for you.",
    });
  }
  if (!(input.P_kPa > 0)) issues.push({ severity: "error", code: "pressure", message: "Total pressure must be positive." });
  if (!(input.dp_m > 0)) issues.push({ severity: "error", code: "particle", message: "Particle diameter must be positive." });
  if (!(input.mu_Pa_s > 0)) issues.push({ severity: "error", code: "viscosity", message: "Viscosity must be positive." });
  if (!(input.hfg_kJ_kg > 0 && input.cp_kJ_kgK > 0)) {
    issues.push({ severity: "error", code: "properties", message: "Latent heat and grain specific heat must be positive." });
  }
  if (!(input.eta > 0 && input.eta <= 1)) {
    issues.push({ severity: "error", code: "efficiency", message: "Fan efficiency must be between 0 and 1, excluding 0." });
  }
  if (!(input.G_W_m2 >= 0)) {
    issues.push({ severity: "error", code: "irradiance", message: "Irradiance cannot be negative." });
  }
  if (!(input.alpha >= 0 && input.alpha <= 1)) {
    issues.push({ severity: "error", code: "alpha", message: "Solar absorptance must be from 0 to 1." });
  }
  if (!(input.k_steel > 0 && input.k_stainless > 0)) {
    issues.push({ severity: "error", code: "conductivity", message: "Thermal conductivity must be positive." });
  }
  if (!inTemp(input.Ta_C) || !inTemp(input.Tin_C) || !inTemp(input.To_C)) {
    issues.push({
      severity: "error",
      code: "temperature",
      message: "Air temperatures used in the saturation approximation must stay from 0 to 90 °C.",
    });
  }
  if (!(input.RH_in >= 0 && input.RH_in <= 1) || !(input.RH_out >= 0 && input.RH_out <= 1)) {
    issues.push({ severity: "error", code: "rh", message: "Relative humidity must be from 0 to 100 percent." });
  }
  if (!(input.Mi >= 0 && input.Mi < 1 && input.Mf >= 0 && input.Mf < input.Mi)) {
    issues.push({
      severity: "error",
      code: "moisture",
      message: "Use wet basis fractions with final moisture below initial moisture, both from 0 up to but not including 1.",
    });
  }
  if (!(input.epsilon > 0 && input.epsilon < 1)) {
    issues.push({ severity: "error", code: "voidage", message: "Voidage must be greater than 0 and less than 1." });
  }
  if (!(input.D_m - 2 * input.t_m > input.d_m && input.d_m > 2 * input.ti_m)) {
    issues.push({
      severity: "error",
      code: "overlap",
      message:
        "Shells overlap or the core is closed. Outer inside diameter must exceed the inner outside diameter, and the inner outside diameter must exceed twice the inner thickness.",
    });
  }
  if (!(input.inner_pitch_m > 0 && input.outer_pitch_m > 0)) {
    issues.push({ severity: "error", code: "pitch", message: "Hole pitch must be positive." });
  }
  if (input.inner_hole_m < 0 || input.outer_hole_m < 0) {
    issues.push({ severity: "error", code: "hole", message: "Hole diameter cannot be negative." });
  }
  if (input.inner_pitch_m > 0 && input.inner_hole_m >= input.inner_pitch_m) {
    issues.push({ severity: "error", code: "hole", message: "Inner hole diameter must be smaller than the pitch." });
  }
  if (input.outer_pitch_m > 0 && input.outer_hole_m >= input.outer_pitch_m) {
    issues.push({ severity: "error", code: "hole", message: "Outer hole diameter must be smaller than the pitch." });
  }

  if (issues.some((i) => i.severity === "error")) return fail(issues);

  const dry = input.m_kg * (1 - input.Mi);
  const finalMass = dry / (1 - input.Mf);
  const water = (input.m_kg * (input.Mi - input.Mf)) / (1 - input.Mf);
  const outerId = input.D_m - 2 * input.t_m;
  const innerId = input.d_m - 2 * input.ti_m;
  const area = (Math.PI / 4) * (outerId ** 2 - input.d_m ** 2);
  if (!(area > 0)) {
    issues.push({ severity: "error", code: "area", message: "Annulus area is not positive." });
    return fail(issues);
  }
  const volume = area * input.L_m;
  const capacity = input.rho_b_kg_m3 * volume;
  const requiredVolume = input.m_kg / input.rho_b_kg_m3;
  const requiredOd =
    2 * Math.sqrt(requiredVolume / (Math.PI * input.L_m) + (input.d_m / 2) ** 2) + 2 * input.t_m;
  const gap_m = (outerId - input.d_m) / 2;
  const mismatch = Math.abs(capacity - input.m_kg) / input.m_kg;

  const omegaIn = humidityRatio(input.Ta_C, input.RH_in, input.P_kPa);
  const omegaOut = humidityRatio(input.To_C, input.RH_out, input.P_kPa);
  if (!Number.isFinite(omegaIn) || !Number.isFinite(omegaOut)) {
    issues.push({
      severity: "error",
      code: "psychrometric",
      message: "Humidity ratio is not defined. Saturation pressure meets or exceeds total pressure.",
    });
    return fail(issues);
  }
  const pickup = omegaOut - omegaIn;
  if (!(pickup > 0)) {
    issues.push({
      severity: "error",
      code: "pickup",
      message: "Humidity pickup must be positive. Heating does not change the inlet humidity ratio. The exhaust state has to hold more water per kilogram of dry air.",
    });
    return fail(issues);
  }

  const mdot = water / (3600 * input.hours * pickup);
  const vSpec = specificVolume(input.Tin_C, omegaIn, input.P_kPa);
  if (!(vSpec > 0)) {
    issues.push({ severity: "error", code: "volume", message: "Moist air specific volume is not positive." });
    return fail(issues);
  }
  const flow = mdot * vSpec;
  const u = flow / area;
  const rho = (1 + omegaIn) / vSpec;
  const dp = ergunDropPa(u, input.L_m, input.epsilon, input.dp_m, input.mu_Pa_s, rho);
  const legacy = ergunDropPa(0.057, input.L_m, input.epsilon, input.dp_m, input.mu_Pa_s, 1);
  const hAmb = moistEnthalpy(input.Ta_C, omegaIn);
  const hIn = moistEnthalpy(input.Tin_C, omegaIn);
  const hOut = moistEnthalpy(input.To_C, omegaOut);
  const useful_kJ = water * input.hfg_kJ_kg + input.m_kg * input.cp_kJ_kgK * input.dT_K;
  const solarW = input.alpha * input.G_W_m2 * input.D_m * input.L_m;
  const v43 = specificVolume(43, omegaIn, input.P_kPa);
  const conditional = airflowDemandM3h(water, 6, 0.01, v43);
  const innerOpen = triangularOpenFraction(input.inner_hole_m, input.inner_pitch_m);
  const outerOpen = triangularOpenFraction(input.outer_hole_m, input.outer_pitch_m);
  const ro = input.D_m / 2;
  const riOuter = outerId / 2;
  const roInner = input.d_m / 2;
  const riInner = innerId / 2;
  const lateral = Math.PI * input.D_m * input.L_m;
  const Ts = 45 + 273.15;
  const Tsur = 30 + 273.15;
  const radiation = 0.9 * SIGMA * lateral * (Ts ** 4 - Tsur ** 4);

  if (input.Tin_C > 45) {
    issues.push({
      severity: "warning",
      code: "inlet-range",
      message:
        "Inlet air is above the 40 to 45 °C first trial range. The 80 °C state is an alternate worked calculation, not an approved setpoint.",
    });
    issues.push({
      severity: "warning",
      code: "heating-mode",
      message: "Heating mode is unverified. No heater rating is certified, including any 2.5 kW figure.",
    });
  }
  if (mismatch > 0.03) {
    issues.push({
      severity: "warning",
      code: "capacity",
      message: `Bed capacity differs from the stated batch by more than 3 percent (${(mismatch * 100).toFixed(1)} percent). Do not treat the shell as sized for that batch.`,
    });
  }
  const bedRise = mdot * (hOut - hIn);
  if (bedRise > 0) {
    issues.push({
      severity: "warning",
      code: "enthalpy-rise",
      message:
        "Moist air enthalpy rises across the bed. The assumed outlet is not an adiabatic continuation of the inlet. This rise is not a heater rating, and latent heat must not be added to it a second time.",
    });
  }
  if (input.m_kg >= 90 && input.Tin_C > 45) {
    issues.push({
      severity: "warning",
      code: "not-operational",
      message: "The 100 kg alternate case is not an approved operating mode.",
    });
  }

  const results: ModelResults = {
    dry_solids_kg: dry,
    final_mass_kg: finalMass,
    water_kg: water,
    X_initial: wetToDry(input.Mi),
    X_final: wetToDry(input.Mf),
    area_m2: area,
    volume_m3: volume,
    required_volume_m3: requiredVolume,
    capacity_kg: capacity,
    capacity_mismatch: mismatch,
    required_outer_OD_mm: requiredOd * 1000,
    radial_gap_mm: gap_m * 1000,
    outer_ID_mm: outerId * 1000,
    inner_ID_mm: innerId * 1000,
    omega_in: omegaIn,
    omega_out: omegaOut,
    humidity_pickup: pickup,
    dry_air_kg_s: mdot,
    specific_volume_m3_kg: vSpec,
    flow_m3_s: flow,
    flow_m3_h: flow * 3600,
    superficial_m_s: u,
    rho_air: rho,
    bed_dp_Pa: dp,
    legacy_dp_Pa: legacy,
    air_power_W: flow * dp,
    shaft_power_W: (flow * dp) / input.eta,
    useful_kJ: useful_kJ,
    useful_MJ: useful_kJ / 1000,
    legacy_margin_kW: (1.5 * useful_kJ) / (input.hours * 3600),
    h_ambient: hAmb,
    h_in: hIn,
    h_out: hOut,
    air_preheat_kW: mdot * (hIn - hAmb),
    bed_enthalpy_increase_kW: bedRise,
    solar_gross_W: solarW,
    solar_gross_kW: solarW / 1000,
    solar_gross_MJ_over_duration: (solarW * input.hours * 3600) / 1e6,
    conditional_43C_m3_h: conditional,
    inner_open_fraction: innerOpen,
    outer_open_fraction: outerOpen,
    inner_open_pct: innerOpen * 100,
    outer_open_pct: outerOpen * 100,
    R_outer_steel_K_W: conductionResistance(ro, riOuter, input.k_steel, input.L_m),
    R_inner_ss_K_W: conductionResistance(roInner, riInner, input.k_stainless, input.L_m),
    illustrative_radiation_W: radiation,
  };

  return { ok: true, version: SPEC_VERSION, status: STATUS, issues, results };
}
