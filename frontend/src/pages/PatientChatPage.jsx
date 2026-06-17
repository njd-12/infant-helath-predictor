import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, ClipboardList, Lock, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../context/AuthContext";
import { getMessages, sendMessage, getConsultation, downloadPrescriptionPDF } from "../api/auth";

export default function PatientChatPage() {
  const { id }   = useParams();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const endRef   = useRef(null);

  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [text, setText]                 = useState("");
  const [sending, setSending]           = useState(false);
  const [downloading, setDownloading]   = useState(false);

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

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadPrescriptionPDF(auth.token, id);
    } catch (e) {
      alert("Failed to download prescription.");
    } finally {
      setDownloading(false);
    }
  };

  const doctor   = consultation?.doctorId;
  const isClosed = consultation?.status === "closed";

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col h-[calc(100vh-64px)]">

      {/* Header */}
      <div className="card p-4 mb-3 flex items-center gap-3">
        <button onClick={() => navigate("/my-consultations")}
          className="text-gray-500 hover:text-blue-600">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          {doctor ? (
            <>
              <p className="font-semibold text-gray-800">Dr. {doctor.name}</p>
              <p className="text-sm text-gray-500">{doctor.specialization || "General Physician"}</p>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Loading...</p>
          )}
        </div>
        {isClosed ? (
          <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full border">
            <Lock size={11} /> Closed
          </span>
        ) : (
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-300">
            Active
          </span>
        )}
      </div>

      {/* Prescription — shown always once given */}
      {consultation?.prescription && (
        <div className="card p-4 mb-3 bg-green-50 border-green-200">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-green-800 flex items-center gap-2">
              <ClipboardList size={15} /> Doctor's Prescription
            </p>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-60 transition"
            >
              <Download size={13} />
              {downloading ? "Generating..." : "Download PDF"}
            </button>
          </div>
          <p className="text-sm text-green-700 whitespace-pre-wrap">{consultation.prescription}</p>
        </div>
      )}

      {/* Messages */}
      <div className="card flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3 mb-3">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-10">
            {isClosed
              ? "No messages were exchanged in this consultation."
              : "Waiting for the doctor to respond..."}
          </p>
        ) : (
          messages.map((m) => (
            <div key={m._id}
              className={`flex ${m.senderRole === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow ${
                m.senderRole === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white text-gray-800 rounded-bl-sm border"
              }`}>
                {m.senderRole === "doctor" && (
                  <p className="text-xs text-blue-500 font-medium mb-1">Dr. {doctor?.name}</p>
                )}
                <ReactMarkdown>{m.text}</ReactMarkdown>
                <p className={`text-xs mt-1 ${m.senderRole === "user" ? "text-blue-200" : "text-gray-400"}`}>
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
            placeholder="Ask the doctor something..."
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
          Consultation closed by doctor — full conversation saved above
        </div>
      )}
    </div>
  );
}
