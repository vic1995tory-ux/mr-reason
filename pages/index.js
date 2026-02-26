import { useEffect, useMemo, useRef, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const typingSound = useRef(null);
  const bottomRef = useRef(null);

  // --- Hero animation states
  const [showH1, setShowH1] = useState(false);
  const [showL2, setShowL2] = useState(false);
  const [showL3, setShowL3] = useState(false);
  const [showGiggles, setShowGiggles] = useState(false);

  // 3 "ыхы хы" shapes positions (random-ish but stable per page load)
  const giggles = useMemo(() => {
    // inside hero card
    const items = [0, 1, 2].map((i) => {
      const top = 20 + Math.random() * 55; // %
      const left = 8 + Math.random() * 72; // %
      const delay = Math.random() * 0.8; // seconds
      const blink = 0.7 + Math.random() * 0.9; // seconds
      return { id: i, top, left, delay, blink };
    });
    return items;
  }, []);

  // HERO: sequence H1 -> line2 -> line3, with 0.2s gaps
  useEffect(() => {
    const t1 = setTimeout(() => setShowH1(true), 200);
    const t2 = setTimeout(() => setShowL2(true), 200 + 900 + 200); // after H1 fade + gap
    const t3 = setTimeout(() => setShowL3(true), 200 + 900 + 200 + 650 + 200); // after L2 fade + gap

    // start giggles after line2 starts showing
    const tgOn = setTimeout(() => setShowGiggles(true), 200 + 900 + 200 + 150);
    // keep giggles ~4s from first appearance
    const tgOff = setTimeout(() => setShowGiggles(false), 200 + 900 + 200 + 150 + 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tgOn);
      clearTimeout(tgOff);
    };
  }, []);

  // Autoscroll to bottom
  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages, loading]);

  async function startTypingSound() {
    const a = typingSound.current;
    if (!a) return;
    try {
      a.volume = 0.75; // громче
      a.currentTime = 0;
      await a.play(); // может быть заблокировано — это ок
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

    // важно: play() должен быть от user action (Enter/Click)
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
    <>
      <style jsx global>{`
        /* ---- Fix "white frame" ---- */
        html,
        body,
        #__next {
          height: 100%;
          margin: 0;
          background: #1e1e1e;
        }

        * {
          box-sizing: border-box;
        }

        /* Hide scrollbar but keep scroll */
        .chatScroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .chatScroll::-webkit-scrollbar {
          width: 0;
          height: 0;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
            filter: blur(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes softFloat {
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

        @keyframes blinkDot {
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

        .dot {
          animation: blinkDot 1.2s infinite both;
        }
        .dot:nth-child(2) {
          animation-delay: 0.18s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.36s;
        }

        /* Garland blink for giggles */
        @keyframes garland {
          0%,
          100% {
            opacity: 0.15;
            transform: translateY(0);
          }
          50% {
            opacity: 0.95;
            transform: translateY(-1px);
          }
        }

        /* Prevent iOS zoom on focus */
        input,
        textarea {
          font-size: 16px;
        }
      `}</style>

      {/* typing audio */}
      <audio
        ref={typingSound}
        src="https://cdn.pixabay.com/audio/2022/03/15/audio_6b1b6e3b0f.mp3"
        preload="auto"
        playsInline
      />

      <div style={styles.page}>
        <div style={styles.wrap}>
          {/* HERO CARD */}
          <div style={styles.hero}>
            <div style={styles.heroText}>
              <h1 style={{ ...styles.h1, ...(showH1 ? styles.appear : styles.hidden) }}>
                Mr. Reason!
              </h1>

              <p style={{ ...styles.line, ...(showL2 ? styles.appear2 : styles.hidden) }}>
                Мой любимый человек Реваз! С днём рождения.
              </p>

              <p style={{ ...styles.line, ...(showL3 ? styles.appear3 : styles.hidden) }}>
                Это мой изощрённый способ порадовать тебя.
              </p>
            </div>

            {/* LOGO / ART */}
            {/* Если у тебя PNG будет лежать в /public/logo.png, то src="/logo.png" */}
            <div style={styles.logoBox}>
              <img
                src="/logo.png"
                alt="logo"
                style={styles.logoImg}
                onError={(e) => {
                  // если логотип не найден — просто прячем, чтобы не ломать верстку
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            {/* 3 "ыхы хы" shapes - appear after line2 and blink ~4s */}
            {showGiggles &&
              giggles.map((g) => (
                <div
                  key={g.id}
                  style={{
                    ...styles.giggle,
                    top: `${g.top}%`,
                    left: `${g.left}%`,
                    animation: `garland ${g.blink}s ease-in-out ${g.delay}s infinite`,
                  }}
                >
                  ыхы хы
                </div>
              ))}
          </div>

          {/* CHAT CARD */}
          <div style={styles.card}>
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

            {/* INPUT pinned with safe-area */}
            <div style={styles.inputRow}>
              <input
                style={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Напиши…"
              />
              <button style={styles.button} onClick={send}>
                Отправить
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive tweaks via inline <style> (works in this single file) */}
      <style jsx>{`
        @media (max-width: 860px) {
          :global(body) {
            background: #1e1e1e;
          }
        }
      `}</style>
    </>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "#1E1E1E",
    display: "flex",
    justifyContent: "center",
    padding: 18,
  },

  wrap: {
    width: "100%",
    maxWidth: 980,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  hero: {
    position: "relative",
    width: "100%",
    padding: 26,
    borderRadius: 26,
    background: "rgba(25, 28, 35, 0.78)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
    backdropFilter: "blur(18px)",
    overflow: "hidden",
    animation: "softFloat 8s ease-in-out infinite",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  heroText: {
    minWidth: 0,
    flex: 1,
  },

  h1: {
    margin: 0,
    color: "#fff",
    fontSize: 54,
    lineHeight: 1.05,
    letterSpacing: -0.8,
  },

  line: {
    margin: "10px 0 0 0",
    color: "rgba(255,255,255,0.78)",
    fontSize: 16,
    lineHeight: 1.35,
    maxWidth: 520,
  },

  hidden: {
    opacity: 0,
    transform: "translateY(10px)",
    filter: "blur(2px)",
  },

  appear: {
    animation: "fadeUp 0.9s ease forwards",
  },

  appear2: {
    animation: "fadeUp 0.65s ease forwards",
  },

  appear3: {
    animation: "fadeUp 0.65s ease forwards",
  },

  logoBox: {
    width: 230,
    height: 120,
    borderRadius: 18,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    overflow: "hidden",
    flexShrink: 0,
  },

  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.9,
  },

  giggle: {
    position: "absolute",
    padding: "10px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(245,200,66,0.25)",
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    backdropFilter: "blur(10px)",
    pointerEvents: "none",
    userSelect: "none",
  },

  card: {
    width: "100%",
    borderRadius: 26,
    background: "rgba(25, 28, 35, 0.82)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    // IMPORTANT: not too tall on mobile (we handle via viewport units below)
    height: "min(62dvh, 680px)",
  },

  header: {
    padding: 22,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: 650,
    margin: 0,
  },

  subtitle: {
    color: "rgba(255,255,255,0.6)",
    marginTop: 8,
    marginBottom: 0,
    fontSize: 14,
    lineHeight: 1.4,
  },

  chat: {
    flex: 1,
    padding: 18,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  msg: {
    display: "flex",
  },

  bubble: {
    maxWidth: "78%",
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    lineHeight: 1.45,
    fontSize: 15,
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "pre-wrap",
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
    gap: 10,
    padding: "14px 14px calc(14px + env(safe-area-inset-bottom)) 14px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(10,12,16,0.25)",
  },

  input: {
    flex: 1,
    background: "#0f1116",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 14,
    padding: "12px 14px",
    color: "#fff",
    outline: "none",
  },

  button: {
    background: "#f5c842",
    border: "none",
    borderRadius: 14,
    padding: "0 16px",
    color: "#111",
    fontWeight: 700,
    cursor: "pointer",
    minWidth: 110,
  },
};
