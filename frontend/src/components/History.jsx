import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const History = () => {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("prediction_history")) || [];
    setHistory(data.reverse());
  }, []);

  const handleClick = (item) => {
    navigate("/result", {
      state: { result: item },
    });
  };

  if (history.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-6">
        No history available yet.
      </div>
    );
  }

  return (
    <div className="mt-10 w-full max-w-4xl">

      <h2 className="text-xl font-semibold mb-4 text-center">
        Previous Predictions
      </h2>

      <div className="space-y-3">
        {history.map((item, index) => (
          <div
            key={index}
            onClick={() => handleClick(item)}
            className="card p-4 cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex justify-between items-center">

              <div>
                <p className="font-semibold">
                  {item.prediction}
                </p>
                <p className="text-sm text-gray-500">
                  Risk: {(item.risk_of_death * 100).toFixed(1)}%
                </p>

                <p className="text-xs text-gray-400">
                {item.time}
                </p>
                
              </div>

              <div
                className={`text-sm font-semibold ${
                  item.prediction === "High Risk"
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                View
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default History;