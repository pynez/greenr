import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { loadSession, saveSession, createSnapshot } from "../state/session";
import { calculateFootprint } from "../api/greenr";
import {
  ensureQuickShape,
  drivingLevelToMiles,
  flightsBucketToCounts,
  type DrivingLevel,
} from "./quickMappings";
import type {
  CalculateRequest,
  DietType,
  ConsumptionLevel,
  VehicleType,
} from "../api/greenr";

// ─── Step config ────────────────────────────────────────────────────────────

const QUICK_STEPS = [
  { category: "household", question: "How many people live in your home?" },
  { category: "energy", question: "What percentage of your electricity is renewable?" },
  { category: "transportation", question: "How much do you drive?" },
  { category: "transportation", question: "How many flights do you take each year?" },
  { category: "lifestyle", question: "What best describes your diet?" },
  { category: "lifestyle", question: "How much do you shop for new things?" },
  { category: "lifestyle", question: "What are your waste habits?" },
];

const FULL_STEPS = [
  { category: "household", question: "How many people live in your home?" },
  { category: "energy", question: "How would you like to enter your electricity usage?" },
  { category: "energy", question: "What percentage of your electricity is renewable?" },
  { category: "energy", question: "How do you heat your home?" },
  { category: "transportation", question: "How many miles do you drive per year?" },
  { category: "transportation", question: "What type of vehicle do you drive?" },
  { category: "transportation", question: "What's your vehicle's fuel efficiency? (optional)" },
  { category: "transportation", question: "How many flights did you take last year?" },
  { category: "lifestyle", question: "What best describes your diet?" },
  { category: "lifestyle", question: "How much do you shop for new things?" },
  { category: "lifestyle", question: "What are your waste habits?" },
];

// ─── Variants ────────────────────────────────────────────────────────────────

const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "60%" : "-60%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? "-60%" : "60%",
    opacity: 0,
  }),
};

// ─── Main component ──────────────────────────────────────────────────────────

