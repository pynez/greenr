# Greenr Methodology (MVP)

Version: 1.0

Greenr estimates an individual's annual greenhouse gas footprint in kg CO2e per year, then converts to metric tons CO2e per year.

This is an estimate intended for education and planning, not an audit.

## Categories

- Home electricity
- Home heating (natural gas only in MVP)
- Personal vehicle travel
- Flights
- Diet
- Consumption and waste

When household-level inputs are provided (electricity, heating), Greenr divides those emissions by household size to estimate per-person impact.

## Home Electricity

If the user provides monthly kWh:

annual_kWh = monthly_kWh × 12  
electricity_kg = annual_kWh × EF_electricity × (1 − renewable_fraction)  
per_person_electricity_kg = electricity_kg ÷ household_size

If the user provides monthly cost instead, Greenr converts cost to kWh using an average residential electricity price:

monthly_kWh = monthly_cost_usd ÷ avg_price_usd_per_kWh

Emission factor used:

- EF_electricity = 0.386 kg CO2e per kWh (US average grid)

## Home Heating (Natural Gas)

If the user provides monthly therms:

annual_therms = monthly_therms × 12  
heating_kg = annual_therms × EF_nat_gas  
per_person_heating_kg = heating_kg ÷ household_size

If the user provides monthly cost instead, Greenr converts cost to therms using an average residential natural gas price:

monthly_therms = monthly_cost_usd ÷ avg_price_usd_per_therm

Emission factor used:

- EF_nat_gas = 5.3 kg CO2e per therm

## Personal Vehicle

If the user provides annual miles and MPG:

vehicle_kg = (annual_miles ÷ mpg) × EF_gasoline_per_gallon

Otherwise, Greenr uses an average per-mile factor:

vehicle_kg = annual_miles × EF_vehicle_per_mile

Emission factors:

- EF_gasoline_per_gallon = 8.89 kg CO2 per gallon gasoline
- EF_vehicle_per_mile = 0.404 kg CO2e per mile (average passenger vehicle)

Vehicle type multipliers:

- gasoline: 1.0
- hybrid: 0.7
- plug-in hybrid: 0.4
- electric: 0.15

These multipliers approximate lifecycle differences and upstream electricity impacts for EVs at a national average level.

## Flights

Greenr estimates passenger-mile emissions by flight class (short, medium, long).

In MVP, flight counts are mapped to typical round-trip distances:

- short haul: 500 miles per flight
- medium haul: 2000 miles per flight
- long haul: 5000 miles per flight

Emissions:

flight_kg =
(short_miles × EF_short) +
(medium_miles × EF_medium) +
(long_miles × EF_long)

Factors:

- EF_short = 0.25 kg CO2e per passenger mile
- EF_medium = 0.18 kg CO2e per passenger mile
- EF_long = 0.15 kg CO2e per passenger mile

## Diet

Diet is modeled using annual per-person estimates:

- vegan: 1500 kg CO2e per year
- vegetarian: 1700 kg CO2e per year
- low meat omnivore: 2500 kg CO2e per year
- high meat omnivore: 3300 kg CO2e per year

## Consumption and Waste

Consumption is modeled as a baseline annual footprint with a multiplier:

baseline = 2000 kg CO2e per year

Multipliers:

- minimal: 0.6
- average: 1.0
- high: 1.4

Waste behavior adjusts consumption emissions with small capped reductions:

- recycling: 5% reduction
- composting: 3% reduction
- maximum total reduction: 8%

## Total

total_kg =
per_person_electricity_kg +
per_person_heating_kg +
vehicle_kg +
flight_kg +
diet_kg +
consumption_kg

total_metric_tons = total_kg ÷ 1000
