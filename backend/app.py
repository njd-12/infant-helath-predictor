import joblib
import shap
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from chatbot import get_chat_response
from pydantic import BaseModel
# Load model and features
model = joblib.load('./infant_mortality_model.pkl')
features = joblib.load('./model_features.pkl')
class PredictionRequest(BaseModel):
    b0: int
    b4: int
    b11: int
    m18: int
    m15: int
    v012: int
    v025: int
    v136: int
    m17: int
    v106: int
    v190: int
    m14: int
    bord: int
# Initialize SHAP explainer
explainer = shap.TreeExplainer(model)
latest_prediction={}
# Feature name mapping (human readable)
FEATURE_MAP = {
    "b0": "Birth Type",
    "b4": "Child Gender",
    "b11": "Birth Interval",
    "m18": "Size At Birth",
    "m15": "Place Of Delivery",
    "v012": "Mother's Age",
    "v025": "Residence",
    "v136": "Household Size",
    "m17": "Pregnancy Wanted",
    "v106": "Mother's Education",
    "v190": "Wealth Index",
    "m14": "ANC Visits",
    "bord": "Birth Order"
}
# Create FastAPI app
app = FastAPI(title='Infant Mortality Predictor')

# Enable CORS (for React frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def home():
    return {"message": "API running successfully"}

@app.post("/predict")
def predict(data: PredictionRequest):

    # Convert input to DataFrame
    raw_df = pd.DataFrame([data.model_dump()])

    # One-hot encoding
    df = pd.get_dummies(
        raw_df,
        columns=["b0", "b4", "m18", "m15", "v025", "m17"],
        drop_first=False
    )

    df = df.astype(int)

    # Ensure all required columns exist
    for col in features:
        if col not in df.columns:
            df[col] = 0

    # Match training feature order
    df = df[features]

    # Prediction
    raw_score = float(model.predict_proba(df)[0][1])

    # Convert to interpretable risk
    risk_of_death = 1 - raw_score
    prediction = "High Risk" if risk_of_death >= 0.45 else "Low Risk"

    # =========================
    # SHAP EXPLANATION
    # =========================
    shap_values = explainer.shap_values(df)

    # Handle different SHAP outputs safely
    if isinstance(shap_values, list):
        shap_vals = shap_values[1][0]
    else:
        shap_vals = shap_values[0]

    # Map features to SHAP values
    aggregated = {}

    for feature, value in zip(df.columns, shap_vals):

        base_feature = feature.split("_")[0]

        if base_feature not in aggregated:
            aggregated[base_feature] = {
            "impact": 0,
            "signed": 0
        }

        aggregated[base_feature]["impact"] += abs(float(value))
        aggregated[base_feature]["signed"] += float(value)

    sorted_features = sorted(
    aggregated.items(),
    key=lambda x: x[1]["impact"],
    reverse=True
)

    top_features = []

    for feature, vals in sorted_features[:5]:

        top_features.append({
        "feature": FEATURE_MAP.get(feature, feature),
        "impact": round(vals["impact"], 3),
        "direction":
            "Increased Risk"
            if vals["signed"] > 0
            else "Reduced Risk"
    })
    # =========================
    # RESPONSE
    # =========================
    global latest_prediction
    
    latest_prediction = {
        "model_score": round(raw_score, 3),
        "risk_of_death": round(risk_of_death, 3),
        "prediction": prediction,
        "top_factors": top_features
    }

    return latest_prediction
class ChatRequest(BaseModel):
    message: str
    prediction_data: dict | None = None
@app.post("/chat")
def chat(req:ChatRequest):
    response = get_chat_response(req.message,latest_prediction)
    return {
        "response" :    response
    }