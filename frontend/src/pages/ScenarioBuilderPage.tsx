import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  calculateFootprint,
  type CalculateRequest,
  type DietType,
  type ConsumptionLevel,
} from "../api/greenr";
import { loadSession, saveSession, createSnapshot, getSnapshot } from "../state/session";
import { flightsBucketToCounts } from "./quickMappings";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function ensureDraftFromBaseline(req: CalculateRequest): CalculateRequest {
  return {
    ...req,
    electricity: { renewable_fraction: req.electricity?.renewable_fraction ?? 0, ...req.electricity },
    vehicle: { annual_miles: req.vehicle?.annual_miles ?? 0, ...req.vehicle },
    flights: {
      short_haul_count: req.flights?.short_haul_count ?? 0,
      medium_haul_count: req.flights?.medium_haul_count ?? 0,
      long_haul_count: req.flights?.long_haul_count ?? 0,
      ...req.flights,
    },
    diet: (req.diet ?? "low_meat") as DietType,
    consumption: (req.consumption ?? "average") as ConsumptionLevel,
    waste: {
      recycles_regularly: req.waste?.recycles_regularly ?? false,
      composts: req.waste?.composts ?? false,
    },
  };
}

export default function ScenarioBuilderPage() {
  const nav = useNavigate();
  const session = useMemo(() => loadSession(), []);
  const { snapshots } = session;

  const baseSnap =
    getSnapshot(session, session.baselineId) ??
    (snapshots.length ? snapshots[snapshots.length - 1] : null);

  const [draft, setDraft] = useState<CalculateRequest>(() =>
    baseSnap ? ensureDraftFromBaseline(baseSnap.request) : { mode: "quick", household_size: 1 }
  );

  const [scenarioName, setScenarioName] = useState<string>(() => {
    const count = Math.max(1, session.snapshots?.length ?? 1);
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
      <div className="bg-surface rounded-3xl p-8 border border-warm-border">
        <div className="text-lg font-bold text-warm-dark">No baseline yet</div>
        <p className="mt-2 text-warm-mid">Run a calculation first to create scenarios.</p>
        <Link
          to="/start"
          className="inline-block mt-5 bg-forest hover:bg-forest-light text-white font-bold px-6 py-3 rounded-full text-sm transition-colors"
        >
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
      saveSession({
        ...s,
        requestDraft: draft,
        lastResult: res,
        snapshots: [snap, ...s.snapshots],
        baselineId: s.baselineId ?? baseSnap.id,
        scenarioId: snap.id,
      });
      nav("/insights");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-warm-dark">Scenario builder</h1>
        <p className="mt-2 text-warm-mid text-sm">
          Start from your baseline and tweak a few high-impact inputs. We'll save this as a new
          scenario.
        </p>
      </div>

      {/* Baseline info */}
      <div className="bg-surface rounded-3xl p-5 border border-warm-border flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-warm-mid font-medium uppercase" style={{ letterSpacing: "0.06em" }}>
            Baseline
          </div>
          <div className="mt-1 font-bold text-warm-dark">
            {baseSnap.label}{" "}
            <span className="font-normal text-warm-mid">
              · {baseSnap.response.breakdown.total_metric_tons} tCO2e
            </span>
          </div>
        </div>
        <Link
          to="/results"
          className="text-sm text-forest font-medium hover:text-forest-light transition-colors"
        >
          Back to results
        </Link>
      </div>

      {/* Tweak cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Scenario name */}
        <TweakCard title="Scenario name">
          <input
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            className="w-full rounded-full bg-warm-input border border-warm-border px-4 py-2.5 text-sm text-warm-dark focus:outline-none focus:ring-2 focus:ring-forest"
            placeholder="Scenario name"
          />
        </TweakCard>

        {/* Renewables slider */}
        <TweakCard title="Renewable electricity">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-warm-mid">Fraction from renewables</span>
            <span className="font-extrabold text-warm-dark text-xl">{renewablePct}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={renewablePct}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                electricity: {
                  ...d.electricity,
                  renewable_fraction: clamp(Number(e.target.value), 0, 100) / 100,
                },
              }))
            }
            className="w-full"
          />
        </TweakCard>

        {/* Driving slider */}
        <TweakCard title="Annual driving">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-warm-mid">Miles per year</span>
            <span className="font-extrabold text-warm-dark text-xl">
              {(draft.vehicle?.annual_miles ?? 0).toLocaleString()}
            </span>
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
                vehicle: {
                  ...d.vehicle,
                  annual_miles: clamp(Number(e.target.value), 0, 30000),
                },
              }))
            }
            className="w-full"
          />
          <div className="mt-1 text-xs text-warm-mid">Set to 0 for no car.</div>
        </TweakCard>

        {/* Flights */}
        <TweakCard title="Flights per year">
          <div className="flex flex-wrap gap-2">
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
                        ...d.flights,
                        short_haul_count: short,
                        medium_haul_count: medium,
                        long_haul_count: long,
                      },
                    }));
                  }}
                  className="text-sm font-medium transition-all"
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: 9999,
                    border: selected ? "2px solid #2D5A1B" : "1px solid #D6CFC4",
                    background: selected ? "#2D5A1B" : "#E4DDD0",
                    color: selected ? "#FFFFFF" : "#1A1208",
                  }}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </TweakCard>

        {/* Diet */}
        <TweakCard title="Diet">
          <div className="flex flex-wrap gap-2">
            {(["vegan", "vegetarian", "low_meat", "high_meat"] as const).map((v) => {
              const selected = (draft.diet ?? "low_meat") === v;
              const labels: Record<string, string> = {
                vegan: "Vegan",
                vegetarian: "Vegetarian",
                low_meat: "Low meat",
                high_meat: "High meat",
              };
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, diet: v }))}
                  className="text-sm font-medium transition-all"
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: 9999,
                    border: selected ? "2px solid #2D5A1B" : "1px solid #D6CFC4",
                    background: selected ? "#2D5A1B" : "#E4DDD0",
                    color: selected ? "#FFFFFF" : "#1A1208",
                  }}
                >
                  {labels[v]}
                </button>
              );
            })}
          </div>
        </TweakCard>

        {/* Shopping */}
        <TweakCard title="Shopping">
          <div className="flex flex-wrap gap-2">
            {(["minimal", "average", "high"] as const).map((v) => {
              const selected = (draft.consumption ?? "average") === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, consumption: v }))}
                  className="text-sm font-medium transition-all capitalize"
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: 9999,
                    border: selected ? "2px solid #2D5A1B" : "1px solid #D6CFC4",
                    background: selected ? "#2D5A1B" : "#E4DDD0",
                    color: selected ? "#FFFFFF" : "#1A1208",
                  }}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </TweakCard>
      </div>

      {/* Submit */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={submit}
          disabled={loading}
          className="bg-forest hover:bg-forest-light text-white font-bold px-8 py-3 rounded-full text-sm transition-colors disabled:opacity-50"
        >
          {loading ? "Calculating…" : "Save scenario"}
        </button>
        <Link
          to="/insights"
          className="bg-surface border border-warm-border text-forest font-medium px-6 py-3 rounded-full text-sm hover:bg-cream transition-colors"
        >
          View insights
        </Link>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
}

function TweakCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-3xl border border-warm-border p-5">
      <div className="text-xs font-medium text-warm-mid uppercase mb-3" style={{ letterSpacing: "0.06em" }}>
        {title}
      </div>
      {children}
    </div>
  );
}
