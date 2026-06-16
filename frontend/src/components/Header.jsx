import { Activity } from "lucide-react";

const Header = () => {
  return (
    <div className="text-center flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 text-blue-600">
        <Activity size={28} />
        <h1 className="text-3xl font-bold">
          Infant Mortality Risk Assessment
        </h1>
      </div>

      <p className="text-gray-600 max-w-2xl">
        Enter infant and maternal factors to calculate a research-based
        mortality risk score.
      </p>
    </div>
  );
};

export default Header;
