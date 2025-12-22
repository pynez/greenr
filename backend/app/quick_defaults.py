from .models import CalculateRequest
from .models import ElectricityInput, HeatingInput, VehicleInput, FlightInput
from .models import DietType, ConsumptionLevel, VehicleType

def apply_quick_mode_defaults(req: CalculateRequest) -> CalculateRequest:
    """
    Mutates missing fields in-place using Quick Mode defaults.
    User-provided values always win.
    """

    # Electricity
    if req.electricity.monthly_kwh is None and req.electricity.monthly_cost_usd is None:
        req.electricity = ElectricityInput(
            monthly_kwh=900,
            renewable_fraction=req.electricity.renewable_fraction,
        )

    # Heating (natural gas only for MVP)
    if req.heating.monthly_therms is None and req.heating.monthly_cost_usd is None:
        req.heating = HeatingInput(
            monthly_therms=30
        )

    # Vehicle
    if req.vehicle.annual_miles == 0:
        req.vehicle = VehicleInput(
            annual_miles=12000,
            vehicle_type=req.vehicle.vehicle_type or VehicleType.gasoline,
            mpg=req.vehicle.mpg,
        )

    # Flights
    if (
        req.flights.short_haul_count == 0
        and req.flights.medium_haul_count == 0
        and req.flights.long_haul_count == 0
    ):
        req.flights = FlightInput(
            short_haul_count=1,
            medium_haul_count=0,
            long_haul_count=0,
        )

    # Diet
    if req.diet is None:
        req.diet = DietType.low_meat

    # Consumption
    if req.consumption is None:
        req.consumption = ConsumptionLevel.average

    return req
