import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadSession, saveSession } from "../state/session";
import type { Mode } from "../api/greenr";

export default function StartPage() {
  const nav = useNavigate();
  const initial = useMemo(() => loadSession(), []);
  const [mode, setMode] = useState<Mode>(initial.mode ?? "quick");
  const [household, setHousehold] = useState<number>(initial.requestDraft.household_size ?? 1);

  const start = () => {
    const s = loadSession();
    const next = {
      ...s,
      mode,
      requestDraft: {
        ...s.requestDraft,
        mode,
        household_size: household,
      },
      lastResult: null,
    };
    saveSession(next);
    nav("/questions");
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl">
        <h1 className="text-2xl font-semibold">Choose your questionnaire</h1>
        <p className="mt-2 text-white/70">
          Quick is fastest. Full is more accurate. You can still get results either way.
        </p>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <ModeCard
            selected={mode === "quick"}
            title="Quick Estimate"
            time="2–3 minutes"
            bullets={[
              "Uses national averages when data is missing",
              "Best for demos and quick insight",
              "Still returns warnings for assumptions",
            ]}
            onClick={() => setMode("quick")}
          />
          <ModeCard
            selected={mode === "full"}
            title="Full Questionnaire"
            time="8–12 minutes"
            bullets={[
              "More detailed energy and travel inputs",
              "More accurate category breakdown",
              "Better for saving and comparing later",
            ]}
            onClick={() => setMode("full")}
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <label className="text-sm text-white/70">Household size</label>
          <input
            type="number"
            min={1}
            max={20}
            value={household}
            onChange={(e) => setHousehold(Math.max(1, Math.min(20, Number(e.target.value))))}
            className="w-24 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
          />

          <button
            onClick={start}
            className="ml-auto rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeCard({
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
      className={[
        "text-left rounded-2xl p-6 border transition",
        selected
          ? "bg-white/10 border-white/30"
          : "bg-white/5 border-white/10 hover:border-white/20",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{title}</div>
        <div className="text-xs text-white/60">{time}</div>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-white/70 list-disc pl-5">
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </button>
  );
}
