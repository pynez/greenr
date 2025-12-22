from __future__ import annotations

from .factors import Factors, CALCULATION_VERSION
from .models import (
    CalculateRequest,
    DietType,
    ConsumptionLevel,
    VehicleType,
)

F = Factors()

def _annualize_monthly(value: float) -> float:
    return value * 12.0

def _diet_kg_per_year(diet: DietType) -> float:
    return {
        DietType.vegan: F.DIET_VEGAN_KG_PER_YEAR,
        DietType.vegetarian: F.DIET_VEGETARIAN_KG_PER_YEAR,
        DietType.low_meat: F.DIET_LOW_MEAT_KG_PER_YEAR,
        DietType.high_meat: F.DIET_HIGH_MEAT_KG_PER_YEAR,
    }[diet]

def _consumption_multiplier(level: ConsumptionLevel) -> float:
    return {
        ConsumptionLevel.minimal: 0.6,
        ConsumptionLevel.average: 1.0,
        ConsumptionLevel.high: 1.4,
    }[level]

def _vehicle_type_multiplier(vt: VehicleType) -> float:
    return {
        VehicleType.gasoline: 1.0,
        VehicleType.hybrid: 0.7,
        VehicleType.plug_in_hybrid: 0.4,
        VehicleType.electric: 0.15,
    }[vt]

def _flight_miles_from_counts(short_count: int, medium_count: int, long_count: int) -> tuple[float, float, float]:
    # MVP assumption: typical round-trip distances in miles
    short_miles = short_count * 500.0
    medium_miles = medium_count * 2000.0
    long_miles = long_count * 5000.0
    return short_miles, medium_miles, long_miles

def calculate_annual_kg(req: CalculateRequest) -> dict[str, float]:
    hh = float(req.household_size)

    # Electricity
    monthly_kwh = req.electricity.monthly_kwh
    if monthly_kwh is None and req.electricity.monthly_cost_usd is not None:
        monthly_kwh = req.electricity.monthly_cost_usd / F.AVG_ELECTRICITY_PRICE_USD_PER_KWH

    electricity_annual_kwh = _annualize_monthly(monthly_kwh) if monthly_kwh is not None else 0.0
    electricity_kg = electricity_annual_kwh * F.ELECTRICITY_KG_CO2E_PER_KWH
    electricity_kg *= (1.0 - req.electricity.renewable_fraction)
    electricity_kg = electricity_kg / hh

    # Heating (natural gas only for MVP)
    monthly_therms = req.heating.monthly_therms
    if monthly_therms is None and req.heating.monthly_cost_usd is not None:
        monthly_therms = req.heating.monthly_cost_usd / F.AVG_NAT_GAS_PRICE_USD_PER_THERM

    heating_annual_therms = _annualize_monthly(monthly_therms) if monthly_therms is not None else 0.0
    heating_kg = (heating_annual_therms * F.NAT_GAS_KG_CO2E_PER_THERM) / hh

    # Vehicle
    if req.vehicle.annual_miles <= 0:
        vehicle_kg = 0.0
    else:
        if req.vehicle.mpg is not None:
            gallons = req.vehicle.annual_miles / req.vehicle.mpg
            base_kg = gallons * F.GASOLINE_KG_CO2E_PER_GALLON
        else:
            base_kg = req.vehicle.annual_miles * F.AVG_GAS_VEHICLE_KG_CO2E_PER_MILE

        vehicle_kg = base_kg * _vehicle_type_multiplier(req.vehicle.vehicle_type)

    # Flights
    sm, mm, lm = _flight_miles_from_counts(
        req.flights.short_haul_count,
        req.flights.medium_haul_count,
        req.flights.long_haul_count,
    )
    flights_kg = (
        sm * F.FLIGHT_SHORT_KG_PER_MILE
        + mm * F.FLIGHT_MEDIUM_KG_PER_MILE
        + lm * F.FLIGHT_LONG_KG_PER_MILE
    )

    # Diet (per person already)
    diet_kg = _diet_kg_per_year(req.diet)

    # Consumption baseline + modifiers
    consumption_kg = F.CONSUMPTION_BASELINE_KG_PER_YEAR * _consumption_multiplier(req.consumption)

    # Waste modifiers (cap at 8%)
    reduction = 0.0
    if req.waste.recycles_regularly:
        reduction += 0.05
    if req.waste.composts:
        reduction += 0.03
    reduction = min(reduction, 0.08)
    consumption_kg *= (1.0 - reduction)

    total_kg = electricity_kg + heating_kg + vehicle_kg + flights_kg + diet_kg + consumption_kg

    return {
        "electricity_kg": round(electricity_kg, 2),
        "heating_kg": round(heating_kg, 2),
        "vehicle_kg": round(vehicle_kg, 2),
        "flights_kg": round(flights_kg, 2),
        "diet_kg": round(diet_kg, 2),
        "consumption_kg": round(consumption_kg, 2),
        "total_kg": round(total_kg, 2),
        "total_metric_tons": round(total_kg / 1000.0, 3),
        "calculation_version": CALCULATION_VERSION,
    }
