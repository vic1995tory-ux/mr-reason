import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const typingSound = useRef(null);
  const bottomRef = useRef(null);

  // Определяем мобилку по ширине
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 520);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Надёжный автоскролл: всегда прокручиваем к "якорю" внизу
  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages, loading]);

  async function startTypingSound() {
    const a = typingSound.current;
    if (!a) return;

    try {
      a.volume = 0.5; // сделай 1.0 если хочешь громче
      a.currentTime = 0;

      // иногда iOS/Chrome требуют явного "разрешения" после первого клика
      // play() может быть заблокирован — это нормально
      await a.play();
    } catch (_) {}
  }

  function stopTypingSound() {
    const a = typingSound.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch (_) {}
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    // ВАЖНО: старт звука должен быть внутри user action (Enter/Click)
    await startTypingSound();

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
      stopTypingSound();
    }
  }

  const s = getStyles(isMobile);

  return (
    <div style={s.container}>
      <style jsx global>{`
        /* Скрываем полосу прокрутки, но скролл остаётся */
        .chatScroll {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
        .chatScroll::-webkit-scrollbar {
          width: 0;
          height: 0;
        }

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

      {/* Аудио внутри return — ок. playsInline помогает на мобилках */}
      <audio
        ref={typingSound}
        src="https://cdn.pixabay.com/audio/2022/03/15/audio_6b1b6e3b0f.mp3"
        preload="auto"
        playsInline
      />

      <div style={s.card}>
        <div style={s.header}>
          <h2 style={s.title}>Для Реваза</h2>
          <p style={s.subtitle}>
            Можно сказать, что это зеркало. Отражение тебя, которое тебе
            понравится.
          </p>
        </div>

        <div style={s.chat} className="chatScroll">
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...s.msg,
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div style={{ ...s.bubble, ...(m.role === "user" ? s.user : {}) }}>
                {m.content}
              </div>
            </div>
          ))}

          {/* typing */}
          {loading && (
            <div style={{ ...s.msg, justifyContent: "flex-start" }}>
              <div style={{ ...s.bubble, ...s.typing }}>
                печатает<span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
              </div>
            </div>
          )}

          {/* Якорь для автоскролла */}
          <div ref={bottomRef} />
        </div>

        <div style={s.inputRow}>
          <input
            style={s.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Напиши..."
          />

          <button style={s.button} onClick={send}>
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}

const getStyles = (isMobile) => ({
  container: {
    minHeight: "100vh",
    background: "#1E1E1E",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: isMobile ? 12 : 24,
    fontFamily: "Inter, sans-serif",
    paddingTop: "max(12px, env(safe-area-inset-top))",
    paddingBottom: "max(12px, env(safe-area-inset-bottom))",
  },

  card: {
    width: "100%",
    maxWidth: isMobile ? 520 : 720,
    height: isMobile ? "92vh" : "85vh",
    background: "rgba(25, 28, 35, 0.85)",
    backdropFilter: "blur(20px)",
    borderRadius: isMobile ? 18 : 24,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    animation: isMobile ? "none" : "float 6s ease-in-out infinite",
  },

  header: {
    padding: isMobile ? 16 : 24,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  title: {
    color: "#fff",
    fontSize: isMobile ? 22 : 28,
    fontWeight: 600,
    margin: 0,
  },

  subtitle: {
    color: "#aaa",
    marginTop: 8,
    marginBottom: 0,
    fontSize: isMobile ? 13 : 14,
    lineHeight: 1.4,
  },

  chat: {
    flex: 1,
    padding: isMobile ? 14 : 24,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  msg: {
    display: "flex",
    marginBottom: 10,
    animation: "fadeIn 0.35s ease",
  },

  bubble: {
    maxWidth: isMobile ? "88%" : "75%",
    padding: isMobile ? "10px 12px" : "12px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    lineHeight: 1.4,
    fontSize: isMobile ? 14 : 15,
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.08)",
    wordBreak: "break-word",
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
    gap: 10,
    padding: isMobile ? 12 : 16,
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },

  input: {
    flex: 1,
    background: "#0f1116",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: isMobile ? "12px 12px" : "10px 14px",
    color: "#fff",
    outline: "none",
    fontSize: isMobile ? 16 : 15, // iOS: 16px чтобы не было авто-зума
  },

  button: {
    background: "#f5c842",
    border: "none",
    borderRadius: 12,
    padding: isMobile ? "0 14px" : "0 18px",
    height: isMobile ? 44 : "auto",
    color: "#111",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
});
