export type Mode = "quick" | "full";

export type DietType = "vegan" | "vegetarian" | "low_meat" | "high_meat";
export type ConsumptionLevel = "minimal" | "average" | "high";
export type VehicleType = "gasoline" | "hybrid" | "plug_in_hybrid" | "electric";

export type ElectricityInput = {
  monthly_kwh?: number | null;
  monthly_cost_usd?: number | null;
  renewable_fraction?: number;
};

export type HeatingInput = {
  monthly_therms?: number | null;
  monthly_cost_usd?: number | null;
};

export type VehicleInput = {
  annual_miles?: number;
  vehicle_type?: VehicleType;
  mpg?: number | null;
};

export type FlightInput = {
  short_haul_count?: number;
  medium_haul_count?: number;
  long_haul_count?: number;
};

export type WasteHabits = {
  recycles_regularly?: boolean;
  composts?: boolean;
};

export type CalculateRequest = {
  mode?: Mode;
  household_size?: number;

  electricity?: ElectricityInput;
  heating?: HeatingInput;

  vehicle?: VehicleInput;
  flights?: FlightInput;

  diet?: DietType;
  consumption?: ConsumptionLevel;
  waste?: WasteHabits;
};

export type Warning = {
  code: string;
  message: string;
  field?: string | null;
};

export type Breakdown = {
  electricity_kg: number;
  heating_kg: number;
  vehicle_kg: number;
  flights_kg: number;
  diet_kg: number;
  consumption_kg: number;
  total_kg: number;
  total_metric_tons: number;
};

export type CalculateResponse = {
  calculation_version: string;
  breakdown: Breakdown;
  warnings: Warning[];
};

function assertOk(res: Response, bodyText: string): void {
  if (!res.ok) throw new Error(`Greenr API error (${res.status}): ${bodyText}`);
}

export async function calculateFootprint(baseUrl: string, payload: CalculateRequest) {
  const res = await fetch(`${baseUrl}/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  assertOk(res, text);
  return JSON.parse(text) as CalculateResponse;
}
