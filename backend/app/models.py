from enum import Enum
from pydantic import BaseModel, Field

class Mode(str, Enum):
    quick = "quick"
    full = "full"

class DietType(str, Enum):
    vegan = "vegan"
    vegetarian = "vegetarian"
    low_meat = "low_meat"
    high_meat = "high_meat"

class ConsumptionLevel(str, Enum):
    minimal = "minimal"
    average = "average"
    high = "high"

class VehicleType(str, Enum):
    gasoline = "gasoline"
    hybrid = "hybrid"
    plug_in_hybrid = "plug_in_hybrid"
    electric = "electric"

class FlightInput(BaseModel):
    short_haul_count: int = Field(0, ge=0)
    medium_haul_count: int = Field(0, ge=0)
    long_haul_count: int = Field(0, ge=0)

class ElectricityInput(BaseModel):
    monthly_kwh: float | None = Field(None, ge=0)
    monthly_cost_usd: float | None = Field(None, ge=0)
    renewable_fraction: float = Field(0.0, ge=0.0, le=1.0)

class HeatingInput(BaseModel):
    monthly_therms: float | None = Field(None, ge=0)
    monthly_cost_usd: float | None = Field(None, ge=0)

class VehicleInput(BaseModel):
    annual_miles: float = Field(0, ge=0)
    vehicle_type: VehicleType = VehicleType.gasoline
    mpg: float | None = Field(None, gt=0)

class WasteHabits(BaseModel):
    recycles_regularly: bool = False
    composts: bool = False

class CalculateRequest(BaseModel):
    mode: Mode = Mode.quick
    household_size: int = Field(1, ge=1, le=20)

    electricity: ElectricityInput = ElectricityInput()
    heating: HeatingInput = HeatingInput()

    vehicle: VehicleInput = VehicleInput()
    flights: FlightInput = FlightInput()

    diet: DietType = DietType.low_meat
    consumption: ConsumptionLevel = ConsumptionLevel.average
    waste: WasteHabits = WasteHabits()

class Breakdown(BaseModel):
    electricity_kg: float
    heating_kg: float
    vehicle_kg: float
    flights_kg: float
    diet_kg: float
    consumption_kg: float
    total_kg: float
    total_metric_tons: float

class CalculateResponse(BaseModel):
    calculation_version: str
    breakdown: Breakdown
