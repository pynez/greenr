import { useMemo } from "react";
import { Link } from "react-router-dom";
import BreakdownChart from "../components/BreakdownChart";
import ImpactEquivalentsCard from "../components/ImpactEquivalentsCard";
import {
  loadSession,
  saveSession,
  getSnapshot,
  type Snapshot,
} from "../state/session";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

type CatKey = "electricity" | "heating" | "vehicle" | "flights" | "diet" | "consumption";

const CATS: {
  key: CatKey;
  name: string;
  field: keyof Snapshot["response"]["breakdown"];
}[] = [
  { key: "electricity", name: "Electricity", field: "electricity_kg" },
  { key: "heating", name: "Heating", field: "heating_kg" },
  { key: "vehicle", name: "Vehicle", field: "vehicle_kg" },
  { key: "flights", name: "Flights", field: "flights_kg" },
  { key: "diet", name: "Diet", field: "diet_kg" },
  { key: "consumption", name: "Consumption", field: "consumption_kg" },
];

function fmt(n: number) {
  return `${n.toFixed(2)} tCO2e`;
}
function fmtSigned(n: number) {
  return `${n > 0 ? "+" : ""}${n.toFixed(2)} tCO2e`;
}
function pct(delta: number, base: number) {
  if (base <= 0) return 0;
  return Math.round((delta / base) * 100);
}

