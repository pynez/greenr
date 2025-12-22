# Greenr Frontend Contract (MVP)

This document defines the stable contract between Greenr frontend clients (web/iOS) and the Greenr backend API.

## Base URL

Local development:
- http://127.0.0.1:8000

## Endpoints

- GET /health
- POST /calculate

---

## GET /health

### Response 200

```json
{
  "status": "ok",
  "version": "1.0"
}

## POST /calculate

### Summary
Compute an annual greenhouse gas footprint estimate.

### Request headers
- Content-Type: application/json

### Request body
The backend accepts partial payloads. Any missing nested objects are filled with defaults.

### Types
Mode:
- "quick" | "full"
DietType:
- "vegan" | "vegetarian" | "low_meat" | "high_meat"
ConsumptionLevel:
- "minimal" | "average" | "high"
VehicleType:
- "gasoline" | "hybrid" | "plug_in_hybrid" | "electric"

JSON schema (human readable)

```json
{
  "mode": "quick",
  "household_size": 1,

  "electricity": {
    "monthly_kwh": null,
    "monthly_cost_usd": null,
    "renewable_fraction": 0.0
  },

  "heating": {
    "monthly_therms": null,
    "monthly_cost_usd": null
  },

  "vehicle": {
    "annual_miles": 0,
    "vehicle_type": "gasoline",
    "mpg": null
  },

  "flights": {
    "short_haul_count": 0,
    "medium_haul_count": 0,
    "long_haul_count": 0
  },

  "diet": "low_meat",
  "consumption": "average",

  "waste": {
    "recycles_regularly": false,
    "composts": false
  }
}

### Quick mode behavior
If mode is "quick", the backend injects national-average defaults for missing values (and returns warnings).

Minimum viable request:

```json
{
  "mode": "quick",
  "household_size": 1
}

### Response body

```json
{
  "calculation_version": "1.0",
  "breakdown": {
    "electricity_kg": 0,
    "heating_kg": 0,
    "vehicle_kg": 0,
    "flights_kg": 0,
    "diet_kg": 0,
    "consumption_kg": 0,
    "total_kg": 0,
    "total_metric_tons": 0
  },
  "warnings": [
    {
      "code": "QUICK_MODE",
      "message": "Quick Estimate mode uses national-average defaults where data is missing.",
      "field": null
    }
  ]
}

### Warning codes
Clients should treat these warning codes as stable keys for UI messaging.

Defaults or assumptions:
-QUICK_MODE
-ELECTRICITY_DEFAULT
-HEATING_DEFAULT
-VEHICLE_DEFAULT
-FLIGHTS_DEFAULT

Suspicious values:
-ELECTRICITY_HIGH
-VEHICLE_HIGH_MILES
-HOUSEHOLD_LARGE
-RENEWABLE_FULL