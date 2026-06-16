import { ArrowLeft, HeartPulse } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AfterCare = () => {
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

      <h1 className="text-3xl font-bold text-pink-600 mb-6 text-center">
        After Birth Care Guidelines
      </h1>

      <div className="grid md:grid-cols-2 gap-6">

        <div className="bg-white p-5 rounded-xl shadow border">
          <HeartPulse className="text-red-500 mb-2" />
          <h3 className="font-semibold mb-2">Breastfeeding</h3>
          <p className="text-gray-600 text-sm">
            Exclusive breastfeeding for first 6 months improves immunity and growth.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border">
          <HeartPulse className="text-red-500 mb-2" />
          <h3 className="font-semibold mb-2">Vaccination</h3>
          <p className="text-gray-600 text-sm">
            Follow national immunization schedule strictly.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border">
          <HeartPulse className="text-red-500 mb-2" />
          <h3 className="font-semibold mb-2">Monitor Growth</h3>
          <p className="text-gray-600 text-sm">
            Regularly check weight, height, and development milestones.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border">
          <HeartPulse className="text-red-500 mb-2" />
          <h3 className="font-semibold mb-2">Seek Medical Help</h3>
          <p className="text-gray-600 text-sm">
            Immediate care is needed for fever, breathing issues, or feeding problems.
          </p>
        </div>

      </div>

      <p className="text-xs text-gray-500 mt-8 text-center">
        Source: WHO, UNICEF newborn care recommendations
      </p>
    </div>
  );
};

export default AfterCare;