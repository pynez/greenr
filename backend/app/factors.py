from dataclasses import dataclass

CALCULATION_VERSION = "1.0"

@dataclass(frozen=True)
class Factors:
    # Home energy
    ELECTRICITY_KG_CO2E_PER_KWH: float = 0.386  # US average grid kg CO2e/kWh
    NAT_GAS_KG_CO2E_PER_THERM: float = 5.3      # kg CO2e/therm

    # Cost conversions (fallbacks)
    AVG_ELECTRICITY_PRICE_USD_PER_KWH: float = 0.16
    AVG_NAT_GAS_PRICE_USD_PER_THERM: float = 1.20

    # Transport
    AVG_GAS_VEHICLE_KG_CO2E_PER_MILE: float = 0.404
    GASOLINE_KG_CO2E_PER_GALLON: float = 8.89

    # Flights (kg CO2e per passenger mile)
    FLIGHT_SHORT_KG_PER_MILE: float = 0.25
    FLIGHT_MEDIUM_KG_PER_MILE: float = 0.18
    FLIGHT_LONG_KG_PER_MILE: float = 0.15

    # Diet (annual kg CO2e per person)
    DIET_VEGAN_KG_PER_YEAR: float = 1500
    DIET_VEGETARIAN_KG_PER_YEAR: float = 1700
    DIET_LOW_MEAT_KG_PER_YEAR: float = 2500
    DIET_HIGH_MEAT_KG_PER_YEAR: float = 3300

    # Consumption baseline (annual kg CO2e per person)
    CONSUMPTION_BASELINE_KG_PER_YEAR: float = 2000
