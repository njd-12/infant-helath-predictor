from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

SYSTEM_PROMPT = """
You are an AI healthcare assistant for maternal and infant care.

Your role:
- Dont use technical terms explain in a layman terms about shap or any tech talks
- Explain infant mortality risk predictions
- Explain healthcare risk factors simply
- Give preventive healthcare suggestions
- Explain SHAP results clearly
- Be concise and medically responsible
- Never diagnose diseases
- Recommend consulting doctors for emergencies
"""

def get_chat_response(user_message, prediction_data=None):

    context = ""

    if prediction_data:
        context = f"""
        Prediction Data:
        {prediction_data}
        """

    prompt = f"""
    {SYSTEM_PROMPT}

    {context}

    User Question:
    {user_message}
    """

    try:

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )

        return response.text

    except Exception as e:
        return f"Error: {str(e)}"