import { Activity } from "lucide-react";
import hero from "../assets/hero.jpg";

const HeroHeader = () => {
  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-8 mb-10 text-white overflow-hidden">
      {/* Background image overlay */}
      <img
        src={hero}
        alt="Healthcare"
        className="absolute inset-0 w-full h-full object-cover opacity-20"
      />

      <div className="relative z-10 text-center">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Activity size={32} />
          <h1 className="text-3xl font-bold">
            Infant Mortality Risk Assessment
          </h1>
        </div>

        <p className="text-blue-100 max-w-2xl mx-auto">
          Enter infant and maternal factors to calculate a research-based
          mortality risk score and follow recommended safety measures.
        </p>
      </div>
    </div>
  );
};

export default HeroHeader;
