import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Baby, Send } from "lucide-react";
import { getRiskPrediction } from "../api/predict";
import History from "./History";
const educationOptions = [
  { value: 0, label: "No Education" },
  { value: 1, label: "Primary Education" },
  { value: 2, label: "Secondary Education" },
  { value: 3, label: "Higher Education" },
];

const wealthIndexOptions = [
  { value: 1, label: "Poorest" },
  { value: 2, label: "Poorer" },
  { value: 3, label: "Middle" },
  { value: 4, label: "Richer" },
  { value: 5, label: "Richest" },
];
const birthTypeOptions = [
  { value: 0, label: "Single birth" },
  { value: 1, label: "Twin birth" },
  { value: 2, label: "Triplet or higher" },
];

const sexOptions = [
  { value: 2, label: "Female" },
  { value: 1, label: "Male" },
];

const sizeAtBirthOptions = [
  { value: 5, label: "Very small" },
  { value: 4, label: "Smaller than average" },
  { value: 3, label: "Average" },
  { value: 2, label: "Larger than average" },
  { value: 1, label: "Very large" },
  { value: 8, label: "Don't know" },
];

const deliveryPlaceOptions = [
  { value: 11, label: "Home" },
  { value: 21, label: "Government hospital" },
  { value: 22, label: "Government health center" },
  { value: 31, label: "Private hospital" },
  { value: 96, label: "Other / Unknown" },
];

const residenceOptions = [
  { value: 1, label: "Urban" },
  { value: 2, label: "Rural" },
];

const pregnancyWantedOptions = [
  { value: 0, label: "Wanted at the time" },
  { value: 1, label: "Not wanted / Wanted later" },
];

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {children}
  </div>
);

const RiskForm = () => {
  const navigate = useNavigate();

 const [formData, setFormData] = useState({
  b0: "",
  b4: "",
  b11: "",
  m18: "",
  m15: "",
  v012: "",
  v025: "",
  v136: "",
  m17: "",
  v106: "",
  v190: "",
  m14: "",
  bord: "",
});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: Number(e.target.value),
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getRiskPrediction(formData);
const existing =
  JSON.parse(localStorage.getItem("prediction_history")) || [];

const newEntry = {
  ...data,
  time: new Date().toLocaleString(),
};

localStorage.setItem(
  "prediction_history",
  JSON.stringify([...existing, newEntry].slice(-10))
);
      navigate("/result", {
        state: { result: data },
      });

    } catch (err) {
      setError("Failed to fetch prediction. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-10">

      {/* HERO */}
      <div className="text-center max-w-2xl mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          Assess Infant Health Risk
        </h2>
        <p className="text-gray-500 mt-2">
          Enter maternal and birth details to predict infant mortality risk using AI.
        </p>
      </div>

      {/* FORM CARD */}
      <div className="card p-6 w-full max-w-4xl">

        <h3 className="text-xl font-semibold mb-4 text-center">
          Enter Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<Field label="Type of Birth">
  <select name="b0" onChange={handleChange} className="input">
    <option value="">Select</option>
    {birthTypeOptions.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
</Field>

<Field label="Sex of Child">
  <select name="b4" onChange={handleChange} className="input">
    <option value="">Select</option>
    {sexOptions.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
</Field>

<Field label="Birth Interval (months)">
  <input
    type="number"
    name="b11"
    className="input"
    onChange={handleChange}
  />
</Field>

<Field label="Size at Birth">
  <select name="m18" onChange={handleChange} className="input">
    <option value="">Select</option>
    {sizeAtBirthOptions.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
</Field>

<Field label="Place of Delivery">
  <select name="m15" onChange={handleChange} className="input">
    <option value="">Select</option>
    {deliveryPlaceOptions.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
</Field>

<Field label="Mother's Age">
  <input
    type="number"
    name="v012"
    className="input"
    onChange={handleChange}
  />
</Field>

<Field label="Residence">
  <select name="v025" onChange={handleChange} className="input">
    <option value="">Select</option>
    {residenceOptions.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
</Field>

<Field label="Household Size">
  <input
    type="number"
    name="v136"
    className="input"
    onChange={handleChange}
  />
</Field>

<Field label="Pregnancy Wanted">
  <select name="m17" onChange={handleChange} className="input">
    <option value="">Select</option>
    {pregnancyWantedOptions.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
</Field>

<Field label="Mother's Education">
  <select name="v106" onChange={handleChange} className="input">
    <option value="">Select</option>
    {educationOptions.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
</Field>

<Field label="Household Wealth Index">
  <select name="v190" onChange={handleChange} className="input">
    <option value="">Select</option>
    {wealthIndexOptions.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
</Field>

<Field label="Number of ANC Visits">
  <input
    type="number"
    name="m14"
    min="0"
    max="20"
    className="input"
    onChange={handleChange}
  />
</Field>

<Field label="Birth Order">
  <input
    type="number"
    name="bord"
    min="1"
    className="input"
    onChange={handleChange}
  />
</Field>

        </div>

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
        >
          <Send size={18} />
          {loading ? "Predicting..." : "Calculate Risk"}
        </button>

        {error && (
          <div className="mt-4 text-red-600 text-center">{error}</div>
        )}
      </div>

      {/* NAVIGATION BUTTONS */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={() => navigate("/guidelines")}
          className="px-4 py-2 bg-blue-500 text-white rounded-xl shadow hover:bg-blue-600"
        >
          General Guidelines
        </button>

        <button
          onClick={() => navigate("/after-care")}
          className="px-4 py-2 bg-pink-500 text-white rounded-xl shadow hover:bg-pink-600"
        >
          After Birth Care
        </button>
      </div>

      <History />

    </div>
  );
};

export default RiskForm;