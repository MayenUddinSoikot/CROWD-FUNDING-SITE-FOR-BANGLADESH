/* A picture of the creator dashboard, drawn rather than screenshotted.

   Patreon's homepage sells the back office as hard as it sells the
   page: a dark phone showing Insights, one big earnings figure and a
   chart. We have that dashboard now, so the homepage should show it.

   Drawn in markup instead of a PNG so it stays sharp, reads correctly
   in both themes, and never goes stale when the real dashboard moves
   on. The figures are an illustration and the caption says so — this
   sits on a page asking strangers for money, so nothing here should
   be mistaken for one campaigner's real numbers. */

const TABS = ["Campaigns", "Supporters", "Donations", "Posts"] as const;

// A plausible six-month curve. The last stretch is drawn dashed, the
// way the real dashboard marks a month that has not finished yet.
const POINTS = [18, 46, 41, 34, 52, 74];

/* One shared scale for both halves of the line. Scaling each half to
   its own maximum made them diverge, so the dashed projection drifted
   away from the solid line it is supposed to continue. */
function coords(values: number[], width: number, height: number) {
  const max = Math.max(...values);
  const step = width / (values.length - 1);
  return values.map((v, i) => ({
    x: i * step,
    y: height - (v / max) * (height - 8) - 4,
  }));
}

function line(points: { x: number; y: number }[]): string {
  return points
    .map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(" ");
}

export function DashboardPreview() {
  const W = 300;
  const H = 110;
  const pts = coords(POINTS, W, H);
  // Months that have closed are solid; the month still running is dashed.
  const settled = line(pts.slice(0, -1));
  const projected = line(pts.slice(-2));
  const whole = line(pts);

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-[28px] bg-[#0f1211] p-5 text-white shadow-lift ring-1 ring-white/10">
        <p className="text-center text-lg font-bold">Insights</p>

        {/* Tabs — the first one is the live tab, as on the real page */}
        <div className="mt-4 flex items-center justify-between text-sm font-semibold">
          {TABS.map((tab, i) => (
            <span
              key={tab}
              className={
                i === 2
                  ? "border-b-2 border-brand pb-1.5 text-brand"
                  : "pb-1.5 text-white/55"
              }
            >
              {tab}
            </span>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {["Past 6 months", "All donations"].map((label) => (
            <div
              key={label}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 text-sm font-semibold"
            >
              {label}
              <span aria-hidden="true" className="text-white/50">
                ⌄
              </span>
            </div>
          ))}
        </div>

        <p className="mt-5 text-sm font-semibold text-brand">
          Raised so far in November
        </p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">৳১,২৪,৫০০</p>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-4 w-full"
          role="img"
          aria-label="A line rising over six months"
        >
          <defs>
            <linearGradient id="dash-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1f9d6b" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#1f9d6b" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${whole} L${W},${H} L0,${H} Z`} fill="url(#dash-fill)" />
          <path
            d={settled}
            fill="none"
            stroke="#35c08a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={projected}
            fill="none"
            stroke="#35c08a"
            strokeWidth="2.5"
            strokeDasharray="7 6"
            strokeLinecap="round"
          />
        </svg>

        <div className="flex justify-between text-xs font-semibold text-white/45">
          <span>Jun</span>
          <span>Nov</span>
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-sm font-bold">Month by month</p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-white/70">November</span>
            <span className="font-bold">
              ৳১,২৪,৫০০ <span className="text-white/40">›</span>
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-sm">
            <span className="text-white/70">October</span>
            <span className="font-bold">
              ৳৮৭,২০০ <span className="text-white/40">›</span>
            </span>
          </div>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-xs text-muted">
        An illustration of the dashboard — yours shows your own numbers.
      </figcaption>
    </figure>
  );
}
