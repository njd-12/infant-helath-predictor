import joblib
import shap
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from chatbot import get_chat_response
from pydantic import BaseModel
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
# Load model and features
model = joblib.load('./infant_mortality_model.pkl')
features = joblib.load('./model_features.pkl')
# Load calibrator and optimal threshold for handling class imbalance
try:
    calibrator = joblib.load('./probability_calibrator.pkl')
    optimal_threshold = joblib.load('./optimal_threshold.pkl')
    print(f"Loaded calibrator and optimal threshold: {optimal_threshold:.2f}")
except FileNotFoundError:
    print("Calibrator or threshold not found. Using raw probabilities and default threshold (0.5)")
    calibrator = None
    optimal_threshold = 0.5
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
    m19:int
    low_birth_weight: int
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
    "bord": "Birth Order",
    "m19": "Birth Weight",
    "low": "Low Birth Weight"
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
        columns=["b0", "b4", "m18", "m15", "v025", "m17" ],
        drop_first=False
    )

    df = df.astype(int)

    # Ensure all required columns exist
    for col in features:
        if col not in df.columns:
            df[col] = 0

    # Match training feature order
    df = df[features]
    print(df.T)
    # Prediction
    raw_score = float(model.predict_proba(df)[0][1])

    # Apply probability calibration if available to handle class imbalance
    if calibrator is not None:
        risk_of_death = float(calibrator.predict_proba(df)[0][1])
    else:
        risk_of_death = raw_score
    raw_prob = float(model.predict_proba(df)[0][1])

    if calibrator is not None:
        calibrated_prob = float(
            calibrator.predict_proba(df)[0][1]
        )
    else:
        calibrated_prob = raw_prob

    print("RAW PROBABILITY:", raw_prob)
    print("CALIBRATED PROBABILITY:", calibrated_prob)
    
    # Three-tier risk classification using rare-event thresholds
    if risk_of_death < 0.05:
        prediction = "Low Risk"
    elif risk_of_death < 0.15:
        prediction = "Moderate Risk"
    else:
        prediction = "High Risk"

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

class PDFRequest(BaseModel):
    model_score: float
    risk_of_death: float
    prediction: str
    top_factors: list

