import type { CalculateRequest, DietType, ConsumptionLevel } from "../api/greenr";

export type DrivingLevel = "none" | "occasional" | "regular";

export function drivingLevelToMiles(level: DrivingLevel): number {
  if (level === "none") return 0;
  if (level === "occasional") return 5000;
  return 12000;
}

export function flightsBucketToCounts(bucket: "0" | "1-2" | "3-5" | "6+"): { short: number; medium: number; long: number } {
  // MVP: treat all as short-haul for simplicity in quick mode
  if (bucket === "0") return { short: 0, medium: 0, long: 0 };
  if (bucket === "1-2") return { short: 1, medium: 0, long: 0 };
  if (bucket === "3-5") return { short: 3, medium: 0, long: 0 };
  return { short: 6, medium: 0, long: 0 };
}

export function ensureQuickShape(draft: CalculateRequest): CalculateRequest {
  return {
    mode: "quick",
    household_size: draft.household_size,
    electricity: {
      renewable_fraction: draft.electricity?.renewable_fraction ?? 0,
      monthly_kwh: draft.electricity?.monthly_kwh ?? null,
      monthly_cost_usd: draft.electricity?.monthly_cost_usd ?? null,
    },
    heating: {
      monthly_therms: draft.heating?.monthly_therms ?? null,
      monthly_cost_usd: draft.heating?.monthly_cost_usd ?? null,
    },
    vehicle: {
      annual_miles: draft.vehicle?.annual_miles ?? 0,
      vehicle_type: draft.vehicle?.vehicle_type ?? "gasoline",
      mpg: draft.vehicle?.mpg ?? null,
    },
    flights: {
      short_haul_count: draft.flights?.short_haul_count ?? 0,
      medium_haul_count: draft.flights?.medium_haul_count ?? 0,
      long_haul_count: draft.flights?.long_haul_count ?? 0,
    },
    diet: (draft.diet ?? "low_meat") as DietType,
    consumption: (draft.consumption ?? "average") as ConsumptionLevel,
    waste: {
      recycles_regularly: draft.waste?.recycles_regularly ?? false,
      composts: draft.waste?.composts ?? false,
    },
  };
}
