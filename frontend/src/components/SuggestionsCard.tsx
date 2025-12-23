type Breakdown = {
  electricity_kg: number;
  heating_kg: number;
  vehicle_kg: number;
  flights_kg: number;
  diet_kg: number;
  consumption_kg: number;
  total_kg: number;
};

type Suggestion = {
  title: string;
  body: string;
};

function topCategories(b: Breakdown) {
  const cats = [
    { key: "vehicle", name: "Vehicle", kg: b.vehicle_kg },
    { key: "electricity", name: "Electricity", kg: b.electricity_kg },
    { key: "heating", name: "Heating", kg: b.heating_kg },
    { key: "diet", name: "Diet", kg: b.diet_kg },
    { key: "consumption", name: "Consumption", kg: b.consumption_kg },
    { key: "flights", name: "Flights", kg: b.flights_kg },
  ].filter((c) => c.kg > 0);

  return cats.sort((a, b) => b.kg - a.kg);
}

function formatKg(kg: number) {
  return `${Math.round(kg).toLocaleString()} kg`;
}

function pct(kg: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((kg / total) * 100);
}

function suggestionsFor(key: string, kg: number): Suggestion[] {
  // These are intentionally “MVP general” and not dependent on region-specific factors.
  switch (key) {
    case "vehicle": {
      const s: Suggestion[] = [
        { title: "Drive fewer miles", body: "Combine trips, carpool occasionally, or replace 1–2 short drives per week with walking, biking, or transit." },
        { title: "Improve efficiency", body: "Keep tires inflated, avoid aggressive acceleration, and remove unnecessary weight. If you’re shopping soon, prioritize high-MPG or hybrid options." },
      ];
      if (kg > 3500) {
        s.push({ title: "Consider a mileage audit", body: "Your vehicle impact is high. Roughly confirm annual miles (odometer change over a month × 12 works well)." });
      }
      return s;
    }
    case "electricity": {
      const s: Suggestion[] = [
        { title: "Cut standby and lighting waste", body: "Use smart power strips, turn off high-idle devices, and switch remaining bulbs to LEDs if you haven’t already." },
        { title: "Reduce big loads", body: "Lower AC/heat a bit, run full laundry/dishwasher loads, and air-dry when convenient." },
      ];
      if (kg > 2500) {
        s.push({ title: "Check your bill for kWh spikes", body: "If you have access to a utility portal, look for seasonal peaks (AC/space heaters are common causes)." });
      }
      return s;
    }
    case "heating": {
      const s: Suggestion[] = [
        { title: "Seal and insulate", body: "Weatherstrip doors/windows and seal drafts. Small fixes can reduce heating needs noticeably." },
        { title: "Thermostat strategy", body: "Lower the thermostat a couple degrees and use a schedule. Even small changes add up over a winter." },
      ];
      if (kg > 2000) {
        s.push({ title: "Focus on hot water", body: "Shorter showers, lower water heater temp (safely), and washing clothes cold can reduce gas use." });
      }
      return s;
    }
    case "diet": {
      const s: Suggestion[] = [
        { title: "Swap the highest-impact meals", body: "If you eat beef often, replacing even 1–2 beef meals per week with chicken, fish, or plant-based meals can make meaningfully lower impact." },
        { title: "Reduce food waste", body: "Plan leftovers and freeze extras. Food waste is emissions you paid for twice (production and disposal)." },
      ];
      if (kg > 3000) {
        s.push({ title: "Try a weekly “plant-forward” goal", body: "A simple target like 2 plant-based dinners per week is easy to stick to and moves the needle." });
      }
      return s;
    }
    case "consumption": {
      const s: Suggestion[] = [
        { title: "Buy less new, keep longer", body: "Delay upgrades, repair when possible, and prefer used/refurbished for electronics and clothing." },
        { title: "Prioritize durable staples", body: "Fewer high-quality items often beats frequent low-cost replacements." },
      ];
      if (kg > 2200) {
        s.push({ title: "Do a 30-day “pause” on non-essentials", body: "A short reset often lowers spending without feeling restrictive long-term." });
      }
      return s;
    }
    case "flights": {
      const s: Suggestion[] = [
        { title: "Reduce one flight", body: "If you can replace one short flight with driving or rail, or skip a discretionary trip, it often has an outsized impact." },
        { title: "Bundle travel", body: "Fewer, longer trips instead of many short trips can reduce takeoff-heavy emissions." },
      ];
      if (kg > 800) {
        s.push({ title: "Choose economy and nonstop when possible", body: "Per-passenger impact is typically lower with higher seat occupancy and fewer legs." });
      }
      return s;
    }
    default:
      return [];
  }
}

export default function SuggestionsCard({ breakdown }: { breakdown: Breakdown }) {
  const cats = topCategories(breakdown);
  if (cats.length === 0) return null;

  const top = cats.slice(0, 3);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <div className="text-sm font-semibold">Biggest levers</div>
      <div className="mt-1 text-xs text-white/60">
        Suggestions are based on your highest categories. They’re general and meant as starting points.
      </div>

      <div className="mt-4 space-y-4">
        {top.map((c) => {
          const share = pct(c.kg, breakdown.total_kg);
          const items = suggestionsFor(c.key, c.kg).slice(0, 3);

          return (
            <div key={c.key} className="rounded-xl bg-black/30 border border-white/10 p-4">
              <div className="flex items-baseline justify-between gap-4">
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-xs text-white/60">
                  {formatKg(c.kg)} • {share}%
                </div>
              </div>

              <ul className="mt-3 space-y-2 text-sm text-white/70 list-disc pl-5">
                {items.map((s) => (
                  <li key={s.title}>
                    <span className="text-white/90">{s.title}:</span> {s.body}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}