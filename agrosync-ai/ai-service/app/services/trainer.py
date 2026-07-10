import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
import joblib
import os

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')

def train_crop_recommender():
    data = pd.DataFrame({
        'soil_type': ['Clay', 'Sandy', 'Loamy', 'Black', 'Red', 'Alluvial', 'Laterite',
                      'Clay', 'Sandy', 'Loamy', 'Black', 'Red', 'Alluvial', 'Laterite',
                      'Clay', 'Sandy', 'Loamy', 'Black', 'Red'],
        'temperature': [25, 30, 22, 28, 26, 24, 27, 32, 35, 20, 30, 28, 25, 29, 22, 33, 21, 31, 27],
        'rainfall': [200, 150, 180, 220, 170, 190, 160, 120, 100, 200, 250, 140, 210, 130, 180, 110, 190, 230, 150],
        'humidity': [70, 60, 65, 75, 55, 68, 72, 50, 45, 70, 80, 58, 73, 48, 66, 42, 69, 78, 56],
        'season': ['Kharif', 'Rabi', 'Kharif', 'Rabi', 'Kharif', 'Rabi', 'Kharif',
                   'Rabi', 'Kharif', 'Rabi', 'Kharif', 'Rabi', 'Kharif', 'Rabi',
                   'Kharif', 'Rabi', 'Kharif', 'Rabi', 'Kharif'],
        'crop': ['Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Pulses', 'Groundnut',
                 'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Pulses', 'Groundnut',
                 'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane']
    })

    soil_encoder = LabelEncoder()
    season_encoder = LabelEncoder()
    crop_encoder = LabelEncoder()

    data['soil_type'] = soil_encoder.fit_transform(data['soil_type'])
    data['season'] = season_encoder.fit_transform(data['season'])
    data['crop'] = crop_encoder.fit_transform(data['crop'])

    X = data[['soil_type', 'temperature', 'rainfall', 'humidity', 'season']]
    y = data['crop']

    model = xgb.XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42)
    model.fit(X, y)

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, os.path.join(MODEL_DIR, 'crop_recommender.pkl'))
    joblib.dump(soil_encoder, os.path.join(MODEL_DIR, 'soil_encoder.pkl'))
    joblib.dump(season_encoder, os.path.join(MODEL_DIR, 'season_encoder.pkl'))
    joblib.dump(crop_encoder, os.path.join(MODEL_DIR, 'crop_encoder.pkl'))

    return model

def train_yield_predictor():
    data = pd.DataFrame({
        'soil_type': ['Clay', 'Sandy', 'Loamy', 'Black', 'Red', 'Alluvial', 'Laterite',
                      'Clay', 'Sandy', 'Loamy', 'Black', 'Red', 'Alluvial', 'Laterite'],
        'temperature': [25, 30, 22, 28, 26, 24, 27, 32, 35, 20, 30, 28, 25, 29],
        'rainfall': [200, 150, 180, 220, 170, 190, 160, 120, 100, 200, 250, 140, 210, 130],
        'humidity': [70, 60, 65, 75, 55, 68, 72, 50, 45, 70, 80, 58, 73, 48],
        'area': [1, 2, 1.5, 3, 2.5, 1.8, 2.2, 4, 3.5, 1.2, 5, 2.8, 3.2, 4.5],
        'yield': [3.5, 2.8, 4.2, 3.0, 5.5, 3.8, 2.5, 4.8, 3.2, 5.0, 4.0, 3.6, 4.5, 3.0]
    })

    soil_encoder = LabelEncoder()
    data['soil_type'] = soil_encoder.fit_transform(data['soil_type'])

    X = data[['soil_type', 'temperature', 'rainfall', 'humidity', 'area']]
    y = data['yield']

    model = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    model.fit(X, y)

    joblib.dump(model, os.path.join(MODEL_DIR, 'yield_predictor.pkl'))
    joblib.dump(soil_encoder, os.path.join(MODEL_DIR, 'yield_soil_encoder.pkl'))

    return model

def train_harvest_predictor():
    np.random.seed(42)
    n = 100
    data = pd.DataFrame({
        'crop_type': np.random.randint(0, 7, n),
        'planted_day': np.random.randint(1, 365, n),
        'temperature': np.random.uniform(20, 35, n),
        'rainfall': np.random.uniform(100, 250, n),
        'soil_moisture': np.random.uniform(40, 80, n),
        'growth_duration': np.random.randint(60, 180, n)
    })
    data['days_to_harvest'] = (
        data['growth_duration']
        + (data['temperature'] - 25) * 0.5
        - data['rainfall'] * 0.02
        + np.random.normal(0, 5, n)
    ).astype(int)

    X = data[['crop_type', 'planted_day', 'temperature', 'rainfall', 'soil_moisture', 'growth_duration']]
    y = data['days_to_harvest']

    model = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    model.fit(X, y)

    joblib.dump(model, os.path.join(MODEL_DIR, 'harvest_predictor.pkl'))
    return model

def ensure_models():
    os.makedirs(MODEL_DIR, exist_ok=True)
    if not os.path.exists(os.path.join(MODEL_DIR, 'crop_recommender.pkl')):
        train_crop_recommender()
    if not os.path.exists(os.path.join(MODEL_DIR, 'yield_predictor.pkl')):
        train_yield_predictor()
    if not os.path.exists(os.path.join(MODEL_DIR, 'harvest_predictor.pkl')):
        train_harvest_predictor()
