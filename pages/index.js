import { useEffect, useMemo, useRef, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // интро-каскад
  const [showH1, setShowH1] = useState(false);
  const [showH2, setShowH2] = useState(false);

  // гирлянда "ыхы хы"
  const [sparkles, setSparkles] = useState([]);
  const sparkleTimerRef = useRef(null);

  // звук печати
  const typingSound = useRef(null);

  // автоскролл к последнему сообщению
  const bottomRef = useRef(null);
  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages, loading]);

  // запускаем интро
  useEffect(() => {
    const t1 = setTimeout(() => setShowH1(true), 200);
    const t2 = setTimeout(() => setShowH2(true), 900); // H2 появляется позже

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // гирлянда работает только пока НЕ показали H2
  useEffect(() => {
    // стартуем только когда H1 уже есть, а H2 ещё нет
    if (!showH1 || showH2) return;

    // каждые N мс создаём "пачку" из 3 огоньков
    sparkleTimerRef.current = setInterval(() => {
      const now = Date.now();

      const newOnes = Array.from({ length: 3 }).map((_, idx) => {
        // рандомные позиции внутри hero (в процентах)
        const x = 10 + Math.random() * 80; // 10..90%
        const y = 25 + Math.random() * 55; // 25..80%
        // рандомная длительность "жизни"
        const life = 900 + Math.random() * 900; // 0.9..1.8s
        // рандомная задержка мигания
        const delay = Math.random() * 0.6;

        return {
          id: `${now}-${idx}-${Math.random().toString(16).slice(2)}`,
          x,
          y,
          life,
          delay,
        };
      });

      setSparkles((prev) => [...prev, ...newOnes]);

      // убираем устаревшие (чтобы не копились)
      setTimeout(() => {
        setSparkles((prev) => prev.filter((s) => now - parseInt(s.id.split("-")[0], 10) < 2500));
      }, 2600);
    }, 650);

    return () => {
      clearInterval(sparkleTimerRef.current);
      sparkleTimerRef.current = null;
    };
  }, [showH1, showH2]);

  // когда появляется H2 — мгновенно “гасим гирлянду”
  useEffect(() => {
    if (!showH2) return;
    clearInterval(sparkleTimerRef.current);
    sparkleTimerRef.current = null;
    setSparkles([]); // убрать “ыхы хы”
  }, [showH2]);

  async function startTypingSound() {
    const a = typingSound.current;
    if (!a) return;
    try {
      // IMPORTANT: на многих устройствах звук станет слышен ТОЛЬКО после явного клика/Enter
      a.volume = 0.9; // сделала громче
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
        /* скрываем скроллбар, но скролл остаётся */
        .chatScroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .chatScroll::-webkit-scrollbar {
          width: 0;
          height: 0;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes blinkSoft {
          0% { opacity: .15; transform: translateY(0); }
          25% { opacity: 1; }
          50% { opacity: .35; transform: translateY(-1px); }
          75% { opacity: 1; }
          100% { opacity: .15; transform: translateY(0); }
        }

        .sparkle {
          position: absolute;
          font-weight: 700;
          letter-spacing: 0.3px;
          opacity: 0;
          animation:
            fadeUp .35s ease forwards,
            blinkSoft 1.25s ease-in-out infinite;
          pointer-events: none;
          user-select: none;
          text-shadow: 0 8px 30px rgba(0,0,0,.55);
        }

        .h1In {
          animation: fadeUp .55s ease forwards;
        }
        .h2In {
          animation: fadeUp .55s ease forwards;
        }

        /* на мобилке делаем всё компактнее */
        @media (max-width: 520px) {
          .heroWrap { padding: 18px !important; border-radius: 18px !important; }
          .heroTitle { font-size: 30px !important; }
          .heroSub { font-size: 14px !important; }
          .cardWrap { height: 78vh !important; border-radius: 18px !important; }
        }
      `}</style>

      {/* звук (важно: браузер может блокировать автозвук, но после первого Enter/клика обычно ок) */}
      <audio
        ref={typingSound}
        src="https://cdn.pixabay.com/audio/2022/03/15/audio_6b1b6e3b0f.mp3"
        preload="auto"
        playsInline
      />

      {/* HERO / Обложка */}
      <div style={styles.hero} className="heroWrap">
        {/* фон можно заменить, если захочешь */}
        <div style={styles.heroBg} />

        {/* логотип */}
        <img src="/logo.png" alt="logo" style={styles.logo} />

        {/* H1 */}
        <h1
          className={showH1 ? "h1In heroTitle" : "heroTitle"}
          style={{ ...styles.h1, opacity: showH1 ? 1 : 0 }}
        >
          Mr. Reason!
        </h1>

        {/* H2 */}
        <h2
          className={showH2 ? "h2In heroSub" : "heroSub"}
          style={{ ...styles.h2, opacity: showH2 ? 1 : 0 }}
        >
          Мой любимый человек Реваз! С днём рождения.
          <br />
          Это мой изощрённый способ порадовать тебя.
        </h2>

        {/* гирлянда */}
        {!showH2 &&
          sparkles.map((s) => (
            <div
              key={s.id}
              className="sparkle"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                color: s.x > 55 ? "#2D63FF" : "#F5C842", // синий/жёлтый как в лого
                animationDelay: `${s.delay}s`,
              }}
            >
              ыхы хы
            </div>
          ))}
      </div>

      {/* CHAT */}
      <div style={styles.card} className="cardWrap">
        <div style={styles.header}>
          <div style={styles.headerTitle}>Для Реваза</div>
          <div style={styles.headerSub}>
            Можно сказать, что это зеркало. Отражение тебя, которое тебе понравится.
          </div>
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
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#1E1E1E",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 18,
    padding: 18,
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },

  hero: {
    width: "min(980px, 100%)",
    position: "relative",
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(20, 22, 28, 0.7)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
  },

  heroBg: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(1200px 600px at 70% 20%, rgba(45,99,255,0.12), transparent 55%), radial-gradient(900px 500px at 20% 60%, rgba(245,200,66,0.10), transparent 60%)",
    filter: "blur(0px)",
    pointerEvents: "none",
  },

  logo: {
    position: "absolute",
    right: 18,
    top: 12,
    width: 220,
    maxWidth: "38%",
    opacity: 0.9,
    filter: "drop-shadow(0 18px 50px rgba(0,0,0,.55))",
  },

  h1: {
    position: "relative",
    margin: 0,
    color: "#fff",
    fontSize: 44,
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },

  h2: {
    position: "relative",
    margin: "10px 0 0 0",
    color: "rgba(255,255,255,0.78)",
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.45,
    maxWidth: 520,
  },

  card: {
    width: "min(980px, 100%)",
    height: "72vh",
    background: "rgba(25, 28, 35, 0.85)",
    backdropFilter: "blur(20px)",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  header: {
    padding: 18,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: 700 },
  headerSub: { marginTop: 6, color: "#aaa", fontSize: 14 },

  chat: {
    flex: 1,
    padding: 18,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  msg: { display: "flex" },

  bubble: {
    maxWidth: "78%",
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

  typing: { opacity: 0.65, fontStyle: "italic" },

  inputRow: {
    display: "flex",
    gap: 12,
    padding: 14,
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
    fontWeight: 700,
    cursor: "pointer",
  },
};
