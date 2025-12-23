import { Link, useNavigate } from "react-router-dom";
import { clearSession, loadSession } from "../state/session";
import BreakdownChart from "../components/BreakdownChart";
import SuggestionsCard from "../components/SuggestionsCard";

export default function ResultsPage() {
  const nav = useNavigate();
  const session = loadSession();
  const result = session.lastResult;

  if (!result) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8">
        <div className="text-lg font-semibold">No results yet</div>
        <p className="mt-2 text-white/70">Start a new calculation to see results.</p>
        <Link to="/start" className="inline-block mt-4 rounded-xl bg-white text-black px-4 py-2 text-sm font-medium">
          Go to Start
        </Link>
      </div>
    );
  }

  const b = result.breakdown;

  const restart = () => {
    clearSession();
    nav("/start");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl">
        <div className="text-sm text-white/60">Annual footprint</div>
        <div className="mt-2 text-5xl font-semibold tracking-tight">
          {b.total_metric_tons} <span className="text-white/60 text-2xl">tCO2e</span>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-3 text-sm">
          <Metric label="Home electricity" value={`${b.electricity_kg} kg`} />
          <Metric label="Home heating" value={`${b.heating_kg} kg`} />
          <Metric label="Vehicle" value={`${b.vehicle_kg} kg`} />
          <Metric label="Flights" value={`${b.flights_kg} kg`} />
          <Metric label="Diet" value={`${b.diet_kg} kg`} />
          <Metric label="Consumption" value={`${b.consumption_kg} kg`} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
            <Link
                to="/questions"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:text-white"
            >
                Edit answers
            </Link>

            <Link
                to="/insights"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:text-white"
            >
                Explore insights
            </Link>

            <button
                onClick={() => nav("/scenario")}
                className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90"
                >
                Create scenario
            </button>

            <button
                onClick={restart}
                className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90"
            >
                Start over
            </button>
            </div>
      </div>

      <SuggestionsCard breakdown={b} />

    <BreakdownChart
    totalKg={b.total_kg}
    items={[
        { name: "Electricity", kg: b.electricity_kg },
        { name: "Heating", kg: b.heating_kg },
        { name: "Vehicle", kg: b.vehicle_kg },
        { name: "Flights", kg: b.flights_kg },
        { name: "Diet", kg: b.diet_kg },
        { name: "Consumption", kg: b.consumption_kg },
    ]}
    />
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="text-sm font-semibold">Estimation notes</div>
        {result.warnings.length === 0 ? (
          <div className="mt-2 text-sm text-white/70">No warnings.</div>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-white/70 list-disc pl-5">
            {result.warnings.map((w, i) => (
              <li key={`${w.code}-${i}`}>
                <span className="text-white/90">{w.code}:</span> {w.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/30 border border-white/10 p-4">
      <div className="text-white/60 text-xs">{label}</div>
      <div className="mt-1 text-white text-base font-semibold">{value}</div>
    </div>
  );
}
