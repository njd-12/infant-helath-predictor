import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  HeartPulse
} from "lucide-react";

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
  if (score < 30) {
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

  return {
    label: "High Risk",
    bg: "bg-orange-50",
    border: "border-orange-500",
    bar: "bg-orange-500",
    icon: "text-orange-600",
    text: "High risk detected. Medical consultation is advised.",
    suggestions: [
      "Seek immediate consultation with a qualified healthcare professional",
      "Prefer institutional delivery and neonatal care facilities",
      "Ensure frequent medical check-ups for mother and infant",
      "Monitor the infant closely for early signs of illness",
      "Address maternal health issues such as anemia or infections",
      "Ensure proper nutrition for both mother and child",
      "Maintain strict hygiene and sanitation in the living environment",
      "Ensure emergency medical services are accessible",
      "Educate caregivers on newborn care and danger signs"
    ]
  };
};

const getVisualScore = (score) => {
  if (score < 30) return (score / 30) * 50;
  return 50 + ((score - 30) / 70) * 50;
};

const ResultPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  if (!state?.result) {
    navigate("/");
    return null;
  }

  const { risk_of_death, top_factors } = state.result;

  const score = Math.round(risk_of_death * 100);
  const visualScore = getVisualScore(score);
  const risk = getRiskConfig(score);

  /* 📊 CHART DATA */
  const chartData = top_factors.map(item => ({
  name: item.feature,
  impact: Math.abs(item.impact),
  direction: item.direction
}));
  return (
    <div className="max-w-6xl mx-auto p-6">
      <Chatbot/>
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-gray-600 mb-6 hover:text-black"
      >
        <ArrowLeft size={18} />
        New Assessment
      </button>

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