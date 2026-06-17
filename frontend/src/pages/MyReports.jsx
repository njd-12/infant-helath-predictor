import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowRight, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMyReports, requestConsultation } from "../api/auth";

const riskColor = {
  "High Risk":     "bg-red-50    border-red-300    text-red-700",
  "Moderate Risk": "bg-yellow-50 border-yellow-300 text-yellow-700",
  "Low Risk":      "bg-green-50  border-green-300  text-green-700",
};

export default function MyReports() {
  const { auth }  = useAuth();
  const navigate  = useNavigate();
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [requesting, setRequesting] = useState(null);
  const [note, setNote]         = useState({});
  const [showNote, setShowNote] = useState(null);
  const [msg, setMsg]           = useState("");

  useEffect(() => {
    getMyReports(auth.token).then((d) => {
      setReports(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  const handleConsult = async (reportId) => {
    setRequesting(reportId);
    const res = await requestConsultation(auth.token, { reportId, note: note[reportId] || "" });
    if (res._id) {
      setMsg("Consultation request sent! A doctor will review it shortly.");
      setShowNote(null);
    } else {
      setMsg(res.message || "Failed to send request.");
    }
    setRequesting(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <FileText size={26} className="text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-800">My Reports</h1>
      </div>

      {msg && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm p-3 rounded-xl mb-5">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <FileText size={40} className="mx-auto mb-3 text-gray-300" />
          <p>No saved reports yet.</p>
          <button onClick={() => navigate("/")}
            className="mt-4 text-blue-600 text-sm hover:underline">
            Run your first assessment →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((r) => (
            <div key={r._id} className={`card p-5 border ${riskColor[r.prediction] || "border-gray-200"}`}>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <span className="font-semibold text-lg">{r.prediction}</span>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Risk Score: {Math.round(r.riskOfDeath * 100)}% &nbsp;·&nbsp;
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate("/result", { state: { result: {
                      model_score: r.modelScore,
                      risk_of_death: r.riskOfDeath,
                      prediction: r.prediction,
                      top_factors: r.topFactors,
                    }}})}
                    className="text-sm flex items-center gap-1 text-blue-600 border border-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                    View <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => setShowNote(showNote === r._id ? null : r._id)}
                    className="text-sm flex items-center gap-1 text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700">
                    <MessageSquare size={14} />
                    Consult Doctor
                  </button>
                </div>
              </div>

              {/* Top factors summary */}
              {r.topFactors?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {r.topFactors.slice(0, 3).map((f, i) => (
                    <span key={i} className={`text-xs px-2 py-1 rounded-full border ${
                      f.direction === "Increased Risk"
                        ? "bg-red-50 border-red-200 text-red-600"
                        : "bg-green-50 border-green-200 text-green-600"
                    }`}>{f.feature}</span>
                  ))}
                </div>
              )}

              {/* Note input */}
              {showNote === r._id && (
                <div className="mt-4 flex flex-col gap-2">
                  <textarea
                    rows={2}
                    placeholder="Add a note for the doctor (optional)..."
                    className="input resize-none text-sm"
                    value={note[r._id] || ""}
                    onChange={(e) => setNote({ ...note, [r._id]: e.target.value })}
                  />
                  <button
                    onClick={() => handleConsult(r._id)}
                    disabled={requesting === r._id}
                    className="btn-primary text-sm px-4 py-2 self-start">
                    {requesting === r._id ? "Sending..." : "Send Request"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
