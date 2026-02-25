import { useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const typingSound = useRef(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    // старт звука
    try {
      typingSound.current?.play();
    } catch (_) {}

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply || "…" },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Ошибка. Попробуй ещё раз." },
      ]);
    } finally {
      setLoading(false);

      // стоп звука
      if (typingSound.current) {
        typingSound.current.pause();
        typingSound.current.currentTime = 0;
      }
    }
  }

  return (
    <div style={styles.container}>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        .dot {
          animation: blink 1.4s infinite both;
        }
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes blink {
          0% {
            opacity: 0.2;
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0.2;
          }
        }
      `}</style>

      {/* Аудио должно быть внутри return */}
      <audio
        ref={typingSound}
        src="https://cdn.pixabay.com/audio/2022/03/15/audio_6b1b6e3b0f.mp3"
        preload="auto"
      />

      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Для Реваза</h2>
          <p style={styles.subtitle}>
            Можно сказать, что это зеркало. Отражение тебя, которое тебе понравится.
          </p>
        </div>

        <div style={styles.chat}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.msg,
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  ...(m.role === "user" ? styles.user : {}),
                }}
              >
                {m.content}
              </div>
            </div>
          ))}

          {/* typing */}
          {loading && (
            <div style={{ ...styles.msg, justifyContent: "flex-start" }}>
              <div style={{ ...styles.bubble, ...styles.typing }}>
                печатает<span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
              </div>
            </div>
          )}
        </div>

        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Напиши..."
          />

          <button style={styles.button} onClick={send}>
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#1E1E1E", // фон как на Тильде
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    fontFamily: "Inter, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: 720,
    height: "85vh",
    background: "rgba(25, 28, 35, 0.85)",
    backdropFilter: "blur(20px)",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    animation: "float 6s ease-in-out infinite",
  },

  header: {
    padding: 24,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: 600,
    margin: 0,
  },

  subtitle: {
    color: "#aaa",
    marginTop: 8,
    marginBottom: 0,
    fontSize: 14,
    lineHeight: 1.4,
  },

  chat: {
    flex: 1,
    padding: 24,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  msg: {
    display: "flex",
    marginBottom: 12,
    animation: "fadeIn 0.4s ease",
  },

  bubble: {
    maxWidth: "75%",
    padding: "12px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    lineHeight: 1.4,
    fontSize: 15,
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  user: {
    background: "linear-gradient(135deg, #f5c842, #f7d774)",
    color: "#111",
    border: "none",
  },

  typing: {
    opacity: 0.6,
    fontStyle: "italic",
  },

  inputRow: {
    display: "flex",
    gap: 12,
    padding: 16,
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },

  input: {
    flex: 1,
    background: "#0f1116",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: "10px 14px",
    color: "#fff",
    outline: "none",
  },

  button: {
    background: "#f5c842",
    border: "none",
    borderRadius: 12,
    padding: "0 18px",
    color: "#111",
    fontWeight: 600,
    cursor: "pointer",
  },
};
