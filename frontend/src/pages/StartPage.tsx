import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadSession, saveSession } from "../state/session";
import type { Mode } from "../api/greenr";

export default function StartPage() {
  const nav = useNavigate();
  const initial = useMemo(() => loadSession(), []);
  const [mode, setMode] = useState<Mode>(initial.mode ?? "quick");

  const start = () => {
    const s = loadSession();
    saveSession({
      ...s,
      mode,
      requestDraft: { ...s.requestDraft, mode },
      lastResult: null,
    });
    nav("/questions");
  };

  return (
    <div style={{ paddingTop: "80px", paddingBottom: "80px", paddingLeft: "1rem", paddingRight: "1rem" }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-warm-dark">
          How would you like to calculate?
        </h1>
        <p className="mt-3 text-warm-mid text-base">
          Quick is fastest. Full is more accurate.
        </p>
      </div>

      {/* Mode selector: stacked on mobile, side-by-side on desktop */}
      <div className="mt-16 max-w-2xl mx-auto">
        <div className="flex flex-col md:flex-row gap-0 items-stretch">
          <ModeColumn
            selected={mode === "quick"}
            title="Quick Estimate"
            time="Less than 1 min"
            bullets={[
              "Uses national averages when data is missing",
              "Best for demos and quick insight",
              "See where we made assumptions",
            ]}
            onClick={() => setMode("quick")}
          />
          {/* Horizontal rule on mobile only — vertical spacer removed */}
          <div
            className="block md:hidden"
            style={{ height: 1, background: "#D6CFC4", margin: "1.5rem 0" }}
          />
          <ModeColumn
            selected={mode === "full"}
            title="Full Questionnaire"
            time="2–5 minutes"
            bullets={[
              "More detailed energy and travel inputs",
              "More accurate category breakdown",
              "Better for saving and comparing later",
            ]}
            onClick={() => setMode("full")}
          />
        </div>
      </div>

      {/* Continue */}
      <div
        className="mt-16 max-w-2xl mx-auto flex justify-end"
        style={{ borderTop: "1px solid #D6CFC4", paddingTop: "2rem" }}
      >
        <button onClick={start} className="btn-underline" style={{ color: "#2D5A1B", fontSize: "1rem" }}>
          Continue →
        </button>
      </div>
    </div>
  );
}

function ModeColumn({
  selected,
  title,
  time,
  bullets,
  onClick,
}: {
  selected: boolean;
  title: string;
  time: string;
  bullets: string[];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 text-left pb-8 pr-0 md:pr-8"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        minHeight: 48,
      }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <span
          className="font-bold text-lg leading-snug"
          style={{
            color: selected ? "#2D5A1B" : "#1A1208",
            transition: "color 0.15s ease",
            borderBottom: selected ? "1.5px solid #2D5A1B" : "1.5px solid transparent",
            paddingBottom: "2px",
          }}
        >
          {title}
        </span>
        <span className="text-xs text-warm-mid font-medium whitespace-nowrap">{time}</span>
      </div>
      <div style={{ paddingLeft: 0 }}>
        {bullets.map((b) => (
          <div
            key={b}
            className="text-sm leading-relaxed"
            style={{
              color: selected ? "#7A6652" : "#A89880",
              marginBottom: "0.5rem",
              transition: "color 0.15s ease",
            }}
          >
            {b}
          </div>
        ))}
      </div>
    </button>
  );
}
