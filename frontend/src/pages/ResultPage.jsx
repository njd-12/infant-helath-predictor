import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  HeartPulse,
  Download
} from "lucide-react";
import { useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import Chatbot from "../components/ChatBox";

const getRiskConfig = (score) => {
  if (score < 5) {
    return {
      label: "Low Risk",
      bg: "bg-green-50",
      border: "border-green-500",
      bar: "bg-green-500",
      icon: "text-green-600",
      text:
        "The assessed risk factors suggest a low probability of adverse outcomes.",
      suggestions: [
        "Continue regular antenatal and postnatal check-ups",
        "Maintain balanced nutrition for mother and child",
        "Ensure complete immunization schedule",
        "Practice exclusive breastfeeding for the first 6 months",
        "Maintain proper hygiene and sanitation",
        "Monitor child’s growth and weight periodically"
      ]
    };
  }

  if (score < 15) {
    return {
      label: "Moderate Risk",
      bg: "bg-yellow-50",
      border: "border-yellow-500",
      bar: "bg-yellow-500",
      icon: "text-yellow-600",
      text: "Moderate risk detected. Enhanced monitoring and medical consultation are recommended.",
      suggestions: [
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
    };
  }

  return {
    label: "High Risk",
    bg: "bg-red-50",
    border: "border-red-500",
    bar: "bg-red-500",
    icon: "text-red-600",
    text: "High risk detected. Immediate medical consultation with a healthcare professional is strongly advised.",
    suggestions: [
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
  };
};

const getVisualScore = (score) => {
  return (score / 100) * 100;
};

const ResultPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!state?.result) {
    navigate("/");
    return null;
  }

  const { risk_of_death, top_factors, model_score, prediction } = state.result;

  const score = Math.round(risk_of_death * 100);
  const visualScore = getVisualScore(score);
  const risk = getRiskConfig(score);

  /* 📊 CHART DATA */
  const chartData = top_factors.map(item => ({
    name: item.feature,
    impact: Math.abs(item.impact),
    direction: item.direction
  }));

  // Handle PDF Download
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('http://localhost:8000/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_score,
          risk_of_death,
          prediction,
          top_factors
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `infant_health_report_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };
  return (
    <div className="max-w-6xl mx-auto p-6">
      <Chatbot/>
      {/* BACK BUTTON + DOWNLOAD */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-600 hover:text-black"
        >
          <ArrowLeft size={18} />
          New Assessment
        </button>
        
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Download size={18} />
          {isDownloading ? 'Generating...' : 'Download Report'}
        </button>
      </div>

      {/* MAIN RISK CARD */}
      <div className={`card p-8 text-center border ${risk.border} ${risk.bg}`}>

        <CheckCircle size={60} className={`mx-auto ${risk.icon}`} />

        <h1 className="text-3xl font-bold mt-4">
          {risk.label}
        </h1>

        <p className="text-gray-600 mt-2 max-w-xl mx-auto">
          {risk.text}
        </p>

        {/* SCORE */}
        <div className="mt-6">
          <p className="text-4xl font-bold">{score}%</p>
          <p className="text-sm text-gray-500">Risk Score</p>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full bg-gray-200 rounded-full h-5 mt-6">
          <div
            className={`h-5 rounded-full ${risk.bar}`}
            style={{ width: `${visualScore}%` }}
          />
        </div>
      </div>

      {/* 🔥 FACTORS + CHART */}
      {top_factors && (
        <div className="grid md:grid-cols-2 gap-6 mt-8">

          {/* LEFT: FACTORS */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Key Risk Factors
            </h2>

            <div className="space-y-3">
              {top_factors.map((factor, i) => (
  <div
    key={i}
    className={`p-4 rounded-xl shadow border text-sm transition ${
      factor.direction === "Increased Risk"
        ? "bg-red-50 border-red-200 text-red-700"
        : "bg-green-50 border-green-200 text-green-700"
    }`}
  >
    <div className="font-semibold">
      {factor.feature}
    </div>

    <div className="text-xs mt-1">
      {factor.direction}
    </div>

    <div className="text-xs opacity-70">
      SHAP Impact: {factor.impact}
    </div>
  </div>
))}
            </div>
          </div>

          {/* RIGHT: CHART */}
          {chartData.length > 0 && (
            <div className="card p-6 flex flex-col justify-center">

              <h2 className="text-lg font-semibold mb-4 text-center">
                Impact Visualization
              </h2>

              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={18}>
                  
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis hide />

                  <Tooltip />

                  <Bar dataKey="impact">
  {chartData.map((entry, index) => (
    <Cell
      key={index}
      fill={
        entry.direction === "Increased Risk"
          ? "#ef4444"
          : "#22c55e"
      }
    />
  ))}
</Bar>

                </BarChart>
              </ResponsiveContainer>

              <p className="text-xs text-gray-500 mt-3 text-center">
                🔴 Increased Risk &nbsp;&nbsp; 🟢 Decreased Risk
              </p>

            </div>
          )}

        </div>
      )}

      {/* SUGGESTIONS */}
      <div className="card p-6 mt-8">

        <div className="flex items-center gap-2 mb-4">
          <HeartPulse className="text-red-500" />
          <h3 className="text-lg font-semibold">
            Recommended Care Measures
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {risk.suggestions.map((item, i) => (
            <div key={i} className="flex gap-3 bg-gray-50 p-3 rounded-lg border">
              <ShieldCheck className="text-green-600 mt-1" size={18} />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>

        {/* DISCLAIMER */}
        <div className="mt-5 flex gap-2 text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
          <AlertCircle size={16} />
          <p>
            These recommendations are for educational purposes only and do not replace professional medical advice.
          </p>
        </div>

      </div>

    </div>
  );
};

export default ResultPage;