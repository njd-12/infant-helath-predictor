import {
  HeartPulse,
  Baby,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

const safetyTips = [
  {
    icon: <Stethoscope className="text-blue-600" />,
    title: "Regular Prenatal Checkups",
    desc: "Attend all scheduled antenatal visits to monitor maternal and fetal health.",
  },
  {
    icon: <HeartPulse className="text-red-500" />,
    title: "Maintain Maternal Health",
    desc: "Ensure proper nutrition, manage chronic conditions, and avoid stress.",
  },
  {
    icon: <Baby className="text-green-600" />,
    title: "Proper Neonatal Care",
    desc: "Immediate breastfeeding, warmth, and hygiene reduce early infant risks.",
  },
  {
    icon: <ShieldCheck className="text-purple-600" />,
    title: "Timely Immunization",
    desc: "Follow recommended vaccination schedules to prevent infections.",
  },
];

const SafetyCards = () => {
  return (
    <div className="mt-14">
      <h2 className="text-2xl font-semibold text-center mb-6">
        Infant Safety & Care Guidelines
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {safetyTips.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow p-5 text-center hover:shadow-lg transition"
          >
            <div className="flex justify-center mb-3 text-3xl">
              {item.icon}
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">
              {item.title}
            </h3>
            <p className="text-sm text-gray-600">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SafetyCards;
