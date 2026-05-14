import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { clearSession, loadSession } from "../state/session";
import BreakdownChart from "../components/BreakdownChart";
import SuggestionsCard from "../components/SuggestionsCard";

// ─── Atmospheric gradient mapping ────────────────────────────────────────────

function atmosphericGradient(tons: number): string {
  const g1 = "linear-gradient(to bottom, #F4A261, #E8C49A, #C4D4E8)";
  const g2 = "linear-gradient(to bottom, #B8A9D4, #C4B8E0, #D4C8E8)";
  const g3 = "linear-gradient(to bottom, #8FA8C4, #A8B8CC, #C0C8D4)";
  const g4 = "linear-gradient(to bottom, #8D9DA8, #A09488, #B4A898)";

  if (tons < 4) return g1;
  if (tons < 7) return g2;
  if (tons < 11) return g3;
  return g4;
}

const WARNING_LABELS: Record<string, string> = {
  QUICK_MODE: "Quick estimate",
  MISSING_VEHICLE: "Vehicle",
  MISSING_ELECTRICITY: "Electricity",
  MISSING_HEATING: "Heating",
  MISSING_FLIGHTS: "Flights",
  MISSING_DIET: "Diet",
  MISSING_CONSUMPTION: "Consumption",
  MISSING_WASTE: "Waste",
  DEFAULT_USED: "Default value",
};

function friendlyCode(code: string): string {
  return WARNING_LABELS[code] ?? code
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function footprintLabel(tons: number): string {
  if (tons < 4) return "excellent — well below the global average";
  if (tons < 7) return "good — below the US average of ~14 tCO2e";
  if (tons < 11) return "about average for a US household member";
  return "above average — there's meaningful room to reduce";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const nav = useNavigate();
  const session = loadSession();
  const result = session.lastResult;

  if (!result) {
    return (
      <div style={{ paddingTop: "80px", paddingBottom: "80px" }} className="text-center">
        <div className="text-lg font-bold text-warm-dark">No results yet</div>
        <p className="mt-3 text-warm-mid">Start a new calculation to see results.</p>
        <div className="mt-8">
          <Link to="/start" className="btn-underline" style={{ color: "#2D5A1B" }}>
            Get started
          </Link>
        </div>
      </div>
    );
  }

  const b = result.breakdown;
  const tons = b.total_metric_tons;

  const restart = () => {
    clearSession();
    nav("/start");
  };

  const categories = [
    { name: "Electricity", kg: b.electricity_kg },
    { name: "Heating", kg: b.heating_kg },
    { name: "Vehicle", kg: b.vehicle_kg },
    { name: "Flights", kg: b.flights_kg },
    { name: "Diet", kg: b.diet_kg },
    { name: "Consumption", kg: b.consumption_kg },
  ];

  const maxKg = Math.max(...categories.map((c) => c.kg));

  return (
    <div>
      {/* Result hero — atmospheric gradient, no rounded corners */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{
          background: atmosphericGradient(tons),
          padding: "3rem 2rem 2.5rem",
        }}
      >
        <div className="text-sm font-medium text-warm-dark opacity-70">
          your annual footprint
        </div>
        <div className="mt-2 flex items-baseline gap-3 flex-wrap">
          <span
            className="font-extrabold text-warm-dark leading-none"
            style={{ fontSize: "clamp(3.5rem, 12vw, 5rem)" }}
          >
            {tons.toFixed(1)}
          </span>
          <span className="text-warm-mid text-2xl">tCO2e</span>
        </div>
        <div className="mt-2 text-sm text-warm-mid">{footprintLabel(tons)}</div>

        {/* Category typographic table */}
        <div className="mt-8" style={{ borderTop: "1px solid rgba(214,207,196,0.6)" }}>
          {categories.map((c) => {
            const isHighest = c.kg === maxKg && c.kg > 0;
            return (
              <div
                key={c.name}
                className="flex items-baseline justify-between py-3"
                style={{ borderBottom: "1px solid rgba(214,207,196,0.6)" }}
              >
                <span
                  className="font-medium text-sm"
                  style={{ color: isHighest ? "#C4622D" : "#1A1208" }}
                >
                  {c.name}
                </span>
                <span
                  className="font-extrabold text-sm"
                  style={{ color: isHighest ? "#C4622D" : "#1A1208" }}
                >
                  {Math.round(c.kg).toLocaleString()} kg
                </span>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col md:flex-row flex-wrap gap-4 md:gap-8">
          <Link to="/questions" className="btn-underline text-sm">
            Edit answers
          </Link>
          <Link to="/insights" className="btn-underline text-sm">
            Explore insights
          </Link>
          <button
            onClick={() => nav("/scenario")}
            className="btn-underline text-sm"
            style={{ color: "#2D5A1B" }}
          >
            Create scenario
          </button>
          <button onClick={restart} className="btn-underline text-sm">
            Start over
          </button>
        </div>
      </motion.div>

      {/* Suggestions */}
      <div style={{ paddingTop: "80px" }}>
        <SuggestionsCard breakdown={b} />
      </div>

      {/* Breakdown chart */}
      <div style={{ paddingTop: "80px" }}>
        <BreakdownChart totalKg={b.total_kg} items={categories} />
      </div>

      {/* Estimation notes */}
      {result.warnings.length > 0 && (
        <div style={{ paddingTop: "80px", paddingBottom: "40px" }}>
          <div
            className="font-bold text-warm-dark text-sm pb-4"
            style={{ borderBottom: "1px solid #D6CFC4" }}
          >
            Estimation notes
          </div>
          <ul className="mt-0 space-y-0 text-sm text-warm-mid">
            {result.warnings.map((w, i) => (
              <li
                key={`${w.code}-${i}`}
                className="py-3"
                style={{ borderBottom: "1px solid #D6CFC4" }}
              >
                <span className="text-warm-dark font-medium">{friendlyCode(w.code)}:</span> {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
