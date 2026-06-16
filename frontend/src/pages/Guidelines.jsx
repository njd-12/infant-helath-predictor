import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Guidelines = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto p-6">

      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-gray-600 mb-6 hover:text-black"
      >
        <ArrowLeft size={18} />
        Back to Home
      </button>

      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
        General Maternal & Infant Health Guidelines
      </h1>

      <div className="grid md:grid-cols-2 gap-6">

        <div className="bg-white p-5 rounded-xl shadow border">
          <ShieldCheck className="text-green-600 mb-2" />
          <h3 className="font-semibold mb-2">Regular Checkups</h3>
          <p className="text-gray-600 text-sm">
            Attend all antenatal visits. Early detection of complications improves outcomes.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border">
          <ShieldCheck className="text-green-600 mb-2" />
          <h3 className="font-semibold mb-2">Balanced Nutrition</h3>
          <p className="text-gray-600 text-sm">
            Ensure adequate intake of iron, calcium, and protein during pregnancy.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border">
          <ShieldCheck className="text-green-600 mb-2" />
          <h3 className="font-semibold mb-2">Avoid Harmful Substances</h3>
          <p className="text-gray-600 text-sm">
            Avoid alcohol, tobacco, and harmful drugs during pregnancy.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border">
          <ShieldCheck className="text-green-600 mb-2" />
          <h3 className="font-semibold mb-2">Hygiene & Sanitation</h3>
          <p className="text-gray-600 text-sm">
            Maintain clean surroundings and safe drinking water to prevent infections.
          </p>
        </div>

      </div>

      <p className="text-xs text-gray-500 mt-8 text-center">
        Source: WHO, UNICEF maternal and child health guidelines
      </p>
    </div>
  );
};

export default Guidelines;