export default function QuestionnairePage() {
  const nav = useNavigate();
  const initial = useMemo(() => loadSession(), []);
  const mode = initial.requestDraft.mode ?? "quick";
  const isMobile = useMemo(() => typeof window !== "undefined" && window.innerWidth < 768, []);

  const [draft, setDraft] = useState<CalculateRequest>(() => {
    const base = { ...initial.requestDraft, mode };
    return ensureQuickShape(base);
  });

  const [driving, setDriving] = useState<DrivingLevel>(() => {
    const miles = initial.requestDraft.vehicle?.annual_miles ?? 0;
    if (miles <= 0) return "none";
    if (miles <= 7000) return "occasional";
    return "regular";
  });
  const [flightsBucket, setFlightsBucket] = useState<"0" | "1-2" | "3-5" | "6+">(() => {
    const s = initial.requestDraft.flights?.short_haul_count ?? 0;
    if (s === 0) return "0";
    if (s <= 2) return "1-2";
    if (s <= 5) return "3-5";
    return "6+";
  });

  const [elecMode, setElecMode] = useState<"kwh" | "cost" | "unknown">(() => {
    const e = initial.requestDraft.electricity;
    if (e?.monthly_kwh != null) return "kwh";
    if (e?.monthly_cost_usd != null) return "cost";
    return "unknown";
  });
  const [heatMode, setHeatMode] = useState<"therms" | "cost" | "unknown">(() => {
    const h = initial.requestDraft.heating;
    if (h?.monthly_therms != null) return "therms";
    if (h?.monthly_cost_usd != null) return "cost";
    return "unknown";
  });

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const steps = mode === "quick" ? QUICK_STEPS : FULL_STEPS;
  const totalSteps = steps.length;
  const isLast = step === totalSteps - 1;
  const progressPct = ((step + 1) / totalSteps) * 100;

  const validateStep = (): string | null => {
    if (mode === "quick") {
      if (step === 0) {
        const v = draft.household_size ?? 0;
        if (!Number.isFinite(v) || v < 1 || v > 20)
          return "Household size must be between 1 and 20.";
      }
    } else {
      if (step === 0) {
        const v = draft.household_size ?? 0;
        if (!Number.isFinite(v) || v < 1 || v > 20)
          return "Household size must be between 1 and 20.";
      }
      if (step === 1) {
        if (elecMode === "kwh") {
          const v = draft.electricity?.monthly_kwh ?? -1;
          if (!Number.isFinite(v) || v < 0 || v > 100000)
            return "Monthly kWh must be between 0 and 100,000.";
        }
        if (elecMode === "cost") {
          const v = draft.electricity?.monthly_cost_usd ?? -1;
          if (!Number.isFinite(v) || v < 0 || v > 100000)
            return "Monthly cost must be between $0 and $100,000.";
        }
      }
      if (step === 3) {
        if (heatMode === "therms") {
          const v = draft.heating?.monthly_therms ?? -1;
          if (!Number.isFinite(v) || v < 0 || v > 100000)
            return "Monthly therms must be between 0 and 100,000.";
        }
        if (heatMode === "cost") {
          const v = draft.heating?.monthly_cost_usd ?? -1;
          if (!Number.isFinite(v) || v < 0 || v > 100000)
            return "Monthly cost must be between $0 and $100,000.";
        }
      }
      if (step === 4) {
        const v = draft.vehicle?.annual_miles ?? -1;
        if (!Number.isFinite(v) || v < 0 || v > 200000)
          return "Annual miles must be between 0 and 200,000.";
      }
      if (step === 6) {
        const v = draft.vehicle?.mpg ?? 0;
        if (v !== 0 && (!Number.isFinite(v) || v < 1 || v > 200))
          return "MPG must be between 1 and 200, or leave 0 to skip.";
      }
    }
    return null;
  };

  const goNext = async () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    if (isLast) {
      await submit();
    } else {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_GREENR_API_BASE_URL as string;
      const res = await calculateFootprint(baseUrl, draft);
      const s = loadSession();
      const isFirst = s.snapshots.length === 0;
      const label = isFirst ? "Baseline" : `Scenario ${s.snapshots.length}`;
      const snap = createSnapshot(label, draft, res);
      saveSession({
        ...s,
        requestDraft: draft,
        lastResult: res,
        mode: (draft.mode ?? "quick") as "quick" | "full",
        snapshots: [snap, ...s.snapshots],
        baselineId: s.baselineId ?? snap.id,
        scenarioId: s.scenarioId,
      });
      nav("/results");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const current = steps[step];

  return (
    <div
      className="bg-cream flex flex-col"
      style={{ minHeight: "100dvh", height: "100dvh", overflow: "hidden" }}
    >
      {/* Progress bar */}
      <div className="h-0.5 bg-warm-border flex-none">
        <motion.div
          className="h-full bg-forest"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Top chrome */}
      <div className="flex-none flex items-center justify-between px-6 sm:px-10 py-5">
        <Link to="/" className="text-forest font-extrabold text-lg tracking-tight">
          Greenr
        </Link>
        <span className="text-warm-mid text-sm">
          step {step + 1} of {totalSteps}
        </span>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: isMobile ? 0.25 : 0.35, ease: "easeOut" }}
            className="w-full max-w-xl flex flex-col items-center text-center"
          >
            <div
              className="text-forest font-medium text-xs uppercase mb-5"
              style={{ letterSpacing: "0.08em" }}
            >
              {current.category}
            </div>

            <h2
              className="text-warm-dark font-bold leading-tight mb-10 max-w-lg text-2xl md:text-[2rem]"
            >
              {current.question}
            </h2>

            <div className="w-full">
              <StepInput
                step={step}
                mode={mode}
                draft={draft}
                setDraft={setDraft}
                driving={driving}
                setDriving={setDriving}
                flightsBucket={flightsBucket}
                setFlightsBucket={setFlightsBucket}
                elecMode={elecMode}
                setElecMode={setElecMode}
                heatMode={heatMode}
                setHeatMode={setHeatMode}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom chrome */}
      <div className="flex-none flex items-center justify-between px-6 sm:px-10 py-8">
        <button
          onClick={goBack}
          className={["btn-underline text-sm", step === 0 ? "invisible" : ""].join(" ")}
          style={{ color: "#7A6652" }}
        >
          Back
        </button>

        <div className="flex flex-col items-end gap-2">
          {error && <div className="text-sm text-red-600 max-w-xs text-right">{error}</div>}
          <button
            onClick={goNext}
            disabled={loading}
            className="btn-underline"
            style={{ color: "#2D5A1B", fontSize: "1rem" }}
          >
            {loading ? "Calculating…" : isLast ? "See results →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step input dispatcher ────────────────────────────────────────────────────

function StepInput({
  step,
  mode,
  draft,
  setDraft,
  driving,
  setDriving,
  flightsBucket,
  setFlightsBucket,
  elecMode,
  setElecMode,
  heatMode,
  setHeatMode,
}: {
  step: number;
  mode: string;
  draft: CalculateRequest;
  setDraft: React.Dispatch<React.SetStateAction<CalculateRequest>>;
  driving: DrivingLevel;
  setDriving: (d: DrivingLevel) => void;
  flightsBucket: "0" | "1-2" | "3-5" | "6+";
  setFlightsBucket: (b: "0" | "1-2" | "3-5" | "6+") => void;
  elecMode: "kwh" | "cost" | "unknown";
  setElecMode: (m: "kwh" | "cost" | "unknown") => void;
  heatMode: "therms" | "cost" | "unknown";
  setHeatMode: (m: "therms" | "cost" | "unknown") => void;
}) {
  const renewablePct = Math.round((draft.electricity?.renewable_fraction ?? 0) * 100);

  if (mode === "quick") {
    switch (step) {
      case 0:
        return <BigNumberInput value={draft.household_size ?? 1} onChange={(v) => setDraft((d) => ({ ...d, household_size: v }))} min={1} max={20} />;

      case 1:
        return (
          <div className="space-y-5 flex flex-col items-center">
            <div className="font-extrabold text-warm-dark" style={{ fontSize: "4rem" }}>
              {renewablePct}%
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={renewablePct}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  electricity: { ...d.electricity, renewable_fraction: Number(e.target.value) / 100 },
                }))
              }
              className="w-full max-w-sm"
            />
            <p className="text-sm text-warm-mid">Not sure? Leave it at 0%.</p>
          </div>
        );

      case 2:
        return (
          <TextGroup
            value={driving}
            onChange={(v: DrivingLevel) => {
              setDriving(v);
              setDraft((d) => ({ ...d, vehicle: { ...d.vehicle, annual_miles: drivingLevelToMiles(v) } }));
            }}
            options={[
              { value: "none", label: "No car" },
              { value: "occasional", label: "Occasional" },
              { value: "regular", label: "Regular" },
            ]}
          />
        );

      case 3:
        return (
          <TextGroup
            value={flightsBucket}
            onChange={(v) => {
              setFlightsBucket(v);
              const { short, medium, long } = flightsBucketToCounts(v);
              setDraft((d) => ({
                ...d,
                flights: { ...d.flights, short_haul_count: short, medium_haul_count: medium, long_haul_count: long },
              }));
            }}
            options={[
              { value: "0", label: "None" },
              { value: "1-2", label: "1–2" },
              { value: "3-5", label: "3–5" },
              { value: "6+", label: "6+" },
            ]}
          />
        );

      case 4:
        return (
          <TextGroup
            value={draft.diet ?? "low_meat"}
            onChange={(v) => setDraft((d) => ({ ...d, diet: v as DietType }))}
            options={[
              { value: "vegan", label: "Vegan" },
              { value: "vegetarian", label: "Vegetarian" },
              { value: "low_meat", label: "Low meat" },
              { value: "high_meat", label: "High meat" },
            ]}
          />
        );

      case 5:
        return (
          <TextGroup
            value={draft.consumption ?? "average"}
            onChange={(v) => setDraft((d) => ({ ...d, consumption: v as ConsumptionLevel }))}
            options={[
              { value: "minimal", label: "Minimal" },
              { value: "average", label: "Average" },
              { value: "high", label: "High" },
            ]}
          />
        );

      case 6:
        return <WasteInput draft={draft} setDraft={setDraft} />;
    }
  }

  // Full mode
  switch (step) {
    case 0:
      return <BigNumberInput value={draft.household_size ?? 1} onChange={(v) => setDraft((d) => ({ ...d, household_size: v }))} min={1} max={20} />;

    case 1:
      return (
        <div className="space-y-8 flex flex-col items-center w-full">
          <TextGroup
            value={elecMode}
            onChange={(v) => {
              const m = v as "kwh" | "cost" | "unknown";
              setElecMode(m);
              setDraft((d) => ({
                ...d,
                electricity:
                  m === "kwh"
                    ? { ...d.electricity, monthly_kwh: d.electricity?.monthly_kwh ?? 0, monthly_cost_usd: null }
                    : m === "cost"
                    ? { ...d.electricity, monthly_kwh: null, monthly_cost_usd: d.electricity?.monthly_cost_usd ?? 0 }
                    : { ...d.electricity, monthly_kwh: null, monthly_cost_usd: null },
              }));
            }}
            options={[
              { value: "kwh", label: "kWh / month" },
              { value: "cost", label: "Cost / month" },
              { value: "unknown", label: "I don't know" },
            ]}
          />
          {elecMode === "kwh" && (
            <NumberField
              label="Monthly kWh"
              value={draft.electricity?.monthly_kwh ?? 0}
              onChange={(v) => setDraft((d) => ({ ...d, electricity: { ...d.electricity, monthly_kwh: v } }))}
              min={0}
              max={100000}
            />
          )}
          {elecMode === "cost" && (
            <NumberField
              label="Monthly cost (USD)"
              value={draft.electricity?.monthly_cost_usd ?? 0}
              onChange={(v) => setDraft((d) => ({ ...d, electricity: { ...d.electricity, monthly_cost_usd: v } }))}
              min={0}
              max={100000}
            />
          )}
        </div>
      );

    case 2:
      return (
        <div className="space-y-5 flex flex-col items-center">
          <div className="font-extrabold text-warm-dark" style={{ fontSize: "4rem" }}>
            {renewablePct}%
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={renewablePct}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                electricity: { ...d.electricity, renewable_fraction: Number(e.target.value) / 100 },
              }))
            }
            className="w-full max-w-sm"
          />
          <p className="text-sm text-warm-mid">Not sure? Leave it at 0%.</p>
        </div>
      );

    case 3:
      return (
        <div className="space-y-8 flex flex-col items-center w-full">
          <TextGroup
            value={heatMode}
            onChange={(v) => {
              const m = v as "therms" | "cost" | "unknown";
              setHeatMode(m);
              setDraft((d) => ({
                ...d,
                heating:
                  m === "therms"
                    ? { ...d.heating, monthly_therms: d.heating?.monthly_therms ?? 0, monthly_cost_usd: null }
                    : m === "cost"
                    ? { ...d.heating, monthly_therms: null, monthly_cost_usd: d.heating?.monthly_cost_usd ?? 0 }
                    : { ...d.heating, monthly_therms: null, monthly_cost_usd: null },
              }));
            }}
            options={[
              { value: "therms", label: "Therms / month" },
              { value: "cost", label: "Cost / month" },
              { value: "unknown", label: "I don't know" },
            ]}
          />
          {heatMode === "therms" && (
            <NumberField
              label="Monthly therms"
              value={draft.heating?.monthly_therms ?? 0}
              onChange={(v) => setDraft((d) => ({ ...d, heating: { ...d.heating, monthly_therms: v } }))}
              min={0}
              max={100000}
            />
          )}
          {heatMode === "cost" && (
            <NumberField
              label="Monthly cost (USD)"
              value={draft.heating?.monthly_cost_usd ?? 0}
              onChange={(v) => setDraft((d) => ({ ...d, heating: { ...d.heating, monthly_cost_usd: v } }))}
              min={0}
              max={100000}
            />
          )}
          <p className="text-sm text-warm-mid">
            Assuming gas heating. Leave unknown if you use electric heat.
          </p>
        </div>
      );

    case 4:
      return (
        <BigNumberInput
          value={draft.vehicle?.annual_miles ?? 0}
          onChange={(v) => setDraft((d) => ({ ...d, vehicle: { ...d.vehicle, annual_miles: v } }))}
          min={0}
          max={200000}
          fontSize="2.5rem"
        />
      );

    case 5:
      return (
        <TextGroup
          value={draft.vehicle?.vehicle_type ?? "gasoline"}
          onChange={(v) =>
            setDraft((d) => ({ ...d, vehicle: { ...d.vehicle, vehicle_type: v as VehicleType } }))
          }
          options={[
            { value: "gasoline", label: "Gasoline" },
            { value: "hybrid", label: "Hybrid" },
            { value: "plug_in_hybrid", label: "Plug-in hybrid" },
            { value: "electric", label: "Electric" },
          ]}
        />
      );

    case 6:
      return (
        <div className="space-y-4 flex flex-col items-center">
          <BigNumberInput
            value={draft.vehicle?.mpg ?? 0}
            onChange={(v) =>
              setDraft((d) => ({
                ...d,
                vehicle: { ...d.vehicle, mpg: v === 0 ? null : v },
              }))
            }
            min={0}
            max={200}
            fontSize="3rem"
            allowZeroAsEmpty
          />
          <p className="text-sm text-warm-mid">Leave 0 to skip.</p>
        </div>
      );

    case 7:
      return (
        <div className="w-full max-w-xs mx-auto" style={{ borderTop: "1px solid #D6CFC4" }}>
          <FlightRow
            label="Short-haul (< 3 hrs)"
            value={draft.flights?.short_haul_count ?? 0}
            onChange={(v) => setDraft((d) => ({ ...d, flights: { ...d.flights, short_haul_count: v } }))}
          />
          <FlightRow
            label="Medium-haul (3–6 hrs)"
            value={draft.flights?.medium_haul_count ?? 0}
            onChange={(v) => setDraft((d) => ({ ...d, flights: { ...d.flights, medium_haul_count: v } }))}
          />
          <FlightRow
            label="Long-haul (> 6 hrs)"
            value={draft.flights?.long_haul_count ?? 0}
            onChange={(v) => setDraft((d) => ({ ...d, flights: { ...d.flights, long_haul_count: v } }))}
          />
        </div>
      );

    case 8:
      return (
        <TextGroup
          value={draft.diet ?? "low_meat"}
          onChange={(v) => setDraft((d) => ({ ...d, diet: v as DietType }))}
          options={[
            { value: "vegan", label: "Vegan" },
            { value: "vegetarian", label: "Vegetarian" },
            { value: "low_meat", label: "Low meat" },
            { value: "high_meat", label: "High meat" },
          ]}
        />
      );

    case 9:
      return (
        <TextGroup
          value={draft.consumption ?? "average"}
          onChange={(v) => setDraft((d) => ({ ...d, consumption: v as ConsumptionLevel }))}
          options={[
            { value: "minimal", label: "Minimal" },
            { value: "average", label: "Average" },
            { value: "high", label: "High" },
          ]}
        />
      );

    case 10:
      return <WasteInput draft={draft} setDraft={setDraft} />;
  }

  return null;
}

