import numpy as np
import joblib
import os
from datetime import datetime, timedelta
from app.services.trainer import ensure_models

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')

ensure_models()

crop_model = joblib.load(os.path.join(MODEL_DIR, 'crop_recommender.pkl'))
soil_encoder = joblib.load(os.path.join(MODEL_DIR, 'soil_encoder.pkl'))
season_encoder = joblib.load(os.path.join(MODEL_DIR, 'season_encoder.pkl'))
crop_encoder = joblib.load(os.path.join(MODEL_DIR, 'crop_encoder.pkl'))

yield_model = joblib.load(os.path.join(MODEL_DIR, 'yield_predictor.pkl'))
yield_soil_encoder = joblib.load(os.path.join(MODEL_DIR, 'yield_soil_encoder.pkl'))

harvest_model = joblib.load(os.path.join(MODEL_DIR, 'harvest_predictor.pkl'))

CROPS = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Pulses', 'Groundnut']

def recommend_crop(soil_type: str, temperature: float, rainfall: float, humidity: float, season: str):
    try:
        soil_enc = soil_encoder.transform([soil_type])[0]
    except:
        soil_enc = 0
    try:
        season_enc = season_encoder.transform([season])[0]
    except:
        season_enc = 0

    features = np.array([[soil_enc, temperature, rainfall, humidity, season_enc]])
    proba = crop_model.predict_proba(features)[0]
    pred_class = crop_model.predict(features)[0]
    confidence = float(np.max(proba) * 100)
    crop_name = crop_encoder.inverse_transform([pred_class])[0]

    weather_score = min(100, max(0, (
        (1 - abs(temperature - 26) / 15) * 30 +
        (1 - abs(rainfall - 180) / 120) * 30 +
        (humidity / 80) * 25 +
        15
    )))

    reasons = {
        'Rice': 'High temperature and rainfall make this ideal for paddy cultivation',
        'Wheat': 'Moderate temperature and well-distributed rainfall suit wheat growth',
        'Maize': 'Warm weather and moderate rainfall are perfect for maize',
        'Cotton': 'Black soil with warm temperature supports cotton farming',
        'Sugarcane': 'Long growing season with adequate moisture benefits sugarcane',
        'Pulses': 'Low water requirement and moderate temperature suit pulses',
        'Groundnut': 'Sandy soil with warm climate is ideal for groundnut'
    }

    return {
        'recommended_crop': crop_name,
        'confidence': round(confidence, 2),
        'reason': reasons.get(crop_name, 'Suitable for current conditions'),
        'weather_score': round(weather_score, 2),
        'alternatives': [c for c in CROPS if c != crop_name][:3]
    }

def predict_yield(soil_type: str, temperature: float, rainfall: float, humidity: float, area: float):
    try:
        soil_enc = yield_soil_encoder.transform([soil_type])[0]
    except:
        soil_enc = 0

    features = np.array([[soil_enc, temperature, rainfall, humidity, area]])
    predicted = yield_model.predict(features)[0]

    return {
        'expected_yield': round(float(predicted), 2),
        'unit': 'tons/hectare',
        'total_yield': round(float(predicted * area), 2),
        'confidence': round(min(95, max(70, 85 - abs(predicted - 3.5) * 5)), 2)
    }

def predict_harvest(crop_type_id: int, planted_date: str, temperature: float, rainfall: float, soil_moisture: float, growth_duration: int):
    planted = datetime.strptime(planted_date, '%Y-%m-%d')
    planted_day = planted.timetuple().tm_yday

    features = np.array([[crop_type_id, planted_day, temperature, rainfall, soil_moisture, growth_duration]])
    days_to_harvest = harvest_model.predict(features)[0]

    harvest_date = planted + timedelta(days=int(days_to_harvest))
    expected_yield = max(1, 5 - abs(days_to_harvest - growth_duration) * 0.02)
    confidence = min(95, max(60, 85 - abs(days_to_harvest - growth_duration) * 0.2))

    return {
        'expected_date': harvest_date.strftime('%Y-%m-%d'),
        'days_to_harvest': int(days_to_harvest),
        'expected_yield': round(float(expected_yield), 2),
        'confidence': round(float(confidence), 2)
    }
