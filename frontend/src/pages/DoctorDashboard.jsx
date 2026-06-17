import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, User, CheckCircle, Clock, MessageSquare, History } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getDoctorDashboard, acceptConsultation } from "../api/auth";

const statusColor = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  active:  "bg-green-100  text-green-700  border-green-300",
  closed:  "bg-gray-100   text-gray-500   border-gray-300",
};

const riskColor = {
  "High Risk":     "text-red-600 font-semibold",
  "Moderate Risk": "text-yellow-600 font-semibold",
  "Low Risk":      "text-green-600 font-semibold",
};

export default function DoctorDashboard() {
  const { auth } = useAuth();
  const navigate  = useNavigate();
  const [list, setList]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [tab, setTab]             = useState("active"); // "active" | "closed"

  const load = async () => {
    setLoading(true);
    const data = await getDoctorDashboard(auth.token);
    setList(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAccept = async (id) => {
    setAccepting(id);
    await acceptConsultation(auth.token, id);
    await load();
    setAccepting(null);
  };

  const pending = list.filter((c) => c.status === "pending");
  const active  = list.filter((c) => c.status === "active");
  const closed  = list.filter((c) => c.status === "closed");

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-100 p-3 rounded-xl">
          <Stethoscope size={28} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Doctor Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome, Dr. {auth.user.name}</p>
        </div>
        <button onClick={load}
          className="ml-auto text-sm text-blue-600 border border-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-50">
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5 flex items-center gap-4">
          <Clock size={28} className="text-yellow-500" />
          <div>
            <p className="text-2xl font-bold">{pending.length}</p>
            <p className="text-gray-500 text-sm">Pending</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <MessageSquare size={28} className="text-green-500" />
          <div>
            <p className="text-2xl font-bold">{active.length}</p>
            <p className="text-gray-500 text-sm">Active</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <History size={28} className="text-gray-400" />
          <div>
            <p className="text-2xl font-bold">{closed.length}</p>
            <p className="text-gray-500 text-sm">Closed</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {["active", "closed"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 px-4 text-sm font-medium capitalize transition border-b-2 ${
              tab === t
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t === "active" ? `Active & Pending (${pending.length + active.length})` : `History (${closed.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-16">Loading...</div>
      ) : tab === "active" ? (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock size={18} className="text-yellow-500" /> Pending Requests
              </h2>
              <div className="flex flex-col gap-4">
                {pending.map((c) => (
                  <ConsultationCard key={c._id} c={c}
                    onAccept={() => handleAccept(c._id)}
                    accepting={accepting === c._id}
                    riskColor={riskColor} statusColor={statusColor} />
                ))}
              </div>
            </section>
          )}

          {/* Active */}
          {active.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MessageSquare size={18} className="text-green-500" /> Active Consultations
              </h2>
              <div className="flex flex-col gap-4">
                {active.map((c) => (
                  <ConsultationCard key={c._id} c={c}
                    onChat={() => navigate(`/doctor/chat/${c._id}`)}
                    riskColor={riskColor} statusColor={statusColor} />
                ))}
              </div>
            </section>
          )}

          {pending.length === 0 && active.length === 0 && (
            <div className="card p-12 text-center text-gray-400">
              <CheckCircle size={40} className="mx-auto mb-3 text-gray-300" />
              <p>No active consultation requests.</p>
            </div>
          )}
        </>
      ) : (
        /* Closed / History tab */
        <>
          {closed.length === 0 ? (
            <div className="card p-12 text-center text-gray-400">
              <History size={40} className="mx-auto mb-3 text-gray-300" />
              <p>No closed consultations yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {closed.map((c) => (
                <ConsultationCard key={c._id} c={c}
                  onChat={() => navigate(`/doctor/chat/${c._id}`)}
                  riskColor={riskColor} statusColor={statusColor}
                  isHistory />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ConsultationCard({ c, onAccept, onChat, accepting, riskColor, statusColor, isHistory }) {
  const patient = c.userId;
  const report  = c.reportId;
  const date    = new Date(c.createdAt).toLocaleDateString();

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="bg-blue-50 p-2 rounded-full">
            <User size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{patient?.name}</p>
            <p className="text-sm text-gray-500">{patient?.email}</p>
            {patient?.phone && <p className="text-sm text-gray-500">{patient.phone}</p>}
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xs px-2 py-1 rounded-full border ${statusColor[c.status]}`}>
            {c.status}
          </span>
          <p className="text-xs text-gray-400 mt-1">{date}</p>
        </div>
      </div>

      {/* Risk info */}
      {report && (
        <div className="mt-4 bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Risk Level: </span>
            <span className={riskColor[report.prediction] || "font-semibold"}>{report.prediction}</span>
          </div>
          <div>
            <span className="text-gray-500">Risk Score: </span>
            <span className="font-medium">{Math.round(report.riskOfDeath * 100)}%</span>
          </div>
        </div>
      )}

      {/* Patient note */}
      {c.patientNote && (
        <div className="mt-3 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-100">
          <span className="font-medium text-blue-700">Patient Note: </span>
          {c.patientNote}
        </div>
      )}

      {/* Top factors */}
      {report?.topFactors?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Key Risk Factors:</p>
          <div className="flex flex-wrap gap-2">
            {report.topFactors.slice(0, 3).map((f, i) => (
              <span key={i} className={`text-xs px-2 py-1 rounded-full border ${
                f.direction === "Increased Risk"
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "bg-green-50 border-green-200 text-green-600"
              }`}>{f.feature}</span>
            ))}
          </div>
        </div>
      )}

      {/* Prescription preview on closed */}
      {c.status === "closed" && c.prescription && (
        <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-green-800 mb-1">Prescription Given:</p>
          <p className="text-xs text-green-700 line-clamp-2">{c.prescription}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        {c.status === "pending" && onAccept && (
          <button onClick={onAccept} disabled={accepting}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
            <CheckCircle size={15} />
            {accepting ? "Accepting..." : "Accept & Start"}
          </button>
        )}
        {(c.status === "active" || c.status === "closed") && onChat && (
          <button onClick={onChat}
            className={`text-sm px-4 py-2 flex items-center gap-2 rounded-xl font-medium transition ${
              c.status === "closed"
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
                : "btn-primary"
            }`}>
            {c.status === "closed" ? <History size={15} /> : <MessageSquare size={15} />}
            {c.status === "closed" ? "View Conversation" : "Open Chat"}
          </button>
        )}
      </div>
    </div>
  );
}
