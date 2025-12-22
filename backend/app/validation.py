from typing import List
from .models import CalculateRequest, Warning

def validate_and_collect_warnings(req: CalculateRequest) -> List[Warning]:
    warnings: List[Warning] = []

    # Electricity
    if req.electricity.monthly_kwh is None and req.electricity.monthly_cost_usd is None:
        warnings.append(
            Warning(
                code="ELECTRICITY_DEFAULT",
                field="electricity",
                message="Electricity usage not provided. A national average was used."
            )
        )

    if req.electricity.monthly_kwh is not None and req.electricity.monthly_kwh > 3000:
        warnings.append(
            Warning(
                code="ELECTRICITY_HIGH",
                field="electricity.monthly_kwh",
                message="Electricity usage is much higher than typical households."
            )
        )

    # Heating
    if req.heating.monthly_therms is None and req.heating.monthly_cost_usd is None:
        warnings.append(
            Warning(
                code="HEATING_DEFAULT",
                field="heating",
                message="Heating usage not provided. A national average was used."
            )
        )

    # Vehicle
    if req.vehicle.annual_miles <= 0:
        warnings.append(
            Warning(
                code="VEHICLE_DEFAULT",
                field="vehicle.annual_miles",
                message="Vehicle mileage not provided. An average value was assumed."
            )
        )

    if req.vehicle.annual_miles > 40000:
        warnings.append(
            Warning(
                code="VEHICLE_HIGH_MILES",
                field="vehicle.annual_miles",
                message="Vehicle mileage is unusually high. Consider double-checking."
            )
        )

    # Flights
    if (
        req.flights.short_haul_count == 0
        and req.flights.medium_haul_count == 0
        and req.flights.long_haul_count == 0
    ):
        warnings.append(
            Warning(
                code="FLIGHTS_DEFAULT",
                field="flights",
                message="No flights provided. A minimal average was assumed."
            )
        )

    # Household size
    if req.household_size > 6:
        warnings.append(
            Warning(
                code="HOUSEHOLD_LARGE",
                field="household_size",
                message="Large household size can reduce per-person emissions significantly."
            )
        )

    # Renewables
    if req.electricity.renewable_fraction == 1.0:
        warnings.append(
            Warning(
                code="RENEWABLE_FULL",
                field="electricity.renewable_fraction",
                message="100% renewable electricity selected. Results assume zero grid emissions."
            )
        )

    return warnings
