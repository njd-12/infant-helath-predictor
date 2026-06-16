export async function getRiskPrediction(payload) {
  const url =  "http://localhost:8000/predict";  // use local backend

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error("Prediction API Error:", err);
    return { error: err.message };
  }
}