#  Infant Mortality Risk Predictor

An AI-powered web application that predicts infant mortality risk using machine learning and provides explainable insights and healthcare recommendations.

---

## Features

-  Risk prediction using trained ML model (XGBoost)
-  Explainable AI using SHAP (feature importance)
-  Visual analytics (charts for risk factors)
-  Healthcare recommendations based on risk
-  Prediction history (stored locally)
-  Full-stack application (React + FastAPI)

---

##  Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Recharts (for visualization)

### Backend
- FastAPI
- Python
- XGBoost
- SHAP

---

##  How it Works

1. User enters maternal and birth details
2. Data is sent to backend API
3. ML model predicts risk probability
4. SHAP explains contributing factors
5. Results displayed with:
   - Risk score
   - Key factors
   - Visual charts
   - Care suggestions

---

##  Project Structure
frontend/ → React UI
backend/ → FastAPI + ML model

 Backend setup
cd backend
pip install -r requirements.txt
uvicorn app:app --reload

 Frontend setup
cd frontend
npm install
npm run dev