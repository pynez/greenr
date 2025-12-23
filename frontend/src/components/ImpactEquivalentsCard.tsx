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

function signPrefix(n: number) {
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

  if (!Number.isFinite(deltaKg) || absKg < 1) {
    return null;
  }

  // 1) Miles equivalent based on baseline vehicle intensity if miles are known.
  // We prefer personalized intensity over a generic constant.
  const bMiles = Number(baseline.request?.vehicle?.annual_miles ?? 0);
  const vehicleKgPerMile =
    bMiles > 0 && b.vehicle_kg > 0 ? b.vehicle_kg / bMiles : null;

  const milesEq =
    vehicleKgPerMile && vehicleKgPerMile > 0 ? absKg / vehicleKgPerMile : null;

  // 2) Flights equivalent based on baseline short-haul intensity if flights exist, else use scenario/baseline flight kg delta fallback.
  const bShort = Number(baseline.request?.flights?.short_haul_count ?? 0);
  const flightKgPerShort =
    bShort > 0 && b.flights_kg > 0 ? b.flights_kg / bShort : null;

  const shortFlightsEq =
    flightKgPerShort && flightKgPerShort > 0 ? absKg / flightKgPerShort : null;

  // 3) Electricity months equivalent based on baseline monthly electricity emissions (uses your own model output).
  const elecPerMonth = b.electricity_kg > 0 ? b.electricity_kg / 12 : null;
  const monthsElecEq =
    elecPerMonth && elecPerMonth > 0 ? absKg / elecPerMonth : null;

  const direction = deltaKg < 0 ? "reduction" : "increase";

  const items: { title: string; body: string }[] = [];

  if (milesEq && Number.isFinite(milesEq)) {
    items.push({
      title: "Driving equivalent",
      body: `≈ ${fmtInt(milesEq)} miles driven (based on your baseline vehicle intensity)`,
    });
  }

  if (shortFlightsEq && Number.isFinite(shortFlightsEq)) {
    items.push({
      title: "Flight equivalent",
      body: `≈ ${round1(shortFlightsEq)} short-haul flights (based on your baseline flight intensity)`,
    });
  }

  if (monthsElecEq && Number.isFinite(monthsElecEq)) {
    items.push({
      title: "Home electricity equivalent",
      body: `≈ ${round1(monthsElecEq)} months of your baseline home electricity`,
    });
  }

  // If we couldn't compute any personalized equivalents, fall back to category-based explanation
  if (items.length === 0) {
    const vDelta = s.vehicle_kg - b.vehicle_kg;
    const fDelta = s.flights_kg - b.flights_kg;
    const eDelta = s.electricity_kg - b.electricity_kg;

    const biggest = [
      { name: "Vehicle", kg: vDelta },
      { name: "Flights", kg: fDelta },
      { name: "Electricity", kg: eDelta },
    ].sort((a, b) => Math.abs(b.kg) - Math.abs(a.kg))[0];

    items.push({
      title: "What it’s most like",
      body: `Most of this change comes from ${biggest.name} (Δ ${Math.round(biggest.kg).toLocaleString()} kg). Add more baseline inputs to unlock personalized equivalents.`,
    });
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <div className="text-sm font-semibold">Impact equivalents</div>
      <div className="mt-1 text-xs text-white/60">
        Translating your total change into a few intuitive comparisons.
      </div>

      <div className="mt-4 rounded-xl bg-black/30 border border-white/10 p-4">
        <div className="text-xs text-white/60">Total change</div>
        <div className="mt-1 text-lg font-semibold">
          {signPrefix(deltaKg)}
          {Math.round(deltaKg).toLocaleString()} kg CO2e/year{" "}
          <span className="text-white/60 text-sm">({direction})</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.slice(0, 3).map((x) => (
          <div key={x.title} className="rounded-xl bg-black/30 border border-white/10 p-4">
            <div className="text-sm font-semibold">{x.title}</div>
            <div className="mt-1 text-sm text-white/70">{x.body}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-white/55">
        Equivalents are approximate and based on your baseline data when available.
      </div>
    </div>
  );
}