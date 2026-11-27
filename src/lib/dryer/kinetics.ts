/** Empirical Newton and Page fits. Never invents a measured series. */

export type KineticPoint = {
  t_h: number;
  moisture_wb: number;
};

export type KineticFit = {
  nPoints: number;
  X0: number;
  Xe: number;
  basis: "dry basis, converted from wet basis";
  newton_k_per_h: number;
  newton_rmse: number;
  page_k: number;
  page_n: number;
  page_rmse: number;
  residual_sd: number;
  note: string;
};

export type KineticOutcome =
  | { ok: true; fit: KineticFit }
  | { ok: false; message: string };

export function parseMoistureCsv(text: string): { points: KineticPoint[]; message: string | null } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  if (lines.length < 2) {
    return { points: [], message: "The file has no data rows. No kinetic fit is reported." };
  }
  const header = splitCsv(lines[0]).map((h) => h.trim().toLowerCase());
  const timeIdx = header.findIndex((h) => h === "time_h" || h === "t_h" || h === "time_s" || h === "t");
  const simple = header.findIndex((h) =>
    ["moisture_wb", "m_wb", "mc_wb", "moisture_wb_pct", "mc_pct"].includes(h),
  );
  const spatial = header
    .map((h, i) => ({ h, i }))
    .filter((col) => col.h.startsWith("mc_") && col.h.endsWith("_pct"));

  if (timeIdx < 0) {
    return { points: [], message: "A time column is required (time_h or time_s). Nothing was fitted." };
  }
  if (simple < 0 && spatial.length === 0) {
    return {
      points: [],
      message: "A moisture column is required. Use moisture_wb, or the MC location columns in the trial template.",
    };
  }

  const buckets = new Map<number, number[]>();
  for (const line of lines.slice(1)) {
    const cells = splitCsv(line);
    const rawT = Number(cells[timeIdx]);
    if (!Number.isFinite(rawT)) continue;
    const headerName = header[timeIdx];
    const t_h = headerName === "time_s" ? rawT / 3600 : rawT;
    const samples: number[] = [];
    if (simple >= 0) {
      const raw = Number(cells[simple]);
      if (Number.isFinite(raw)) {
        const name = header[simple];
        const wb = name.endsWith("_pct") || name === "mc_pct" ? raw / 100 : raw;
        samples.push(wb);
      }
    } else {
      for (const col of spatial) {
        const raw = Number(cells[col.i]);
        if (Number.isFinite(raw)) samples.push(raw / 100);
      }
    }
    if (samples.length === 0) continue;
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const list = buckets.get(t_h) ?? [];
    list.push(mean);
    buckets.set(t_h, list);
  }

  const points = [...buckets.entries()]
    .map(([t_h, values]) => ({
      t_h,
      moisture_wb: values.reduce((a, b) => a + b, 0) / values.length,
    }))
    .sort((a, b) => a.t_h - b.t_h);

  if (points.length < 4) {
    return {
      points,
      message: "At least four timed moisture rows are required. No fit is reported from a short or empty file.",
    };
  }
  return { points, message: null };
}

export function fitKinetics(points: KineticPoint[], Xe_wb: number): KineticOutcome {
  if (!(Xe_wb >= 0) || !(Xe_wb < 1)) {
    return { ok: false, message: "Equilibrium moisture must be a wet basis fraction from 0 up to but not including 1." };
  }
  const ordered = [...points].sort((a, b) => a.t_h - b.t_h);
  const X = ordered.map((p) => p.moisture_wb / (1 - p.moisture_wb));
  const Xe = Xe_wb / (1 - Xe_wb);
  const X0 = X[0];
  if (!(X0 > Xe)) {
    return {
      ok: false,
      message: "Initial dry basis moisture must be above the equilibrium value you entered. No fit was forced.",
    };
  }
  const span = X0 - Xe;
  const usable = ordered
    .map((p, i) => ({ t: p.t_h, mr: (X[i] - Xe) / span }))
    .filter((row) => row.t > 0 && row.mr > 0 && row.mr < 1);
  if (usable.length < 3) {
    return {
      ok: false,
      message: "Not enough falling moisture points after the start. No coefficients were invented.",
    };
  }

  const newtonK = positiveRate(
    usable.reduce((s, row) => s + row.t * Math.log(row.mr), 0),
    usable.reduce((s, row) => s + row.t * row.t, 0),
  );
  if (newtonK == null) return { ok: false, message: "Newton fit is undefined for these rows." };
  const newtonRmse = rmse(usable.map((row) => Math.exp(-newtonK * row.t)), usable.map((row) => row.mr));

  let bestN = 1;
  let bestK = newtonK;
  let bestRmse = Number.POSITIVE_INFINITY;
  for (let n = 30; n <= 250; n += 1) {
    const expn = n / 100;
    const num = usable.reduce((s, row) => s + row.t ** expn * Math.log(row.mr), 0);
    const den = usable.reduce((s, row) => s + (row.t ** expn) ** 2, 0);
    const k = positiveRate(num, den);
    if (k == null) continue;
    const err = rmse(
      usable.map((row) => Math.exp(-k * row.t ** expn)),
      usable.map((row) => row.mr),
    );
    if (err < bestRmse) {
      bestRmse = err;
      bestN = expn;
      bestK = k;
    }
  }

  const residuals = usable.map((row) => Math.exp(-bestK * row.t ** bestN) - row.mr);
  const sd = Math.sqrt(residuals.reduce((s, e) => s + e * e, 0) / Math.max(1, residuals.length - 2));

  return {
    ok: true,
    fit: {
      nPoints: usable.length,
      X0,
      Xe,
      basis: "dry basis, converted from wet basis",
      newton_k_per_h: newtonK,
      newton_rmse: newtonRmse,
      page_k: bestK,
      page_n: bestN,
      page_rmse: bestRmse,
      residual_sd: sd,
      note: "Fit only to the file you loaded. It is not a measured result from this project, and it is not validated on a held out run.",
    },
  };
}

function positiveRate(num: number, den: number): number | null {
  if (!(den > 0)) return null;
  const k = -num / den;
  if (!Number.isFinite(k) || k <= 0) return null;
  return k;
}

function rmse(pred: number[], obs: number[]): number {
  const n = obs.length;
  if (n === 0) return Number.NaN;
  let s = 0;
  for (let i = 0; i < n; i += 1) s += (pred[i] - obs[i]) ** 2;
  return Math.sqrt(s / n);
}

function splitCsv(line: string): string[] {
  return line.split(",").map((cell) => cell.trim());
}
