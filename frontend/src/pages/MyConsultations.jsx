import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Clock, CheckCircle, XCircle, ClipboardList } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMyConsultations } from "../api/auth";

const statusIcon = {
  pending: <Clock size={16} className="text-yellow-500" />,
  active:  <MessageSquare size={16} className="text-green-500" />,
  closed:  <CheckCircle size={16} className="text-gray-400" />,
};

const statusLabel = {
  pending: "Waiting for doctor",
  active:  "In progress",
  closed:  "Closed",
};

export default function MyConsultations() {
  const { auth }  = useAuth();
  const navigate  = useNavigate();
  const [list, setList]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyConsultations(auth.token).then((d) => {
      setList(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare size={26} className="text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-800">My Consultations</h1>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading...</div>
      ) : list.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-3 text-gray-300" />
          <p>No consultations yet.</p>
          <button onClick={() => navigate("/my-reports")}
            className="mt-4 text-blue-600 text-sm hover:underline">
            Request one from My Reports →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map((c) => (
            <div key={c._id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  {statusIcon[c.status]}
                  <div>
                    <p className="font-semibold text-gray-800">{statusLabel[c.status]}</p>
                    {c.doctorId ? (
                      <p className="text-sm text-gray-500">
                        Dr. {c.doctorId.name} — {c.doctorId.specialization}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">Awaiting doctor assignment</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Report summary */}
              {c.reportId && (
                <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500">Report: </span>
                  <span className={`font-semibold ${
                    c.reportId.prediction === "High Risk" ? "text-red-600" :
                    c.reportId.prediction === "Moderate Risk" ? "text-yellow-600" : "text-green-600"
                  }`}>{c.reportId.prediction}</span>
                  <span className="text-gray-500 ml-2">
                    ({new Date(c.reportId.createdAt).toLocaleDateString()})
                  </span>
                </div>
              )}

              {/* Patient note */}
              {c.patientNote && (
                <p className="mt-2 text-sm text-gray-500 italic">Note: {c.patientNote}</p>
              )}

              {/* Prescription */}
              {c.prescription && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-sm font-semibold text-green-800 flex items-center gap-2 mb-1">
                    <ClipboardList size={14} /> Doctor's Prescription
                  </p>
                  <p className="text-sm text-green-700 whitespace-pre-wrap">{c.prescription}</p>
                </div>
              )}

              {/* Chat button — active and closed both */}
              {(c.status === "active" || c.status === "closed") && (
                <button
                  onClick={() => navigate(`/consultation/${c._id}`)}
                  className={`mt-4 text-sm px-4 py-2 flex items-center gap-2 w-fit rounded-xl font-medium transition ${
                    c.status === "closed"
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
                      : "btn-primary"
                  }`}>
                  <MessageSquare size={14} />
                  {c.status === "closed" ? "View Conversation" : "Open Chat"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
