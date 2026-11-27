export function fmt(value: number | null | undefined, digits = 4): string {
  if (value == null || !Number.isFinite(value)) return "Not computed";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 0.0001 || abs >= 100000)) return value.toExponential(3);
  return value.toFixed(digits);
}

export function fmtTrim(value: number | null | undefined, digits = 4): string {
  const raw = fmt(value, digits);
  if (raw === "Not computed" || raw.includes("e")) return raw;
  return raw.replace(/\.?0+$/, "");
}
