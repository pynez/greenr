type Breakdown = {
  electricity_kg: number;
  heating_kg: number;
  vehicle_kg: number;
  flights_kg: number;
  diet_kg: number;
  consumption_kg: number;
  total_kg: number;
};

type Snapshot = {
  label: string;
  request: any;
  response: { breakdown: Breakdown };
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function fmtInt(n: number) {
  return Math.round(n).toLocaleString();
}
function sign(n: number) {
  return n > 0 ? "+" : "";
}

export default function ImpactEquivalentsCard({
  baseline,
  scenario,
}: {
  baseline: Snapshot;
  scenario: Snapshot;
}) {
  const b = baseline.response.breakdown;
  const s = scenario.response.breakdown;

  const deltaKg = s.total_kg - b.total_kg;
  const absKg = Math.abs(deltaKg);

  if (!Number.isFinite(deltaKg) || absKg < 1) return null;

  const bMiles = Number(baseline.request?.vehicle?.annual_miles ?? 0);
  const vehicleKgPerMile = bMiles > 0 && b.vehicle_kg > 0 ? b.vehicle_kg / bMiles : null;
  const milesEq = vehicleKgPerMile && vehicleKgPerMile > 0 ? absKg / vehicleKgPerMile : null;

  const bShort = Number(baseline.request?.flights?.short_haul_count ?? 0);
  const flightKgPerShort = bShort > 0 && b.flights_kg > 0 ? b.flights_kg / bShort : null;
  const flightsEq = flightKgPerShort && flightKgPerShort > 0 ? absKg / flightKgPerShort : null;

  const elecPerMonth = b.electricity_kg > 0 ? b.electricity_kg / 12 : null;
  const monthsElecEq = elecPerMonth && elecPerMonth > 0 ? absKg / elecPerMonth : null;

  const direction = deltaKg < 0 ? "reduction" : "increase";

  const items: { title: string; body: string }[] = [];

  if (milesEq && Number.isFinite(milesEq))
    items.push({ title: "Driving equivalent", body: `≈ ${fmtInt(milesEq)} miles driven (based on your baseline vehicle intensity)` });
  if (flightsEq && Number.isFinite(flightsEq))
    items.push({ title: "Flight equivalent", body: `≈ ${round1(flightsEq)} short-haul flights (based on your baseline flight intensity)` });
  if (monthsElecEq && Number.isFinite(monthsElecEq))
    items.push({ title: "Home electricity equivalent", body: `≈ ${round1(monthsElecEq)} months of your baseline home electricity` });

  if (items.length === 0) {
    const biggest = [
      { name: "Vehicle", kg: s.vehicle_kg - b.vehicle_kg },
      { name: "Flights", kg: s.flights_kg - b.flights_kg },
      { name: "Electricity", kg: s.electricity_kg - b.electricity_kg },
    ].sort((a, b) => Math.abs(b.kg) - Math.abs(a.kg))[0];

    items.push({
      title: "What it's most like",
      body: `Most of this change comes from ${biggest.name} (Δ ${Math.round(biggest.kg).toLocaleString()} kg). Add more baseline inputs to unlock personalized equivalents.`,
    });
  }

  return (
    <div>
      <div className="font-bold text-warm-dark text-sm">Impact equivalents</div>
      <div className="mt-1 text-xs text-warm-mid">
        Translating your total change into intuitive comparisons.
      </div>

      {/* Total change row */}
      <div
        className="mt-5 pb-5"
        style={{ borderBottom: "1px solid #D6CFC4" }}
      >
        <div className="text-xs text-warm-mid mb-2">Total change</div>
        <div className="flex items-baseline gap-2">
          <span
            className="font-extrabold text-2xl"
            style={{ color: deltaKg > 0 ? "#C4622D" : "#2D5A1B" }}
          >
            {sign(deltaKg)}
            {Math.round(deltaKg).toLocaleString()} kg CO2e/year
          </span>
          <span className="text-warm-mid text-sm">({direction})</span>
        </div>
      </div>

      {/* Equivalents */}
      <div style={{ borderBottom: "1px solid #D6CFC4" }}>
        {items.slice(0, 3).map((x, i) => (
          <div
            key={x.title}
            className="py-5"
            style={{ borderTop: i > 0 ? "1px solid #D6CFC4" : undefined }}
          >
            <div className="text-sm font-bold text-warm-dark">{x.title}</div>
            <div className="mt-1 text-sm text-warm-mid leading-relaxed">{x.body}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-warm-mid">
        Equivalents are approximate and based on your baseline data when available.
      </div>
    </div>
  );
}
