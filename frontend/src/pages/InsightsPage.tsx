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
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type CatKey = "electricity" | "heating" | "vehicle" | "flights" | "diet" | "consumption";

const CATS: { key: CatKey; name: string; field: keyof Snapshot["response"]["breakdown"] }[] = [
  { key: "electricity", name: "Electricity", field: "electricity_kg" },
  { key: "heating", name: "Heating", field: "heating_kg" },
  { key: "vehicle", name: "Vehicle", field: "vehicle_kg" },
  { key: "flights", name: "Flights", field: "flights_kg" },
  { key: "diet", name: "Diet", field: "diet_kg" },
  { key: "consumption", name: "Consumption", field: "consumption_kg" },
];

function formatTons(n: number) {
  return `${n.toFixed(2)} tCO2e`;
}

function formatSignedTons(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)} tCO2e`;
}

function pct(delta: number, base: number) {
  if (base <= 0) return 0;
  return Math.round((delta / base) * 100);
}

export default function InsightsPage() {
  const session = useMemo(() => loadSession(), []);
  const snapshots = session.snapshots;

  const baseline = getSnapshot(session, session.baselineId);
  const scenario = getSnapshot(session, session.scenarioId);

  if (snapshots.length === 0) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8">
        <div className="text-lg font-semibold">No saved calculations yet</div>
        <p className="mt-2 text-white/70">
          Run a calculation first, then create a scenario to compare.
        </p>
        <Link
          to="/start"
          className="inline-block mt-4 rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90"
        >
          Start
        </Link>
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
    // if scenario equals baseline, clear scenario
    if (next.scenarioId === id) next.scenarioId = null;
    saveSession(next);
    window.location.reload();
  };

  const setScenarioId = (id: string | null) => {
    const s = loadSession();
    const next = { ...s, scenarioId: id };
    saveSession(next);
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
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Insights</h1>
            <p className="mt-2 text-white/70">
              Compare two calculations to see what changed and what matters most.
            </p>
          </div>
          <Link to="/results" className="text-sm text-white/70 hover:text-white">
            Back to results
          </Link>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <Picker
            title="Baseline"
            valueId={base?.id ?? ""}
            snapshots={snapshots}
            onChange={(id) => setBaselineId(id)}
          />
          <Picker
            title="Scenario"
            valueId={scen?.id ?? ""}
            snapshots={snapshots}
            allowNone
            onChange={(id) => setScenarioId(id)}
          />
        </div>

        {base && scen ? (
          <div className="mt-6 rounded-2xl bg-black/30 border border-white/10 p-6">
            <div className="text-sm text-white/60">Change in total footprint</div>
            <div className="mt-2 flex items-baseline gap-3 flex-wrap">
              <div className="text-4xl font-semibold tracking-tight">
                {formatSignedTons(deltaT)}
              </div>
              <div className="text-sm text-white/60">
                ({deltaPct > 0 ? "+" : ""}{deltaPct}%)
              </div>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
              <Mini label="Baseline" value={`${base.label} • ${formatTons(baseTotal)}`} />
              <Mini label="Scenario" value={`${scen.label} • ${formatTons(scenTotal)}`} />
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-black/30 border border-white/10 p-6 text-sm text-white/70">
            Select a baseline and a scenario to see the comparison.
          </div>
        )}
      </div>

      {base && scen && (
    <div className="space-y-6">
      <ImpactEquivalentsCard baseline={base} scenario={scen} />

      <div className="grid lg:grid-cols-2 gap-6">
        <BreakdownChart
          totalKg={Math.max(1, base.response.breakdown.total_kg)}
          items={CATS.map((c) => ({
            name: c.name,
            kg: base.response.breakdown[c.field] as number,
          }))}
        />

        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <div className="text-sm font-semibold">Category deltas</div>
          <div className="mt-1 text-xs text-white/60">
            Scenario minus baseline (kg CO2e/year)
          </div>

          <div className="mt-4 space-y-2">
            {deltaByCat
              .slice()
              .sort((a, b) => Math.abs(b.kg) - Math.abs(a.kg))
              .map((d) => (
                <DeltaRow key={d.name} name={d.name} kg={d.kg} />
              ))}
          </div>

          <div className="mt-5">
            <DeltaChart items={deltaByCat} />
          </div>
        </div>
      </div>
    </div>
  )}
    </div>
  );
}

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
    <div className="rounded-2xl bg-black/30 border border-white/10 p-6">
      <div className="text-sm font-semibold">{title}</div>
      <select
        value={valueId}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm"
      >
        {allowNone && <option value="">None</option>}
        {snapshots.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label} • {new Date(s.createdAt).toLocaleString()}
          </option>
        ))}
      </select>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/30 border border-white/10 p-4">
      <div className="text-white/60 text-xs">{label}</div>
      <div className="mt-1 text-white text-sm font-semibold">{value}</div>
    </div>
  );
}

function DeltaRow({ name, kg }: { name: string; kg: number }) {
  const sign = kg > 0 ? "+" : "";
  const tone = kg > 0 ? "text-red-200" : kg < 0 ? "text-green-200" : "text-white/70";
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-black/30 border border-white/10 p-3">
      <div className="text-sm text-white/80">{name}</div>
      <div className={`text-sm font-semibold ${tone}`}>{sign}{Math.round(kg).toLocaleString()} kg</div>
    </div>
  );
}

function DeltaChart({ items }: { items: { name: string; kg: number }[] }) {
  const data = items
    .map((i) => ({ ...i, kg: Math.round(i.kg) }))
    .sort((a, b) => Math.abs(b.kg) - Math.abs(a.kg));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            type="number"
            tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.15)" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.15)" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.06)" }}
            contentStyle={{
              background: "rgba(0,0,0,0.85)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              color: "white",
            }}
            formatter={(value) => `${Number(value).toLocaleString()} kg`}
          />
          <Bar dataKey="kg" radius={[10, 10, 10, 10]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