export default function InsightsPage() {
  const session = useMemo(() => loadSession(), []);
  const { snapshots } = session;

  const baseline = getSnapshot(session, session.baselineId);
  const scenario = getSnapshot(session, session.scenarioId);

  if (snapshots.length === 0) {
    return (
      <div style={{ paddingTop: "80px", paddingBottom: "80px" }} className="text-center">
        <div className="text-lg font-bold text-warm-dark">No saved calculations yet</div>
        <p className="mt-3 text-warm-mid">
          Run a calculation first, then create a scenario to compare.
        </p>
        <div className="mt-8">
          <Link to="/start" className="btn-underline" style={{ color: "#2D5A1B" }}>
            Start
          </Link>
        </div>
      </div>
    );
  }

  const base = baseline ?? snapshots[snapshots.length - 1] ?? null;
  const scen = scenario ?? (snapshots.length > 1 ? snapshots[0] : null);

  const baseTotal = base?.response.breakdown.total_metric_tons ?? 0;
  const scenTotal = scen?.response.breakdown.total_metric_tons ?? 0;
  const deltaT = scen && base ? scenTotal - baseTotal : 0;
  const deltaPct = scen && base ? pct(deltaT, baseTotal) : 0;

  const setBaselineId = (id: string) => {
    const s = loadSession();
    const next = { ...s, baselineId: id };
    if (next.scenarioId === id) next.scenarioId = null;
    saveSession(next);
    window.location.reload();
  };

  const setScenarioId = (id: string | null) => {
    const s = loadSession();
    saveSession({ ...s, scenarioId: id });
    window.location.reload();
  };

  const deltaByCat =
    base && scen
      ? CATS.map((c) => {
          const b = base.response.breakdown[c.field] as number;
          const s = scen.response.breakdown[c.field] as number;
          return { name: c.name, kg: Math.round((s - b) * 100) / 100 };
        })
      : [];

  return (
    <div>
      <div style={{ paddingBottom: "2rem", borderBottom: "1px solid #D6CFC4" }}>
        <h1 className="text-3xl font-bold text-warm-dark">compare your scenarios</h1>
        <p className="mt-2 text-warm-mid text-sm">
          Select a baseline and a scenario to see what changed.
        </p>
      </div>

      {/* Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
        <Picker
          title="Baseline"
          valueId={base?.id ?? ""}
          snapshots={snapshots}
          onChange={setBaselineId}
        />
        <Picker
          title="Scenario"
          valueId={scen?.id ?? ""}
          snapshots={snapshots}
          allowNone
          onChange={setScenarioId}
        />
      </div>

      {/* Delta display */}
      {base && scen ? (
        <div style={{ marginTop: "80px", paddingBottom: "2rem", borderBottom: "1px solid #D6CFC4" }}>
          <div className="text-xs text-warm-mid font-medium mb-3">Change in total footprint</div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              className="font-extrabold leading-none"
              style={{
                fontSize: "3.5rem",
                color: deltaT > 0 ? "#C4622D" : deltaT < 0 ? "#2D5A1B" : "#1A1208",
              }}
            >
              {fmtSigned(deltaT)}
            </span>
            <span className="text-warm-mid text-sm font-medium">
              ({deltaPct > 0 ? "+" : ""}
              {deltaPct}%)
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-8 text-sm">
            <div>
              <span className="text-warm-mid">Baseline: </span>
              <span className="font-bold text-warm-dark">{base.label} · {fmt(baseTotal)}</span>
            </div>
            <div>
              <span className="text-warm-mid">Scenario: </span>
              <span className="font-bold text-warm-dark">{scen.label} · {fmt(scenTotal)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-10 text-sm text-warm-mid">
          Select a baseline and a scenario above to see the comparison.
        </div>
      )}

      {base && scen && (
        <div className="space-y-0" style={{ marginTop: "80px" }}>
          <ImpactEquivalentsCard baseline={base} scenario={scen} />

          <div className="grid lg:grid-cols-2 gap-16" style={{ marginTop: "80px" }}>
            <BreakdownChart
              totalKg={Math.max(1, base.response.breakdown.total_kg)}
              items={CATS.map((c) => ({
                name: c.name,
                kg: base.response.breakdown[c.field] as number,
              }))}
            />

            {/* Category deltas */}
            <div>
              <div className="font-bold text-warm-dark text-sm">Category deltas</div>
              <div className="mt-0.5 text-xs text-warm-mid mb-6">
                Scenario minus baseline (kg CO2e/year)
              </div>

              <div style={{ borderTop: "1px solid #D6CFC4" }}>
                {deltaByCat
                  .slice()
                  .sort((a, b) => Math.abs(b.kg) - Math.abs(a.kg))
                  .map((d) => (
                    <DeltaRow key={d.name} name={d.name} kg={d.kg} />
                  ))}
              </div>

              <div className="mt-8 h-60">
                <DeltaChart items={deltaByCat} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Picker ───────────────────────────────────────────────────────────────────

function Picker({
  title,
  snapshots,
  valueId,
  onChange,
  allowNone,
}: {
  title: string;
  snapshots: Snapshot[];
  valueId: string;
  onChange: (id: string) => void;
  allowNone?: boolean;
}) {
  return (
    <div>
      <div
        className="text-xs font-medium text-warm-mid uppercase mb-3"
        style={{ letterSpacing: "0.06em" }}
      >
        {title}
      </div>
      <select
        value={valueId}
        onChange={(e) => onChange(e.target.value)}
        className="select-minimal"
      >
        {allowNone && <option value="">None</option>}
        {snapshots.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label} · {new Date(s.createdAt).toLocaleDateString()}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Delta row ────────────────────────────────────────────────────────────────

function DeltaRow({ name, kg }: { name: string; kg: number }) {
  const sign = kg > 0 ? "+" : "";
  const color = kg > 0 ? "#C4622D" : kg < 0 ? "#2D5A1B" : "#7A6652";
  const arrow = kg > 0 ? "▲" : kg < 0 ? "▼" : "–";
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: "1px solid #D6CFC4" }}
    >
      <span className="text-sm text-warm-dark font-medium">{name}</span>
      <span className="text-sm font-bold" style={{ color }}>
        {arrow} {sign}{Math.round(kg).toLocaleString()} kg
      </span>
    </div>
  );
}

// ─── Delta chart ──────────────────────────────────────────────────────────────

function DeltaChart({ items }: { items: { name: string; kg: number }[] }) {
  const data = items
    .map((i) => ({ ...i, kg: Math.round(i.kg) }))
    .sort((a, b) => Math.abs(b.kg) - Math.abs(a.kg));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D6CFC4" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "#7A6652", fontSize: 11 }}
          axisLine={{ stroke: "#D6CFC4" }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fill: "#1A1208", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(214,207,196,0.3)" }}
          contentStyle={{
            background: "#EDE7DC",
            border: "1px solid #D6CFC4",
            color: "#1A1208",
            fontSize: 13,
          }}
          formatter={(value) => [`${Number(value).toLocaleString()} kg`, "Delta"]}
        />
        <Bar dataKey="kg" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.kg > 0 ? "#C4622D" : entry.kg < 0 ? "#2D5A1B" : "#D6CFC4"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
