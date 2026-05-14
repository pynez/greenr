type Breakdown = {
  electricity_kg: number;
  heating_kg: number;
  vehicle_kg: number;
  flights_kg: number;
  diet_kg: number;
  consumption_kg: number;
  total_kg: number;
};

type Suggestion = { title: string; body: string };

function topCategories(b: Breakdown) {
  return [
    { key: "vehicle", name: "Vehicle", kg: b.vehicle_kg },
    { key: "electricity", name: "Electricity", kg: b.electricity_kg },
    { key: "heating", name: "Heating", kg: b.heating_kg },
    { key: "diet", name: "Diet", kg: b.diet_kg },
    { key: "consumption", name: "Consumption", kg: b.consumption_kg },
    { key: "flights", name: "Flights", kg: b.flights_kg },
  ]
    .filter((c) => c.kg > 0)
    .sort((a, b) => b.kg - a.kg);
}

function pct(kg: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((kg / total) * 100);
}

function suggestionsFor(key: string, kg: number): Suggestion[] {
  switch (key) {
    case "vehicle":
      return [
        { title: "Drive fewer miles", body: "Combine trips, carpool occasionally, or replace 1–2 short drives per week with walking, biking, or transit." },
        { title: "Improve efficiency", body: "Keep tires inflated, avoid aggressive acceleration, and remove unnecessary weight. If you're shopping soon, prioritize high-MPG or hybrid options." },
        ...(kg > 3500 ? [{ title: "Consider a mileage audit", body: "Your vehicle impact is high. Roughly confirm annual miles (odometer change over a month × 12 works well)." }] : []),
      ];
    case "electricity":
      return [
        { title: "Cut standby and lighting waste", body: "Use smart power strips, turn off high-idle devices, and switch remaining bulbs to LEDs." },
        { title: "Reduce big loads", body: "Lower AC/heat a bit, run full laundry/dishwasher loads, and air-dry when convenient." },
        ...(kg > 2500 ? [{ title: "Check your bill for kWh spikes", body: "If you have access to a utility portal, look for seasonal peaks (AC/space heaters are common causes)." }] : []),
      ];
    case "heating":
      return [
        { title: "Seal and insulate", body: "Weatherstrip doors/windows and seal drafts. Small fixes can reduce heating needs noticeably." },
        { title: "Thermostat strategy", body: "Lower the thermostat a couple degrees and use a schedule. Even small changes add up over a winter." },
        ...(kg > 2000 ? [{ title: "Focus on hot water", body: "Shorter showers, lower water heater temp (safely), and washing clothes cold can reduce gas use." }] : []),
      ];
    case "diet":
      return [
        { title: "Swap the highest-impact meals", body: "Replacing even 1–2 beef meals per week with chicken, fish, or plant-based options can make a meaningful difference." },
        { title: "Reduce food waste", body: "Plan leftovers and freeze extras. Food waste is emissions you paid for twice." },
        ...(kg > 3000 ? [{ title: 'Try a weekly "plant-forward" goal', body: "A simple target like 2 plant-based dinners per week is easy to stick to and moves the needle." }] : []),
      ];
    case "consumption":
      return [
        { title: "Buy less new, keep longer", body: "Delay upgrades, repair when possible, and prefer used/refurbished for electronics and clothing." },
        { title: "Prioritize durable staples", body: "Fewer high-quality items often beats frequent low-cost replacements." },
        ...(kg > 2200 ? [{ title: "Do a 30-day pause on non-essentials", body: "A short reset often lowers spending without feeling restrictive long-term." }] : []),
      ];
    case "flights":
      return [
        { title: "Reduce one flight", body: "If you can replace one short flight with driving or rail, or skip a discretionary trip, it often has an outsized impact." },
        { title: "Bundle travel", body: "Fewer, longer trips instead of many short trips can reduce takeoff-heavy emissions." },
        ...(kg > 800 ? [{ title: "Choose economy and nonstop when possible", body: "Per-passenger impact is typically lower with higher seat occupancy and fewer legs." }] : []),
      ];
    default:
      return [];
  }
}

export default function SuggestionsCard({ breakdown }: { breakdown: Breakdown }) {
  const cats = topCategories(breakdown);
  if (cats.length === 0) return null;
  const top = cats.slice(0, 3);

  return (
    <div>
      <div className="font-bold text-warm-dark">where to start</div>
      <div className="mt-1 text-sm text-warm-mid">
        Based on your highest categories. General suggestions — good starting points.
      </div>

      <div className="mt-8">
        {top.map((c, i) => {
          const share = pct(c.kg, breakdown.total_kg);
          const items = suggestionsFor(c.key, c.kg).slice(0, 3);
          return (
            <div
              key={c.key}
              style={{
                borderTop: i === 0 ? "1px solid #D6CFC4" : undefined,
                borderBottom: "1px solid #D6CFC4",
                paddingTop: "2rem",
                paddingBottom: "2rem",
              }}
            >
              <div className="flex items-baseline justify-between gap-4 mb-5">
                <span className="font-bold text-warm-dark">{c.name}</span>
                <span className="text-sm text-warm-mid">
                  {Math.round(c.kg).toLocaleString()} kg · {share}%
                </span>
              </div>
              <div className="space-y-4">
                {items.map((s) => (
                  <p key={s.title} className="text-sm text-warm-mid leading-relaxed">
                    <span className="font-medium text-warm-dark">{s.title}:</span> {s.body}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
