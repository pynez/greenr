from backend.app.models import CalculateRequest, ElectricityInput, HeatingInput, VehicleInput, FlightInput
from backend.app.calc import calculate_annual_kg

def test_calculate_basic_smoke():
    req = CalculateRequest(
        household_size=1,
        electricity=ElectricityInput(monthly_kwh=900, renewable_fraction=0.25),
        heating=HeatingInput(monthly_therms=30),
        vehicle=VehicleInput(annual_miles=8000, mpg=30),
        flights=FlightInput(short_haul_count=1, medium_haul_count=0, long_haul_count=0),
    )
    out = calculate_annual_kg(req)
    assert out["total_kg"] > 0
    assert out["total_metric_tons"] > 0