@app.post("/generate-pdf")
def generate_pdf(data: PDFRequest):
   
    try:
        # Create PDF in memory
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#374151'),
            spaceAfter=10,
            fontName='Helvetica-Bold'
        )
        
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['BodyText'],
            fontSize=10,
            textColor=colors.HexColor('#4b5563'),
            spaceAfter=6
        )
        
        # Title
        title = Paragraph("Infant Mortality Risk Assessment Report", title_style)
        elements.append(title)
        elements.append(Spacer(1, 0.2*inch))
        
        # Report Date
        date_text = Paragraph(f"<b>Report Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", body_style)
        elements.append(date_text)
        elements.append(Spacer(1, 0.3*inch))
        
        # Risk Assessment Section
        elements.append(Paragraph("Risk Assessment Summary", heading_style))
        
        score_percent = round(data.risk_of_death * 100)
        
        # Determine color based on risk level using calibrated thresholds
        if score_percent < 5:
            risk_color = colors.HexColor('#22c55e')  # Green
        elif score_percent < 15:
            risk_color = colors.HexColor('#eab308')  # Yellow
        else:
            risk_color = colors.HexColor('#ef4444')  # Red
        
        # Risk summary table
        risk_data = [
            ['Risk Classification', 'Risk Score', 'Model Confidence'],
            [data.prediction, f'{score_percent}%', f'{round(data.model_score * 100, 1)}%']
        ]
        
        risk_table = Table(risk_data, colWidths=[2.2*inch, 1.8*inch, 1.8*inch])
        risk_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#fafafa')),
            ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor('#1f2937')),
            ('FONTSIZE', (0, 1), (-1, 1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fafafa')]),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        elements.append(risk_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Risk Interpretation
        if score_percent < 5:
            interpretation = "The assessed risk factors suggest a <b>low probability of adverse outcomes</b>. Continue with regular medical check-ups and follow recommended preventive care measures."
        elif score_percent < 15:
            interpretation = "The assessment indicates <b>moderate risk factors</b>. Enhanced monitoring and medical consultation are recommended to optimize care."
        else:
            interpretation = "The assessment indicates <b>high risk factors</b>. Immediate medical consultation with a qualified healthcare professional is strongly advised."
        
        elements.append(Paragraph("Interpretation:", heading_style))
        elements.append(Paragraph(interpretation, body_style))
        elements.append(Spacer(1, 0.3*inch))
        
        # Top Risk Factors Section
        elements.append(Paragraph("Key Risk Factors", heading_style))
        
        if data.top_factors:
            factors_data = [['Factor', 'Impact', 'Direction']]
            
            for factor in data.top_factors:
                direction_label = "↑ Increased" if factor['direction'] == "Increased Risk" else "↓ Reduced"
                factors_data.append([
                    factor['feature'],
                    f"{factor['impact']:.3f}",
                    direction_label
                ])
            
            factors_table = Table(factors_data, colWidths=[2.5*inch, 1.5*inch, 1.8*inch])
            factors_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ]))
            
            elements.append(factors_table)
            elements.append(Spacer(1, 0.3*inch))
        
        # Recommendations Section
        elements.append(PageBreak())
        elements.append(Paragraph("Recommended Care Measures", heading_style))
        
        if score_percent < 5:
            recommendations = [
                "Continue regular antenatal and postnatal check-ups",
                "Maintain balanced nutrition for mother and child",
                "Ensure complete immunization schedule",
                "Practice exclusive breastfeeding for the first 6 months",
                "Maintain proper hygiene and sanitation",
                "Monitor child's growth and weight periodically"
            ]
        elif score_percent < 15:
            recommendations = [
                "Schedule regular antenatal and postnatal medical consultations",
                "Ensure frequent health check-ups for both mother and infant",
                "Improve nutrition and dietary practices for mother and child",
                "Arrange institutional delivery at a well-equipped facility",
                "Increase frequency of antenatal care visits",
                "Monitor for early warning signs and seek immediate care if needed",
                "Improve household hygiene and sanitation practices",
                "Ensure proper immunization schedule for the child",
                "Educate caregivers on basic newborn care and health precautions"
            ]
        else:
            recommendations = [
                "Seek immediate consultation with a qualified healthcare professional",
                "Prefer institutional delivery at a facility with neonatal care",
                "Arrange frequent medical check-ups and close monitoring",
                "Monitor the infant closely for early signs of illness",
                "Address all maternal health issues urgently",
                "Ensure optimal nutrition for both mother and child",
                "Maintain strict hygiene and sanitation in the living environment",
                "Ensure emergency medical services are accessible and on standby",
                "Educate all caregivers on newborn care and critical danger signs",
                "Establish a relationship with a pediatrician before delivery"
            ]
        
        for i, rec in enumerate(recommendations, 1):
            elements.append(Paragraph(f"• {rec}", body_style))
        
        elements.append(Spacer(1, 0.3*inch))
        
        # Disclaimer
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#6b7280'),
            spaceAfter=6,
            alignment=TA_LEFT
        )
        
        elements.append(Paragraph("<b>DISCLAIMER:</b>", heading_style))
        disclaimer_text = "These recommendations and risk assessments are for educational purposes only and do not replace professional medical advice. Always consult with qualified healthcare professionals for medical decisions and treatment plans."
        elements.append(Paragraph(disclaimer_text, disclaimer_style))
        
        # Build PDF
        doc.build(elements)
        
        # Reset buffer position
        pdf_buffer.seek(0)
        
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=infant_health_report.pdf"}
        )
    
    except Exception as e:
        return {"error": str(e)}