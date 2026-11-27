import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AirflowRow, ErgunRow } from "@/lib/dryer/model";
import { fmt } from "@/lib/dryer/format";

function useBrowser() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(true), []);
  return on;
}

export function AirflowChart({ rows }: { rows: AirflowRow[] }) {
  const on = useBrowser();
  const data = rows.map((row) => ({
    pickup: Number(row.deltaOmega.toFixed(4)),
    h4: row.byHours["4"],
    h6: row.byHours["6"],
    h8: row.byHours["8"],
  }));
  return (
    <div>
      <h3 className="font-serif text-xl text-navy">Air volume against humidity pickup</h3>
      <p className="mt-1 text-sm text-muted">
        Horizontal axis is assumed humidity pickup in kilograms of water per kilogram of dry air. Vertical axis is moist air volume flow in cubic metres per hour, using the current inlet specific volume. This is algebra, not a fan duty.
      </p>
      {on ? (
        <div className="mt-3 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#d5ddd8" />
              <XAxis dataKey="pickup" tick={{ fill: "#142d40", fontSize: 12 }} />
              <YAxis tick={{ fill: "#142d40", fontSize: 12 }} width={56} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="h4" name="4 h" stroke="#142d40" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="h6" name="6 h" stroke="#087f82" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="h8" name="8 h" stroke="#d69b3c" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">Chart loads in the browser. The table below is the same data.</p>
      )}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Required air volume at 4, 6 and 8 hours</caption>
          <thead>
            <tr className="border-b border-line text-teal-ink">
              <th className="py-2 pr-3 font-medium">Pickup</th>
              <th className="py-2 pr-3 font-medium">4 h, m³/h</th>
              <th className="py-2 pr-3 font-medium">6 h, m³/h</th>
              <th className="py-2 font-medium">8 h, m³/h</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.pickup} className="border-b border-line">
                <td className="py-2 pr-3 font-mono">{row.pickup.toFixed(3)}</td>
                <td className="py-2 pr-3 font-mono">{fmt(row.h4, 1)}</td>
                <td className="py-2 pr-3 font-mono">{fmt(row.h6, 1)}</td>
                <td className="py-2 font-mono">{fmt(row.h8, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ErgunChart({ rows }: { rows: ErgunRow[] }) {
  const on = useBrowser();
  const data = rows.map((row) => ({
    u: Number(row.velocity.toFixed(3)),
    e40: row.byVoidage["0.40"],
    e45: row.byVoidage["0.45"],
    e50: row.byVoidage["0.50"],
  }));
  return (
    <div>
      <h3 className="font-serif text-xl text-navy">Ergun drop against superficial velocity</h3>
      <p className="mt-1 text-sm text-muted">
        Horizontal axis is superficial velocity in metres per second. Vertical axis is bed only pressure drop in pascals, for voidage 0.40, 0.45 and 0.50. Rice shape, the floor and the duct are not included.
      </p>
      {on ? (
        <div className="mt-3 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#d5ddd8" />
              <XAxis dataKey="u" tick={{ fill: "#142d40", fontSize: 12 }} />
              <YAxis tick={{ fill: "#142d40", fontSize: 12 }} width={56} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="e40" name="Voidage 0.40" stroke="#142d40" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="e45" name="Voidage 0.45" stroke="#087f82" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="e50" name="Voidage 0.50" stroke="#d69b3c" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">Chart loads in the browser. The table below is the same data.</p>
      )}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Bed pressure drop against velocity and voidage</caption>
          <thead>
            <tr className="border-b border-line text-teal-ink">
              <th className="py-2 pr-3 font-medium">Velocity, m/s</th>
              <th className="py-2 pr-3 font-medium">ε 0.40, Pa</th>
              <th className="py-2 pr-3 font-medium">ε 0.45, Pa</th>
              <th className="py-2 font-medium">ε 0.50, Pa</th>
            </tr>
          </thead>
          <tbody>
            {data.filter((_, i) => i % 2 === 0).map((row) => (
              <tr key={row.u} className="border-b border-line">
                <td className="py-2 pr-3 font-mono">{row.u.toFixed(2)}</td>
                <td className="py-2 pr-3 font-mono">{fmt(row.e40, 1)}</td>
                <td className="py-2 pr-3 font-mono">{fmt(row.e45, 1)}</td>
                <td className="py-2 font-mono">{fmt(row.e50, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
