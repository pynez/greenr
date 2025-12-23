import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { calculateFootprint, type CalculateRequest, type DietType, type ConsumptionLevel } from "../api/greenr";
import { loadSession, saveSession, createSnapshot, getSnapshot } from "../state/session";
import { flightsBucketToCounts } from "./quickMappings";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function ensureDraftFromBaseline(baselineReq: CalculateRequest): CalculateRequest {
  // Keep baseline mode, but for scenario tweaks we allow both quick or full.
  // We'll preserve existing detailed inputs if present.
  return {
    ...baselineReq,
    electricity: { renewable_fraction: baselineReq.electricity?.renewable_fraction ?? 0, ...baselineReq.electricity },
    vehicle: { annual_miles: baselineReq.vehicle?.annual_miles ?? 0, ...baselineReq.vehicle },
    flights: {
      short_haul_count: baselineReq.flights?.short_haul_count ?? 0,
      medium_haul_count: baselineReq.flights?.medium_haul_count ?? 0,
      long_haul_count: baselineReq.flights?.long_haul_count ?? 0,
      ...baselineReq.flights,
    },
    diet: (baselineReq.diet ?? "low_meat") as DietType,
    consumption: (baselineReq.consumption ?? "average") as ConsumptionLevel,
    waste: {
      recycles_regularly: baselineReq.waste?.recycles_regularly ?? false,
      composts: baselineReq.waste?.composts ?? false,
    },
  };
}

export default function ScenarioBuilderPage() {
  const nav = useNavigate();
  const session = useMemo(() => loadSession(), []);
  const snapshots = session.snapshots;

  const baseSnap = getSnapshot(session, session.baselineId) ?? (snapshots.length ? snapshots[snapshots.length - 1] : null);

  const [draft, setDraft] = useState<CalculateRequest>(() => {
    if (!baseSnap) return { mode: "quick", household_size: 1 };
    // start from baseline request
    return ensureDraftFromBaseline(baseSnap.request);
  });

  const [scenarioName, setScenarioName] = useState<string>(() => {
    const s = loadSession();
    // Scenario index = number of non-baseline snaps + 1 (roughly)
    const count = Math.max(1, (s.snapshots?.length ?? 1));
    return `Scenario ${count}`;
  });

  const [flightsBucket, setFlightsBucket] = useState<"0" | "1-2" | "3-5" | "6+">(() => {
    const short = draft.flights?.short_haul_count ?? 0;
    if (short === 0) return "0";
    if (short <= 2) return "1-2";
    if (short <= 5) return "3-5";
    return "6+";
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const baseUrl = import.meta.env.VITE_GREENR_API_BASE_URL as string;
  const renewablePct = Math.round((draft.electricity?.renewable_fraction ?? 0) * 100);

  if (!baseSnap) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8">
        <div className="text-lg font-semibold">No baseline yet</div>
        <p className="mt-2 text-white/70">Run a calculation first to create scenarios.</p>
        <Link to="/start" className="inline-block mt-4 rounded-xl bg-white text-black px-4 py-2 text-sm font-medium">
          Start
        </Link>
      </div>
    );
  }

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await calculateFootprint(baseUrl, draft);

      const s = loadSession();
      const snap = createSnapshot(scenarioName.trim() || "Scenario", draft, res);

      const next = {
        ...s,
        requestDraft: draft,
        lastResult: res,
        snapshots: [snap, ...s.snapshots],
        baselineId: s.baselineId ?? baseSnap.id,
        scenarioId: snap.id, // auto-select this new scenario
      };

      saveSession(next);
      nav("/insights");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Scenario builder</h1>
            <p className="mt-2 text-white/70">
              Start from your baseline and tweak a few high-impact inputs. We’ll save this as a new scenario.
            </p>
          </div>
          <Link to="/results" className="text-sm text-white/70 hover:text-white">
            Back to results
          </Link>
        </div>

        <div className="mt-6 rounded-2xl bg-black/30 border border-white/10 p-6">
          <div className="text-sm font-semibold">Baseline</div>
          <div className="mt-1 text-sm text-white/70">
            {baseSnap.label} • {baseSnap.response.breakdown.total_metric_tons} tCO2e
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <Section title="Scenario name">
            <input
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm"
              placeholder="Scenario name"
            />
          </Section>

          <Section title="Renewables">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/70">Renewable electricity</div>
              <div className="text-sm font-semibold">{renewablePct}%</div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={renewablePct}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  electricity: { ...(d.electricity ?? {}), renewable_fraction: clamp(Number(e.target.value), 0, 100) / 100 },
                }))
              }
              className="mt-3 w-full"
            />
          </Section>

          <Section title="Driving">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/70">Annual miles</div>
              <div className="text-sm font-semibold">{(draft.vehicle?.annual_miles ?? 0).toLocaleString()}</div>
            </div>
            <input
              type="range"
              min={0}
              max={30000}
              step={500}
              value={draft.vehicle?.annual_miles ?? 0}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  vehicle: { ...(d.vehicle ?? {}), annual_miles: clamp(Number(e.target.value), 0, 30000) },
                }))
              }
              className="mt-3 w-full"
            />
            <div className="mt-2 text-xs text-white/55">
              Tip: if you want “no car,” set this to 0.
            </div>
          </Section>

          <Section title="Flights">
            <div className="text-sm text-white/70">Flights per year (quick bucket)</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["0", "1-2", "3-5", "6+"] as const).map((b) => {
                const selected = b === flightsBucket;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      setFlightsBucket(b);
                      const { short, medium, long } = flightsBucketToCounts(b);
                      setDraft((d) => ({
                        ...d,
                        flights: {
                          ...(d.flights ?? {}),
                          short_haul_count: short,
                          medium_haul_count: medium,
                          long_haul_count: long,
                        },
                      }));
                    }}
                    className={[
                      "px-3 py-2 rounded-xl text-sm border transition",
                      selected ? "bg-white/15 border-white/30 text-white" : "bg-white/5 border-white/10 text-white/80 hover:border-white/20",
                    ].join(" ")}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Diet">
            <Pills
              value={(draft.diet ?? "low_meat") as DietType}
              onChange={(v) => setDraft((d) => ({ ...d, diet: v }))}
              options={[
                { value: "vegan", label: "Vegan" },
                { value: "vegetarian", label: "Vegetarian" },
                { value: "low_meat", label: "Low meat" },
                { value: "high_meat", label: "High meat" },
              ]}
            />
          </Section>

          <Section title="Shopping">
            <Pills
              value={(draft.consumption ?? "average") as ConsumptionLevel}
              onChange={(v) => setDraft((d) => ({ ...d, consumption: v }))}
              options={[
                { value: "minimal", label: "Minimal" },
                { value: "average", label: "Average" },
                { value: "high", label: "High" },
              ]}
            />
          </Section>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={submit}
            disabled={loading}
            className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 disabled:opacity-60"
          >
            {loading ? "Calculating..." : "Save scenario"}
          </button>

          <Link
            to="/insights"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:text-white"
          >
            View insights
          </Link>

          {error && <div className="text-sm text-red-300">{error}</div>}
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="text-sm font-semibold">Debug preview</div>
        <pre className="mt-2 text-xs text-white/70 overflow-auto">{JSON.stringify(draft, null, 2)}</pre>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-black/30 border border-white/10 p-6">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Pills<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={[
              "px-3 py-2 rounded-xl text-sm border transition",
              selected ? "bg-white/15 border-white/30 text-white" : "bg-white/5 border-white/10 text-white/80 hover:border-white/20",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}