// ─── Shared input components ─────────────────────────────────────────────────

function TextGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center items-center gap-y-3">
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <Fragment key={o.value}>
            {i > 0 && (
              <span
                style={{
                  display: "inline-block",
                  width: 1,
                  height: "1.1em",
                  background: "#D6CFC4",
                  margin: "0 1.25rem",
                  verticalAlign: "middle",
                  flexShrink: 0,
                }}
              />
            )}
            <button
              type="button"
              onClick={() => onChange(o.value)}
              style={{
                position: "relative",
                background: "none",
                border: "none",
                padding: "0 0 4px 0",
                cursor: "pointer",
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontWeight: selected ? 700 : 400,
                fontSize: "1.1rem",
                color: selected ? "#2D5A1B" : "#7A6652",
                transition: "color 0.15s ease",
              }}
            >
              {o.label}
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  width: "100%",
                  height: 1.5,
                  background: "#2D5A1B",
                  display: "block",
                  transform: selected ? "scaleX(1)" : "scaleX(0)",
                  transformOrigin: "left",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}

function WasteInput({
  draft,
  setDraft,
}: {
  draft: CalculateRequest;
  setDraft: React.Dispatch<React.SetStateAction<CalculateRequest>>;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <WasteToggle
        checked={draft.waste?.recycles_regularly ?? false}
        onChange={() =>
          setDraft((d) => ({
            ...d,
            waste: { ...d.waste, recycles_regularly: !(d.waste?.recycles_regularly ?? false) },
          }))
        }
        label="I recycle regularly"
      />
      <WasteToggle
        checked={draft.waste?.composts ?? false}
        onChange={() =>
          setDraft((d) => ({
            ...d,
            waste: { ...d.waste, composts: !(d.waste?.composts ?? false) },
          }))
        }
        label="I compost food waste"
      />
    </div>
  );
}

function WasteToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        position: "relative",
        background: "none",
        border: "none",
        padding: "0 0 5px 0",
        cursor: "pointer",
        fontFamily: '"DM Sans", system-ui, sans-serif',
        fontWeight: checked ? 700 : 400,
        fontSize: "1.1rem",
        color: checked ? "#2D5A1B" : "#7A6652",
        transition: "color 0.15s ease",
        display: "block",
      }}
    >
      {label}
      <span
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: 1.5,
          background: "#2D5A1B",
          display: "block",
          transform: checked ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
          transition: "transform 0.2s ease",
        }}
      />
    </button>
  );
}

function BigNumberInput({
  value,
  onChange,
  min: _min,
  max: _max,
  fontSize = "3rem",
  allowZeroAsEmpty = false,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  fontSize?: string;
  allowZeroAsEmpty?: boolean;
}) {
  const [local, setLocal] = useState(() =>
    allowZeroAsEmpty && value === 0 ? "" : String(value)
  );

  // Sync when the parent resets (e.g. navigating back to this step)
  useEffect(() => {
    setLocal(allowZeroAsEmpty && value === 0 ? "" : String(value));
  }, [value, allowZeroAsEmpty]);

  return (
    <div className="flex justify-center">
      <input
        type="number"
        value={local}
        placeholder={allowZeroAsEmpty ? "—" : undefined}
        onChange={(e) => {
          const raw = e.target.value;
          setLocal(raw);
          const n = raw === "" ? 0 : Number(raw);
          if (!isNaN(n)) onChange(n);
        }}
        className="text-center text-warm-dark font-extrabold focus:outline-none w-44 placeholder:text-warm-border"
        style={{
          fontSize,
          border: "none",
          borderBottom: "1px solid #D6CFC4",
          background: "transparent",
          borderRadius: 0,
          padding: "0.5rem 0",
          transition: "border-color 0.2s ease",
        }}
        onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#2D5A1B")}
        onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#D6CFC4")}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min: _min,
  max: _max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  const [local, setLocal] = useState(() => String(value));

  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  return (
    <div
      className="flex items-center gap-4 w-full max-w-xs"
      style={{ borderBottom: "1px solid #D6CFC4", paddingBottom: "0.5rem" }}
    >
      <span className="text-sm text-warm-mid font-medium flex-1">{label}</span>
      <input
        type="number"
        value={local}
        onChange={(e) => {
          const raw = e.target.value;
          setLocal(raw);
          const n = Number(raw);
          if (!isNaN(n)) onChange(n);
        }}
        className="w-28 text-warm-dark font-bold text-right focus:outline-none"
        style={{ border: "none", background: "transparent" }}
      />
    </div>
  );
}

function FlightRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="flex items-center justify-between py-4"
      style={{ borderBottom: "1px solid #D6CFC4" }}
    >
      <span className="text-sm text-warm-mid">{label}</span>
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="btn-underline text-warm-mid"
          style={{ fontSize: "1.25rem", lineHeight: 1 }}
        >
          −
        </button>
        <span className="w-6 text-center text-warm-dark font-extrabold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(200, value + 1))}
          className="btn-underline"
          style={{ color: "#2D5A1B", fontSize: "1.25rem", lineHeight: 1 }}
        >
          +
        </button>
      </div>
    </div>
  );
}
