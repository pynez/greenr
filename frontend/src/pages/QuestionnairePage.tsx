import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loadSession, saveSession } from "../state/session";
import { calculateFootprint } from "../api/greenr";
import FullQuestionnaire from "./FullQuestionnaire";
import { createSnapshot } from "../state/session";
import type { CalculateRequest, DietType, ConsumptionLevel } from "../api/greenr";
import { ensureQuickShape, drivingLevelToMiles, flightsBucketToCounts, type DrivingLevel } from "./quickMappings";

export default function QuestionnairePage() {
  const nav = useNavigate();
  const initial = useMemo(() => loadSession(), []);
  const mode = initial.requestDraft.mode ?? "quick";

  const [draft, setDraft] = useState<CalculateRequest>(() => {
    // For this step, we only implement quick UI.
    // If user somehow arrives here with full mode, we still render quick UI but keep mode as-is.
    const base = { ...initial.requestDraft, mode };
    return ensureQuickShape(base);
  });

  const [driving, setDriving] = useState<DrivingLevel>(() => {
    const miles = draft.vehicle?.annual_miles ?? 0;
    if (miles <= 0) return "none";
    if (miles <= 7000) return "occasional";
    return "regular";
  });

  const [flightsBucket, setFlightsBucket] = useState<"0" | "1-2" | "3-5" | "6+">(() => {
    const s = draft.flights?.short_haul_count ?? 0;
    if (s === 0) return "0";
    if (s <= 2) return "1-2";
    if (s <= 5) return "3-5";
    return "6+";
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const baseUrl = import.meta.env.VITE_GREENR_API_BASE_URL as string;

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await calculateFootprint(baseUrl, draft);

      const s = loadSession();

      // Decide label based on whether baseline exists
      const isFirst = s.snapshots.length === 0;
      const label = isFirst ? "Baseline" : `Scenario ${s.snapshots.length}`;

      const snap = createSnapshot(label, draft, res);

      const next = {
      ...s,
      requestDraft: draft,
      lastResult: res,
      mode: (draft.mode ?? "quick") as any,
      snapshots: [snap, ...s.snapshots],
      baselineId: s.baselineId ?? snap.id,     // first run becomes baseline
      scenarioId: s.scenarioId,                // keep if user already set
      };

    saveSession(next);
    nav("/results");
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
            <h1 className="text-2xl font-semibold">Quick Estimate</h1>
            <p className="mt-2 text-white/70">
              Answer a few questions. We’ll fill gaps with national averages and show how we calculated your footprint.
            </p>
          </div>
          <Link to="/start" className="text-sm text-white/70 hover:text-white">
            Change mode
          </Link>
        </div>

        <div className="mt-8">
  {mode === "full" ? (
    <FullQuestionnaire draft={draft} setDraft={setDraft} />
  ) : (
    <QuickQuestionnaireBody
      draft={draft}
      setDraft={setDraft}
      driving={driving}
      setDriving={setDriving}
      flightsBucket={flightsBucket}
      setFlightsBucket={setFlightsBucket}
    />
  )}
</div>


        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={submit}
            disabled={loading}
            className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 disabled:opacity-60"
          >
            {loading ? "Calculating..." : "See results"}
          </button>

          {error && <div className="text-sm text-red-300">{error}</div>}
        </div>
      </div>

      {/* Remove debug box for MVP polish */}
      {/* If you want it back, we can add a hidden dev toggle later */}
    </div>
  );
}

function QuickQuestionnaireBody({
  draft,
  setDraft,
  driving,
  setDriving,
  flightsBucket,
  setFlightsBucket,
}: {
  draft: CalculateRequest;
  setDraft: React.Dispatch<React.SetStateAction<CalculateRequest>>;
  driving: DrivingLevel;
  setDriving: React.Dispatch<React.SetStateAction<DrivingLevel>>;
  flightsBucket: "0" | "1-2" | "3-5" | "6+";
  setFlightsBucket: React.Dispatch<React.SetStateAction<"0" | "1-2" | "3-5" | "6+">>;
}) {
  const setHousehold = (n: number) => {
    const clamped = Math.max(1, Math.min(20, n));
    setDraft((d) => ({ ...d, household_size: clamped }));
  };

  const setRenewables = (fraction: number) => {
    const f = Math.max(0, Math.min(1, fraction));
    setDraft((d) => ({
      ...d,
      electricity: { ...(d.electricity ?? {}), renewable_fraction: f },
    }));
  };

  const toggleWaste = (key: "recycles_regularly" | "composts") => {
    setDraft((d) => ({
      ...d,
      waste: { ...(d.waste ?? {}), [key]: !(d.waste?.[key] ?? false) },
    }));
  };

  const onDrivingChange = (level: DrivingLevel) => {
    setDriving(level);
    setDraft((d) => ({
      ...d,
      vehicle: { ...(d.vehicle ?? {}), annual_miles: drivingLevelToMiles(level) },
    }));
  };

  const onFlightsChange = (bucket: "0" | "1-2" | "3-5" | "6+") => {
    setFlightsBucket(bucket);
    const { short, medium, long } = flightsBucketToCounts(bucket);
    setDraft((d) => ({
      ...d,
      flights: {
        ...(d.flights ?? {}),
        short_haul_count: short,
        medium_haul_count: medium,
        long_haul_count: long,
      },
    }));
  };

  const renewablePct = Math.round((draft.electricity?.renewable_fraction ?? 0) * 100);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Section title="Household">
        <LabelRow label="Household size">
          <input
            type="number"
            min={1}
            max={20}
            placeholder="1–20"
            value={draft.household_size ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setDraft((d) => ({ ...d, household_size: undefined }));
                return;
              }
              setHousehold(Number(v));
            }}
            className="w-28 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm placeholder:text-white/40"
          />
        </LabelRow>
      </Section>

      <Section title="Electricity">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/70">Renewable electricity</div>
          <div className="text-sm font-semibold">{renewablePct}%</div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={renewablePct}
          onChange={(e) => setRenewables(Number(e.target.value) / 100)}
          className="mt-3 w-full"
        />
        <div className="mt-2 text-xs text-white/55">
          If you’re not sure, leave it at 0. We can guestimate.
        </div>
      </Section>

      <Section title="Transportation">
        <FieldLabel>Driving</FieldLabel>
        <PillRow
          value={driving}
          onChange={onDrivingChange}
          options={[
            { value: "none", label: "No car" },
            { value: "occasional", label: "Occasional" },
            { value: "regular", label: "Regular" },
          ]}
        />

        <FieldLabel className="mt-5">Flights per year</FieldLabel>
        <PillRow
          value={flightsBucket}
          onChange={onFlightsChange}
          options={[
            { value: "0", label: "0" },
            { value: "1-2", label: "1–2" },
            { value: "3-5", label: "3–5" },
            { value: "6+", label: "6+" },
          ]}
        />
      </Section>

      <Section title="Lifestyle">
        <FieldLabel>Diet</FieldLabel>
        <PillRow
          value={(draft.diet ?? "low_meat") as DietType}
          onChange={(v) => setDraft((d) => ({ ...d, diet: v }))}
          options={[
            { value: "vegan", label: "Vegan" },
            { value: "vegetarian", label: "Vegetarian" },
            { value: "low_meat", label: "Low meat" },
            { value: "high_meat", label: "High meat" },
          ]}
        />

        <FieldLabel className="mt-5">Shopping</FieldLabel>
        <PillRow
          value={(draft.consumption ?? "average") as ConsumptionLevel}
          onChange={(v) => setDraft((d) => ({ ...d, consumption: v }))}
          options={[
            { value: "minimal", label: "Minimal" },
            { value: "average", label: "Average" },
            { value: "high", label: "High" },
          ]}
        />

        <FieldLabel className="mt-5">Waste habits</FieldLabel>
        <div className="mt-2 flex flex-col gap-2">
          <Checkbox
            checked={draft.waste?.recycles_regularly ?? false}
            onChange={() => toggleWaste("recycles_regularly")}
            label="I recycle regularly"
          />
          <Checkbox
            checked={draft.waste?.composts ?? false}
            onChange={() => toggleWaste("composts")}
            label="I compost food waste"
          />
        </div>
      </Section>
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

function LabelRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-white/70">{label}</div>
      {children}
    </div>
  );
}

function FieldLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm text-white/70 ${className}`}>{children}</div>;
}

function PillRow<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
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

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-3 text-sm text-white/80 select-none cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-white"
      />
      {label}
    </label>
  );
}
