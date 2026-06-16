import HeroHeader from "../components/HeroHeader";
import RiskForm from "../components/RiskForm";

import SafetyCards from "../components/SafetyCards";

const RiskAssessment = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      
      <HeroHeader />

      
      <div className="">
        
          <RiskForm />
        
        
      </div>

      
      <SafetyCards />
    </div>
  );
};

export default RiskAssessment;
