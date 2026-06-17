import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, ClipboardList, CheckCircle, Lock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../context/AuthContext";
import { getMessages, sendMessage, sendPrescription, getConsultation } from "../api/auth";

export default function DoctorChatPage() {
  const { id }   = useParams();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const endRef   = useRef(null);

  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [text, setText]                 = useState("");
  const [prescription, setPrescription] = useState("");
  const [showRx, setShowRx]             = useState(false);
  const [sending, setSending]           = useState(false);
  const [rxSending, setRxSending]       = useState(false);
  const [success, setSuccess]           = useState("");

  const loadAll = async () => {
    const [c, msgs] = await Promise.all([
      getConsultation(auth.token, id),
      getMessages(auth.token, id),
    ]);
    setConsultation(c);
    setMessages(Array.isArray(msgs) ? msgs : []);
  };

  useEffect(() => { loadAll(); }, [id]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Poll every 4s only when active
  useEffect(() => {
    if (consultation?.status === "closed") return;
    const t = setInterval(() => loadAll(), 4000);
    return () => clearInterval(t);
  }, [id, consultation?.status]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    await sendMessage(auth.token, id, text);
    setText("");
    await loadAll();
    setSending(false);
  };

  const handlePrescription = async () => {
    if (!prescription.trim()) return;
    setRxSending(true);
    await sendPrescription(auth.token, id, prescription);
    setSuccess("Prescription sent. Consultation is now closed.");
    setShowRx(false);
    setPrescription("");
    await loadAll();
    setRxSending(false);
  };

  const report   = consultation?.reportId;
  const patient  = consultation?.userId;
  const isClosed = consultation?.status === "closed";

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col h-[calc(100vh-64px)]">

      {/* Header */}
      <div className="card p-4 mb-3 flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate("/doctor/dashboard")}
          className="text-gray-500 hover:text-blue-600">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{patient?.name}</p>
          <p className="text-sm text-gray-500 truncate">{patient?.email}</p>
        </div>
        {report && (
          <div className="text-right text-sm shrink-0">
            <span className={`font-semibold ${
              report.prediction === "High Risk" ? "text-red-600" :
              report.prediction === "Moderate Risk" ? "text-yellow-600" : "text-green-600"
            }`}>{report.prediction}</span>
            <p className="text-gray-400 text-xs">Risk: {Math.round(report.riskOfDeath * 100)}%</p>
          </div>
        )}
        {isClosed ? (
          <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full border">
            <Lock size={11} /> Closed
          </span>
        ) : (
          <button onClick={() => setShowRx(!showRx)}
            className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 shrink-0">
            <ClipboardList size={14} />
            Prescribe & Close
          </button>
        )}
      </div>

      {/* Prescription writer */}
      {showRx && !isClosed && (
        <div className="card p-4 mb-3 border-green-200 bg-green-50">
          <p className="font-semibold text-green-800 mb-2 flex items-center gap-2">
            <ClipboardList size={16} /> Write Prescription / Advice
          </p>
          <textarea rows={4}
            placeholder="Write prescriptions, medications, dietary advice, follow-up instructions..."
            className="input resize-none text-sm bg-white"
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
          />
          <div className="flex gap-2 mt-3">
            <button onClick={handlePrescription} disabled={rxSending}
              className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
              <CheckCircle size={14} />
              {rxSending ? "Closing..." : "Send Prescription & Close"}
            </button>
            <button onClick={() => setShowRx(false)}
              className="text-sm text-gray-500 border px-4 py-2 rounded-xl hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-300 text-green-700 text-sm p-3 rounded-xl mb-3 flex items-center gap-2">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* Prescription display */}
      {consultation?.prescription && (
        <div className="card p-4 mb-3 bg-green-50 border-green-200">
          <p className="font-semibold text-green-800 flex items-center gap-2 mb-1">
            <ClipboardList size={15} /> {isClosed ? "Prescription Given" : "Draft Prescription"}
          </p>
          <p className="text-sm text-green-700 whitespace-pre-wrap">{consultation.prescription}</p>
        </div>
      )}

      {/* Messages */}
      <div className="card flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3 mb-3">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-10">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m._id}
              className={`flex ${m.senderRole === "doctor" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow ${
                m.senderRole === "doctor"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white text-gray-800 rounded-bl-sm border"
              }`}>
                {m.senderRole === "user" && (
                  <p className="text-xs text-gray-400 font-medium mb-1">{patient?.name}</p>
                )}
                <ReactMarkdown>{m.text}</ReactMarkdown>
                <p className={`text-xs mt-1 ${m.senderRole === "doctor" ? "text-blue-200" : "text-gray-400"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Input or closed notice */}
      {!isClosed ? (
        <div className="flex gap-2">
          <input className="input flex-1"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <button onClick={handleSend} disabled={sending}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition">
            <Send size={18} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
          <Lock size={14} />
          Consultation closed — conversation saved above
        </div>
      )}
    </div>
  );
}
