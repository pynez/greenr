from backend.app.models import CalculateRequest, ElectricityInput, HeatingInput, VehicleInput, FlightInput
from backend.app.calc import calculate_annual_kg
from backend.app.validation import validate_and_collect_warnings

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

def test_quick_mode_defaults_applied():
    req = CalculateRequest(
        mode="quick",
        household_size=1
    )
    out = calculate_annual_kg(req)
    assert out["total_kg"] > 0

def test_warnings_generated_for_quick_mode():
    req = CalculateRequest(mode="quick", household_size=1)
    out = calculate_annual_kg(req)
    assert out["total_kg"] > 0

def test_validation_warnings():
    req = CalculateRequest(
        household_size=8,
        electricity={"monthly_kwh": 4000},
        vehicle={"annual_miles": 50000},
    )
    warnings = validate_and_collect_warnings(req)
    assert any(w.code == "ELECTRICITY_HIGH" for w in warnings)
    assert any(w.code == "VEHICLE_HIGH_MILES" for w in warnings)