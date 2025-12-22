from fastapi import FastAPI
from .models import CalculateRequest, CalculateResponse, Breakdown
from .calc import calculate_annual_kg
from .factors import CALCULATION_VERSION

app = FastAPI(
    title="Greenr API",
    version=CALCULATION_VERSION,
)

@app.get("/health")
def health():
    return {"status": "ok", "version": CALCULATION_VERSION}

@app.post("/calculate", response_model=CalculateResponse)
def calculate(req: CalculateRequest):
    result = calculate_annual_kg(req)

    breakdown = Breakdown(
        electricity_kg=result["electricity_kg"],
        heating_kg=result["heating_kg"],
        vehicle_kg=result["vehicle_kg"],
        flights_kg=result["flights_kg"],
        diet_kg=result["diet_kg"],
        consumption_kg=result["consumption_kg"],
        total_kg=result["total_kg"],
        total_metric_tons=result["total_metric_tons"],
    )
    return CalculateResponse(
        calculation_version=result["calculation_version"],
        breakdown=breakdown,
    )
