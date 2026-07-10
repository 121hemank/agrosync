from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from app.services.predictor import recommend_crop, predict_yield, predict_harvest

router = APIRouter(prefix="/api", tags=["predictions"])

class CropRecommendationRequest(BaseModel):
    soil_type: str
    temperature: float = Field(ge=-10, le=60)
    rainfall: float = Field(ge=0, le=500)
    humidity: float = Field(ge=0, le=100)
    season: str

class CropRecommendationResponse(BaseModel):
    recommended_crop: str
    confidence: float
    reason: str
    weather_score: float
    alternatives: List[str]

class YieldRequest(BaseModel):
    soil_type: str
    temperature: float
    rainfall: float
    humidity: float
    area: float = Field(gt=0)

class YieldResponse(BaseModel):
    expected_yield: float
    unit: str
    total_yield: float
    confidence: float

class HarvestRequest(BaseModel):
    crop_type_id: int = Field(ge=0, le=6)
    planted_date: str
    temperature: float
    rainfall: float
    soil_moisture: float = Field(ge=0, le=100)
    growth_duration: int = Field(ge=30, le=365)

class HarvestResponse(BaseModel):
    expected_date: str
    days_to_harvest: int
    expected_yield: float
    confidence: float

@router.post("/recommend-crop", response_model=CropRecommendationResponse)
def recommend_crop_endpoint(req: CropRecommendationRequest):
    try:
        result = recommend_crop(
            soil_type=req.soil_type,
            temperature=req.temperature,
            rainfall=req.rainfall,
            humidity=req.humidity,
            season=req.season
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict-yield", response_model=YieldResponse)
def predict_yield_endpoint(req: YieldRequest):
    try:
        result = predict_yield(
            soil_type=req.soil_type,
            temperature=req.temperature,
            rainfall=req.rainfall,
            humidity=req.humidity,
            area=req.area
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict-harvest", response_model=HarvestResponse)
def predict_harvest_endpoint(req: HarvestRequest):
    try:
        result = predict_harvest(
            crop_type_id=req.crop_type_id,
            planted_date=req.planted_date,
            temperature=req.temperature,
            rainfall=req.rainfall,
            soil_moisture=req.soil_moisture,
            growth_duration=req.growth_duration
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
