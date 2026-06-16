import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import ReactMarkdown from "react-markdown"
export default function Chatbot() {
    const endRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
    useEffect(()=>{
        endRef.current?.scrollIntoView({
            behaviour:"smooth"
        });
    },[chat])
  const sendMessage = async () => {

    if (!message.trim()) return;

    const userMessage = {
      sender: "user",
      text: message
    };

    setChat((prev) => [...prev, userMessage]);

    try {

      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message
        })
      });

      const data = await res.json();

      const botMessage = {
        sender: "bot",
        text: data.response
      };

      setChat((prev) => [...prev, botMessage]);

    } catch (error) {

      setChat((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Server error. Please try again."
        }
      ]);
    }

    setMessage("");
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl z-50 transition-all"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border">

          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-lg">
                AI Health Assistant
              </h2>
              <p className="text-sm opacity-80">
                Maternal & Infant Care Support
              </p>
            </div>

            <button onClick={() => setIsOpen(false)}>
              <X size={22} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">

            {chat.length === 0 && (
              <div className="text-gray-500 text-sm text-center mt-10">
                Ask me about maternal health, infant risk,
                nutrition, or healthcare advice.
              </div>
            )}

            {chat.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 flex ${
                  msg.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 rounded-bl-sm"
                  }`}
                >
                    <ReactMarkdown>
                  {msg.text}
                    </ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={endRef}/>
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-white flex gap-2">

            <input
              type="text"
              className="flex-1 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ask something..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />

            <button
              onClick={sendMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition"
            >
              <Send size={18} />
            </button>

          </div>
        </div>
      )}
    </>
  );
}