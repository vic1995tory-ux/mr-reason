// pages/index.js
import { useEffect, useMemo, useRef, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const typingSound = useRef(null);
  const bottomRef = useRef(null);

  // 3 "ыхы хы" как отдельные шейпы: появляются после второй строки и живут ~4с
  const [showHihi, setShowHihi] = useState(false);
  const [hihi, setHihi] = useState([
    { x: 0.18, y: 0.45, a: 0.9 },
    { x: 0.45, y: 0.55, a: 0.9 },
    { x: 0.72, y: 0.42, a: 0.9 },
  ]);

  useEffect(() => {
    // тайминг появления: H1 -> (0.2s) H2 -> (0.2s) H3, после H2 включаем "ыхы хы"
    const t = setTimeout(() => {
      setShowHihi(true);

      // рандом как гирлянда (слегка дергаем позиции/прозрачность)
      const iv = setInterval(() => {
        setHihi((prev) =>
          prev.map((p) => ({
            x: clamp(p.x + rand(-0.03, 0.03), 0.08, 0.86),
            y: clamp(p.y + rand(-0.03, 0.03), 0.22, 0.82),
            a: clamp(p.a + rand(-0.15, 0.15), 0.5, 1),
          }))
        );
      }, 220);

      // выключить через ~4 секунды от первого появления
      const off = setTimeout(() => {
        clearInterval(iv);
        setShowHihi(false);
      }, 4000);

      return () => {
        clearInterval(iv);
        clearTimeout(off);
      };
    }, 900); // появляется после второй строки (под нашу анимацию ниже)

    return () => clearTimeout(t);
  }, []);

  // автоскролл к последнему сообщению
  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages, loading]);

  async function startTypingSound() {
    const a = typingSound.current;
    if (!a) return;
    try {
      a.volume = 0.7;
      a.currentTime = 0;
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
    await startTypingSound();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      setMessages((m) => [...m, { role: "assistant", content: data.reply || "…" }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Ошибка. Попробуй ещё раз." }]);
    } finally {
      setLoading(false);
      stopTypingSound();
    }
  }

  return (
    <div style={styles.page}>
      <style jsx global>{`
        /* ✅ Вернуть “тот шрифт” и закрепить его везде */
        html,
        body {
          height: 100%;
        }
        body {
          margin: 0;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          background: #1e1e1e;
          color: #fff;
        }
        h1,
        h2,
        h3,
        p,
        input,
        button {
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif !important;
        }

        /* ✅ iOS zoom на фокусе инпута: не будет, если font-size >= 16px */
        input {
          font-size: 16px !important;
        }

        /* Скрыть скроллбар, но оставить скролл */
        .chatScroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .chatScroll::-webkit-scrollbar {
          width: 0;
          height: 0;
        }

        /* Плавные появления (дольше + пауза 0.2с между строками) */
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        .h1 {
          opacity: 0;
          animation: fadeUp 0.8s ease forwards;
          animation-delay: 0.0s;
        }
        .h2 {
          opacity: 0;
          animation: fadeUp 0.9s ease forwards;
          animation-delay: 0.2s;
        }
        .h3 {
          opacity: 0;
          animation: fadeUp 0.9s ease forwards;
          animation-delay: 0.4s;
        }

        /* “ыхы хы” мерцание — замедлить */
        @keyframes slowBlink {
          0% {
            opacity: 0.25;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-1px);
          }
          100% {
            opacity: 0.25;
            transform: translateY(0);
          }
        }
        .hihiShape {
          position: absolute;
          padding: 10px 14px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.09);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
          letter-spacing: 0.2px;
          animation: slowBlink 1.9s ease-in-out infinite; /* ✅ медленнее */
          user-select: none;
          pointer-events: none;
          white-space: nowrap;
        }

        /* “typing...” точки */
        .dot {
          animation: blink 1.6s infinite both;
        }
        .dot:nth-child(2) {
          animation-delay: 0.25s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.5s;
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

        /* ✅ Мобилка: кнопка всегда помещается в рамку + удобный низ */
        @media (max-width: 520px) {
          .inputRow {
            flex-direction: column;
            gap: 10px;
            padding-bottom: calc(16px + env(safe-area-inset-bottom));
          }
          .sendBtn {
            width: 100%;
            height: 46px;
          }
          .textInput {
            width: 100%;
            height: 46px;
          }
          .chatCard {
            height: min(74vh, 620px); /* ✅ короче, чтобы поле ввода было удобно */
          }
          .heroCard {
            padding: 18px 18px 16px 18px;
          }
          .heroLogo {
            width: 120px !important;
            right: 14px !important;
            top: 18px !important;
            transform: none !important;
          }
        }
      `}</style>

      <audio
        ref={typingSound}
        src="https://cdn.pixabay.com/audio/2022/03/15/audio_6b1b6e3b0f.mp3"
        preload="auto"
        playsInline
      />

      {/* HERO */}
      <div style={styles.wrap}>
        <div style={styles.heroCard} className="heroCard">
          {/* ✅ Логотип не в рамке: просто элемент внутри hero */}
          <img src="/logo.png" alt="logo" className="heroLogo" style={styles.heroLogo} />

          <h1 className="h1" style={styles.heroTitle}>
            Mr. Reason!
          </h1>
          <p className="h2" style={styles.heroText}>
            Мой любимый человек Реваз! С днём рождения.
          </p>
          <p className="h3" style={styles.heroText}>
            Это мой изощрённый способ порадовать тебя.
          </p>

          {/* 3 отдельные шейпы “ыхы хы”, появляются после 2-й строки */}
          {showHihi &&
            hihi.map((p, idx) => (
              <div
                key={idx}
                className="hihiShape"
                style={{
                  left: `${p.x * 100}%`,
                  top: `${p.y * 100}%`,
                  opacity: p.a,
                }}
              >
                ыхы хы
              </div>
            ))}
        </div>

        {/* CHAT */}
        <div style={styles.card} className="chatCard">
          <div style={styles.header}>
            <h2 style={styles.title}>Для Реваза</h2>
            <p style={styles.subtitle}>
              Можно сказать, что это зеркало. Отражение тебя, которое тебе понравится.
            </p>
          </div>

          <div style={styles.chat} className="chatScroll">
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  ...styles.msg,
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{ ...styles.bubble, ...(m.role === "user" ? styles.user : {}) }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ ...styles.msg, justifyContent: "flex-start" }}>
                <div style={{ ...styles.bubble, ...styles.typing }}>
                  печатает<span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ✅ кнопка и инпут не вылезают на iPhone: на мобилке стек, на десктопе ряд */}
          <div style={styles.inputRow} className="inputRow">
            <input
              className="textInput"
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Напиши..."
              inputMode="text"
            />
            <button className="sendBtn" style={styles.button} onClick={send}>
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- styles ---------- */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#1E1E1E",
    display: "flex",
    justifyContent: "center",
    padding: 24,
  },
  wrap: {
    width: "100%",
    maxWidth: 980,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  heroCard: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    borderRadius: 26,
    padding: "26px 28px 22px 28px",
    background: "rgba(25, 28, 35, 0.78)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    minHeight: 150,
  },

  heroLogo: {
    position: "absolute",
    right: 26,
    top: "50%",
    transform: "translateY(-50%)",
    width: 180,
    opacity: 0.95,
    pointerEvents: "none",
  },

  heroTitle: {
    margin: 0,
    fontSize: 56,
    lineHeight: 1.02,
    letterSpacing: -0.6,
  },

  heroText: {
    margin: "10px 0 0 0",
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    lineHeight: 1.45,
    maxWidth: 560,
  },

  card: {
    width: "100%",
    borderRadius: 26,
    background: "rgba(25, 28, 35, 0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "78vh", // ✅ чуть выше, чем было (но мобилка переопределит)
  },

  header: {
    padding: 24,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  title: {
    margin: 0,
    color: "#fff",
    fontSize: 28,
    fontWeight: 700,
  },

  subtitle: {
    margin: "8px 0 0 0",
    color: "rgba(255,255,255,0.65)",
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
    marginBottom: 10,
  },

  bubble: {
    maxWidth: "78%",
    padding: "12px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    lineHeight: 1.45,
    fontSize: 15,
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    wordBreak: "break-word",
  },

  user: {
    background: "linear-gradient(135deg, #f5c842, #f7d774)",
    color: "#111",
    border: "none",
  },

  typing: {
    opacity: 0.7,
    fontStyle: "italic",
  },

  inputRow: {
    display: "flex",
    gap: 12,
    padding: 16,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    alignItems: "center",
    paddingBottom: "calc(16px + env(safe-area-inset-bottom))", // ✅ низ под айфоны
  },

  input: {
    flex: 1,
    height: 46,
    background: "#0f1116",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: "0 14px",
    color: "#fff",
    outline: "none",
  },

  button: {
    height: 46,
    background: "#f5c842",
    border: "none",
    borderRadius: 14,
    padding: "0 18px",
    color: "#111",
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0, // ✅ чтобы не вылезало, а сжимало инпут
    minWidth: 130,
  },
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
