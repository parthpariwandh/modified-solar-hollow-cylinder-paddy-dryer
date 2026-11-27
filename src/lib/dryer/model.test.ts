import assert from "node:assert/strict";
import { describe, it } from "node:test";
import spec from "../../data/master_specification.json" with { type: "json" };
import {
  airflowDemandM3h,
  dryToWet,
  ergunDropPa,
  evaluate,
  referenceInputs,
  triangularOpenFraction,
  wetToDry,
} from "./model.ts";
import { fitKinetics, parseMoistureCsv } from "./kinetics.ts";

const expected = spec.recalculated;

function close(actual: number, want: number, tol = 1e-6) {
  assert.ok(Number.isFinite(actual), `expected finite, got ${actual} vs ${want}`);
  assert.ok(Math.abs(actual - want) <= tol, `${actual} !== ${want} (tol ${tol})`);
}

describe("reference regression against master_specification.json", () => {
  const ev = evaluate(referenceInputs());

  it("accepts the reference alternate case", () => {
    assert.equal(ev.ok, true);
    assert.ok(ev.results);
    assert.equal(ev.version, spec.version);
  });

  it("matches mass, geometry, air and energy", () => {
    const r = ev.results!;
    close(r.water_kg, expected.water_kg);
    close(r.dry_solids_kg, expected.dry_solids_kg);
    close(r.final_mass_kg, expected.final_mass_kg);
    close(r.required_volume_m3, expected.required_volume_m3);
    close(r.area_m2, expected.area_m2);
    close(r.capacity_kg, expected.capacity_kg);
    close(r.required_outer_OD_mm, expected.required_outer_OD_mm, 1e-6);
    close(r.radial_gap_mm, expected.radial_gap_mm, 1e-6);
    close(r.omega_in, expected.omega_in);
    close(r.omega_out, expected.omega_out);
    close(r.dry_air_kg_s, expected.dry_air_kg_s);
    close(r.flow_m3_h, expected.flow_m3_h, 1e-6);
    close(r.superficial_m_s, expected.superficial_m_s);
    close(r.bed_dp_Pa, expected.bed_dp_Pa, 1e-4);
    close(r.legacy_dp_Pa, expected.legacy_dp_Pa, 1e-4);
    close(r.useful_MJ, expected.useful_MJ, 1e-6);
    close(r.legacy_margin_kW, expected.legacy_margin_kW, 1e-6);
    close(r.air_preheat_kW, expected.air_preheat_kW, 1e-6);
    close(r.bed_enthalpy_increase_kW, expected.bed_enthalpy_increase_kW, 1e-6);
    close(r.solar_gross_kW, expected.solar_gross_kW, 1e-9);
    close(r.inner_open_pct, expected.inner_open_pct, 1e-6);
    close(r.outer_open_pct, expected.outer_open_pct, 1e-6);
    assert.ok(r.conditional_43C_m3_h > 140 && r.conditional_43C_m3_h < 146);
    assert.ok(r.bed_enthalpy_increase_kW > 0);
    assert.ok(ev.issues.some((issue) => issue.code === "enthalpy-rise"));
    assert.ok(ev.issues.some((issue) => issue.code === "inlet-range"));
    assert.ok(ev.issues.some((issue) => issue.code === "not-operational"));
  });
});

describe("guards", () => {
  it("rejects NaN, zero duration, negative thickness, high RH and overlap", () => {
    const base = referenceInputs();
    assert.equal(evaluate({ ...base, m_kg: Number.NaN }).ok, false);
    assert.equal(evaluate({ ...base, hours: 0 }).ok, false);
    assert.equal(evaluate({ ...base, t_m: -0.001 }).ok, false);
    assert.equal(evaluate({ ...base, RH_in: 1.2 }).ok, false);
    assert.equal(evaluate({ ...base, D_m: 0.25, d_m: 0.24, t_m: 0.01 }).ok, false);
    for (const ev of [
      evaluate({ ...base, m_kg: Number.NaN }),
      evaluate({ ...base, hours: 0 }),
      evaluate({ ...base, epsilon: 0 }),
      evaluate({ ...base, dp_m: 0 }),
    ]) {
      assert.equal(ev.results, null);
      assert.equal(JSON.stringify(ev).includes("NaN"), false);
    }
  });

  it("converts wet and dry basis and responds to moisture and voidage", () => {
    close(wetToDry(0.22), 0.22 / 0.78, 1e-12);
    close(dryToWet(wetToDry(0.14)), 0.14, 1e-12);
    const base = referenceInputs();
    const changed = evaluate({ ...base, Mi: 0.28, Mf: 0.14 });
    assert.equal(changed.ok, true);
    assert.ok(Math.abs(changed.results!.water_kg - expected.water_kg) > 0.5);
    const loose = evaluate({ ...base, epsilon: 0.5 });
    const tight = evaluate({ ...base, epsilon: 0.4 });
    assert.ok(tight.results!.bed_dp_Pa > loose.results!.bed_dp_Pa);
    assert.ok(Number.isFinite(ergunDropPa(0.05, 0.6, 0.45, 0.0025, 2.07e-5, 1.1)));
    assert.ok(!Number.isFinite(triangularOpenFraction(0.002, 0)));
  });

  it("does not fit an empty template or invent kinetics", () => {
    const empty = parseMoistureCsv(
      "time_h,moisture_wb\n",
    );
    assert.equal(empty.points.length, 0);
    const bad = fitKinetics(
      [
        { t_h: 0, moisture_wb: 0.22 },
        { t_h: 1, moisture_wb: 0.2 },
      ],
      0.12,
    );
    assert.equal(bad.ok, false);
  });

  it("fits a user supplied series without labelling it as a project measurement", () => {
    const csv = [
      "time_h,moisture_wb",
      "0,0.22",
      "1,0.20",
      "2,0.185",
      "3,0.172",
      "4,0.162",
      "6,0.148",
    ].join("\n");
    const parsed = parseMoistureCsv(csv);
    assert.equal(parsed.message, null);
    const fit = fitKinetics(parsed.points, 0.12);
    assert.equal(fit.ok, true);
    if (fit.ok) {
      assert.ok(fit.fit.newton_k_per_h > 0);
      assert.ok(fit.fit.page_n > 0);
      assert.match(fit.fit.note, /not a measured result/i);
    }
    const flow = airflowDemandM3h(9.302325581395348, 6, 0.01, 0.92);
    assert.ok(flow > 100);
  });
});
