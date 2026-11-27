type Props = {
  D_mm: number;
  d_mm: number;
  t_mm: number;
  ti_mm: number;
  fill_mm: number;
  outer_H_mm: number;
  inner_H_mm: number;
};

export function Schematic(props: Props) {
  const { D_mm, d_mm, t_mm, ti_mm, fill_mm, outer_H_mm, inner_H_mm } = props;
  const outerId = D_mm - 2 * t_mm;
  const innerId = d_mm - 2 * ti_mm;
  const gap = (outerId - d_mm) / 2;
  const topScale = 150 / Math.max(D_mm, 1);
  const cx = 170;
  const cy = 150;
  const secScale = 220 / Math.max(outer_H_mm, inner_H_mm, 1);
  const wall = Math.max(outer_H_mm * secScale, 1);
  const sx = 390;
  const sy = 36;
  const half = (D_mm * secScale) / 2;
  const innerHalf = (d_mm * secScale) / 2;
  const tpx = Math.max(t_mm * secScale, 1.5);
  const tipx = Math.max(ti_mm * secScale, 1.2);
  const fillH = Math.min(fill_mm, outer_H_mm) * secScale;
  const innerH = inner_H_mm * secScale;

  return (
    <svg viewBox="0 0 680 300" role="img" aria-label="Top view and axial section with current dimensions in millimetres." className="h-auto w-full">
      <rect width="680" height="300" fill="#fffdf8" />
      <text x="24" y="24" fill="#142d40" fontFamily="Source Serif 4, Georgia, serif" fontSize="16">
        Top
      </text>
      <text x="360" y="24" fill="#142d40" fontFamily="Source Serif 4, Georgia, serif" fontSize="16">
        Axial section
      </text>
      <circle cx={cx} cy={cy} r={(D_mm * topScale) / 2} fill="#1c2830" />
      <circle cx={cx} cy={cy} r={(outerId * topScale) / 2} fill="#c4a15a" />
      <circle cx={cx} cy={cy} r={(d_mm * topScale) / 2} fill="#d5dbe0" />
      <circle cx={cx} cy={cy} r={Math.max((innerId * topScale) / 2, 0)} fill="#f4f0e8" />
      <line x1={cx - (D_mm * topScale) / 2} y1={268} x2={cx + (D_mm * topScale) / 2} y2={268} stroke="#087f82" strokeWidth="1.4" />
      <text x={cx} y={286} textAnchor="middle" fill="#065c60" fontSize="12" fontFamily="IBM Plex Sans, sans-serif">
        {`Ø ${D_mm} mm outer`}
      </text>
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#142d40" fontSize="12" fontFamily="IBM Plex Sans, sans-serif">
        {`gap ${gap.toFixed(1)} mm`}
      </text>

      <rect x={sx} y={sy} width={half * 2} height={wall} fill="none" stroke="#1c2830" strokeWidth={tpx} />
      <rect
        x={sx + half - innerHalf}
        y={sy + wall - innerH}
        width={innerHalf * 2}
        height={innerH}
        fill="none"
        stroke="#8aa0ab"
        strokeWidth={tipx}
      />
      <rect
        x={sx + tpx}
        y={sy + wall - fillH}
        width={half - innerHalf - tpx}
        height={fillH}
        fill="#c4a15a"
        opacity="0.9"
      />
      <rect
        x={sx + half + innerHalf}
        y={sy + wall - fillH}
        width={half - innerHalf - tpx}
        height={fillH}
        fill="#c4a15a"
        opacity="0.9"
      />
      <text x={sx + half} y={sy + wall + 18} textAnchor="middle" fill="#3e5563" fontSize="12" fontFamily="IBM Plex Sans, sans-serif">
        {`outer ${outer_H_mm} mm · inner ${inner_H_mm} mm · fill ${fill_mm} mm`}
      </text>
      <text x={sx} y={sy - 8} fill="#3e5563" fontSize="12" fontFamily="IBM Plex Sans, sans-serif">
        {`inner Ø ${d_mm} mm · walls ${t_mm} / ${ti_mm} mm`}
      </text>
    </svg>
  );
}
