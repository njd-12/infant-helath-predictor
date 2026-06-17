from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

_client = None

def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set. Please add it to your .env file.")
        _client = genai.Client(api_key=api_key)
    return _client

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

        response = _get_client().models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return response.text

    except Exception as e:
        return f"Error: {str(e)}"