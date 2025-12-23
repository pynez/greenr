import type { CalculateRequest, DietType, ConsumptionLevel, VehicleType } from "../api/greenr";

export default function FullQuestionnaire({
  draft,
  setDraft,
}: {
  draft: CalculateRequest;
  setDraft: React.Dispatch<React.SetStateAction<CalculateRequest>>;
}) {
  const hh = draft.household_size ?? 1;

  const elec = draft.electricity ?? {};
  const heat = draft.heating ?? {};
  const veh = draft.vehicle ?? {};
  const fl = draft.flights ?? {};
  const waste = draft.waste ?? {};

  const elecMode: "kwh" | "cost" | "unknown" =
    elec.monthly_kwh != null ? "kwh" : elec.monthly_cost_usd != null ? "cost" : "unknown";

  const heatMode: "therms" | "cost" | "unknown" =
    heat.monthly_therms != null ? "therms" : heat.monthly_cost_usd != null ? "cost" : "unknown";

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

  const setElecMode = (m: "kwh" | "cost" | "unknown") => {
    setDraft((d) => ({
      ...d,
      electricity:
        m === "kwh"
          ? { ...(d.electricity ?? {}), monthly_kwh: 0, monthly_cost_usd: null }
          : m === "cost"
          ? { ...(d.electricity ?? {}), monthly_kwh: null, monthly_cost_usd: 0 }
          : { ...(d.electricity ?? {}), monthly_kwh: null, monthly_cost_usd: null },
    }));
  };

  const setHeatMode = (m: "therms" | "cost" | "unknown") => {
    setDraft((d) => ({
      ...d,
      heating:
        m === "therms"
          ? { ...(d.heating ?? {}), monthly_therms: 0, monthly_cost_usd: null }
          : m === "cost"
          ? { ...(d.heating ?? {}), monthly_therms: null, monthly_cost_usd: 0 }
          : { ...(d.heating ?? {}), monthly_therms: null, monthly_cost_usd: null },
    }));
  };

  const setNum = (path: string, raw: string, min: number, max: number) => {
    const n = Number(raw);
    const val = Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;

    setDraft((d) => {
      const next: any = { ...d };
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = cur[parts[i]] ?? {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = val;
      return next;
    });
  };

  const setEnum = (key: "diet" | "consumption", value: DietType | ConsumptionLevel) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const setVehicleType = (vt: VehicleType) => {
    setDraft((d) => ({ ...d, vehicle: { ...(d.vehicle ?? {}), vehicle_type: vt } }));
  };

  const toggleWaste = (key: "recycles_regularly" | "composts") => {
    setDraft((d) => ({
      ...d,
      waste: { ...(d.waste ?? {}), [key]: !(d.waste?.[key] ?? false) },
    }));
  };

  const renewablePct = Math.round((elec.renewable_fraction ?? 0) * 100);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Section title="Household">
        <LabelRow label="Household size">
          <input
            type="number"
            min={1}
            max={20}
            value={hh}
            onChange={(e) => setHousehold(Number(e.target.value))}
            className="w-28 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
          />
        </LabelRow>
      </Section>

      <Section title="Electricity">
        <FieldLabel>How do you want to enter electricity?</FieldLabel>
        <PillRow
          value={elecMode}
          onChange={setElecMode}
          options={[
            { value: "kwh", label: "kWh/month" },
            { value: "cost", label: "Cost/month" },
            { value: "unknown", label: "I don't know" },
          ]}
        />

        {elecMode === "kwh" && (
          <div className="mt-4">
            <LabelRow label="Monthly kWh">
              <input
                type="number"
                min={0}
                value={elec.monthly_kwh ?? 0}
                onChange={(e) => setNum("electricity.monthly_kwh", e.target.value, 0, 100000)}
                className="w-40 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
              />
            </LabelRow>
          </div>
        )}

        {elecMode === "cost" && (
          <div className="mt-4">
            <LabelRow label="Monthly cost (USD)">
              <input
                type="number"
                min={0}
                value={elec.monthly_cost_usd ?? 0}
                onChange={(e) => setNum("electricity.monthly_cost_usd", e.target.value, 0, 100000)}
                className="w-40 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
              />
            </LabelRow>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
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
      </Section>

      <Section title="Heating (Natural Gas)">
        <FieldLabel>How do you want to enter heating?</FieldLabel>
        <PillRow
          value={heatMode}
          onChange={setHeatMode}
          options={[
            { value: "therms", label: "Therms/month" },
            { value: "cost", label: "Cost/month" },
            { value: "unknown", label: "I don't know" },
          ]}
        />

        {heatMode === "therms" && (
          <div className="mt-4">
            <LabelRow label="Monthly therms">
              <input
                type="number"
                min={0}
                value={heat.monthly_therms ?? 0}
                onChange={(e) => setNum("heating.monthly_therms", e.target.value, 0, 100000)}
                className="w-40 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
              />
            </LabelRow>
          </div>
        )}

        {heatMode === "cost" && (
          <div className="mt-4">
            <LabelRow label="Monthly cost (USD)">
              <input
                type="number"
                min={0}
                value={heat.monthly_cost_usd ?? 0}
                onChange={(e) => setNum("heating.monthly_cost_usd", e.target.value, 0, 100000)}
                className="w-40 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
              />
            </LabelRow>
          </div>
        )}

        <div className="mt-3 text-xs text-white/55">
          We're assuming gas heating. If you heat with electric or other fuels, you can leave this unknown for now.
        </div>
      </Section>

      <Section title="Transportation">
        <LabelRow label="Annual miles driven">
          <input
            type="number"
            min={0}
            value={veh.annual_miles ?? 0}
            onChange={(e) => setNum("vehicle.annual_miles", e.target.value, 0, 200000)}
            className="w-40 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
          />
        </LabelRow>

        <div className="mt-4">
          <LabelRow label="Vehicle type">
            <select
              value={(veh.vehicle_type ?? "gasoline") as VehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              className="w-44 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
            >
              <option value="gasoline">Gasoline</option>
              <option value="hybrid">Hybrid</option>
              <option value="plug_in_hybrid">Plug-in hybrid</option>
              <option value="electric">Electric</option>
            </select>
          </LabelRow>
        </div>

        <div className="mt-4">
          <LabelRow label="MPG (optional)">
            <input
              type="number"
              min={0}
              value={veh.mpg ?? ""}
              placeholder="optional"
              onChange={(e) => {
                const v = e.target.value;
                if (v.trim() === "") {
                  setDraft((d) => ({ ...d, vehicle: { ...(d.vehicle ?? {}), mpg: null } }));
                } else {
                  setNum("vehicle.mpg", v, 1, 200);
                }
              }}
              className="w-40 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
            />
          </LabelRow>
        </div>
      </Section>

      <Section title="Flights">
        <LabelRow label="Short-haul flights/year">
          <input
            type="number"
            min={0}
            value={fl.short_haul_count ?? 0}
            onChange={(e) => setNum("flights.short_haul_count", e.target.value, 0, 200)}
            className="w-36 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
          />
        </LabelRow>

        <div className="mt-4">
          <LabelRow label="Medium-haul flights/year">
            <input
              type="number"
              min={0}
              value={fl.medium_haul_count ?? 0}
              onChange={(e) => setNum("flights.medium_haul_count", e.target.value, 0, 200)}
              className="w-36 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
            />
          </LabelRow>
        </div>

        <div className="mt-4">
          <LabelRow label="Long-haul flights/year">
            <input
              type="number"
              min={0}
              value={fl.long_haul_count ?? 0}
              onChange={(e) => setNum("flights.long_haul_count", e.target.value, 0, 200)}
              className="w-36 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
            />
          </LabelRow>
        </div>

        <div className="mt-3 text-xs text-white/55">
          Short ≈ under 3 hours, Medium ≈ 3–6 hours, Long ≈ over 6 hours.
        </div>
      </Section>

      <Section title="Lifestyle">
        <FieldLabel>Diet</FieldLabel>
        <PillRow
          value={(draft.diet ?? "low_meat") as DietType}
          onChange={(v) => setEnum("diet", v)}
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
          onChange={(v) => setEnum("consumption", v)}
          options={[
            { value: "minimal", label: "Minimal" },
            { value: "average", label: "Average" },
            { value: "high", label: "High" },
          ]}
        />

        <FieldLabel className="mt-5">Waste habits</FieldLabel>
        <div className="mt-2 flex flex-col gap-2">
          <Checkbox
            checked={waste.recycles_regularly ?? false}
            onChange={() => toggleWaste("recycles_regularly")}
            label="I recycle regularly"
          />
          <Checkbox
            checked={waste.composts ?? false}
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
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-white" />
      {label}
    </label>
  );
}
