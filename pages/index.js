import { useEffect, useMemo, useRef, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const typingSound = useRef(null);
  const bottomRef = useRef(null);

  // ====== HERO ANIMATION STATE ======
  const [showH1, setShowH1] = useState(false);
  const [showH2, setShowH2] = useState(false);
  const [showH3, setShowH3] = useState(false);

  const [showGiggles, setShowGiggles] = useState(false);
  const [giggles, setGiggles] = useState([]); // {id, top, left, delay, duration}

  // 3 отдельные "шейпы" — фиксируем их "рандомность" один раз на загрузке
  const initialGiggles = useMemo(() => {
    const pick = () => {
      // область — правый верх hero-карты, чтобы выглядело как на твоём скрине
      // top/left в процентах относительно hero-карты
      const top = 18 + Math.random() * 55;   // 18%..73%
      const left = 58 + Math.random() * 33;  // 58%..91%
      const delay = Math.random() * 0.6;     // небольшая рассинхронизация
      const duration = 0.6 + Math.random() * 0.8; // скорость мигания
      return { top, left, delay, duration };
    };

    return [
      { id: "g1", text: "ыхы хы", ...pick() },
      { id: "g2", text: "ыхы хы", ...pick() },
      { id: "g3", text: "ыхы хы", ...pick() },
    ];
  }, []);

  // Появление строк + запуск "гирлянды" после 2й строки
  useEffect(() => {
    const t1 = setTimeout(() => setShowH1(true), 150);            // старт
    const t2 = setTimeout(() => setShowH2(true), 150 + 1200 + 200); // 0.2s пауза после 1й
    const t3 = setTimeout(() => setShowH3(true), 150 + 1200 + 200 + 900 + 200); // 0.2s пауза после 2й

    // "ыхы хы" должны появиться ПОСЛЕ второй строки
    const tgStart = setTimeout(() => {
      setGiggles(initialGiggles);
      setShowGiggles(true);

      // длительность ~4 секунды после старта первой "ыхы хы"
      setTimeout(() => setShowGiggles(false), 4000);
    }, 150 + 1200 + 200 + 250); // чуть после появления 2й строки

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tgStart);
    };
  }, [initialGiggles]);

  // ====== CHAT AUTOSCROLL ======
  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages, loading]);

  async function startTypingSound() {
    const a = typingSound.current;
    if (!a) return;
    try {
      a.volume = 0.8; // было тихо — делаем громче
      a.currentTime = 0;
      await a.play(); // может быть заблокировано браузером — это ок
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
        /* Скрываем скроллбар (скролл работает) */
        .chatScroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .chatScroll::-webkit-scrollbar {
          width: 0;
          height: 0;
        }

        /* Плавнее и подольше появление */
        @keyframes softIn {
          from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0);   filter: blur(0); }
        }

        /* Лёгкое "дыхание" карточек */
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
          100% { transform: translateY(0px); }
        }

        /* Точки typing */
        .dot { animation: blink 1.2s infinite both; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }

        /* "Гирлянда" — мерцание */
        @keyframes garland {
          0% { opacity: 0.1; transform: translateY(0px) scale(0.98); }
          15% { opacity: 1; }
          50% { opacity: 0.2; transform: translateY(-2px) scale(1); }
          100% { opacity: 0.1; transform: translateY(0px) scale(0.98); }
        }

        /* Адаптив: ширина и высоты, чтобы инпут был удобный */
        @media (max-width: 520px) {
          .wrap {
            padding: 14px !important;
          }
        }
      `}</style>

      <audio
        ref={typingSound}
        src="https://cdn.pixabay.com/audio/2022/03/15/audio_6b1b6e3b0f.mp3"
        preload="auto"
        playsInline
      />

      <div className="wrap" style={styles.wrap}>
        {/* HERO */}
        <div style={styles.hero}>
          <div style={styles.heroLeft}>
            <div
              style={{
                ...styles.heroH1,
                ...(showH1 ? styles.show : styles.hide),
              }}
            >
              Mr. Reason!
            </div>

            <div
              style={{
                ...styles.heroH2,
                ...(showH2 ? styles.show : styles.hide),
              }}
            >
              Мой любимый человек Реваз! С днём рождения.
            </div>

            <div
              style={{
                ...styles.heroH3,
                ...(showH3 ? styles.show : styles.hide),
              }}
            >
              Это мой изощрённый способ порадовать тебя.
            </div>
          </div>

          {/* Гирлянда "ыхы хы" — 3 отдельных шейпа */}
          {showGiggles &&
            giggles.map((g) => (
              <div
                key={g.id}
                style={{
                  ...styles.giggle,
                  top: `${g.top}%`,
                  left: `${g.left}%`,
                  animation: `garland ${g.duration}s ${g.delay}s infinite`,
                }}
              >
                {g.text}
              </div>
            ))}

          {/* Декор справа (пока как заглушка градиентом; если добавишь png — заменим на <img/>) */}
          <div style={styles.heroRightDecor} />
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
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#1E1E1E", // фон как на Тильде
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },

  wrap: {
    width: "100%",
    maxWidth: 980,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    fontFamily: "Inter, sans-serif",
  },

  hero: {
    position: "relative",
    width: "100%",
    borderRadius: 24,
    padding: 22,
    background: "rgba(25, 28, 35, 0.75)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
    backdropFilter: "blur(18px)",
    overflow: "hidden",
    animation: "float 7s ease-in-out infinite",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    minHeight: 120,
  },

  heroLeft: {
    maxWidth: 640,
    zIndex: 2,
  },

  heroH1: {
    fontSize: 44,
    fontWeight: 800,
    letterSpacing: -0.5,
    color: "#fff",
    marginBottom: 8,
  },
  heroH2: {
    fontSize: 16,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 4,
  },
  heroH3: {
    fontSize: 16,
    color: "rgba(255,255,255,0.75)",
  },

  show: {
    opacity: 1,
    transform: "translateY(0)",
    filter: "blur(0)",
    animation: "softIn 1.2s ease both",
  },
  hide: {
    opacity: 0,
    transform: "translateY(10px)",
    filter: "blur(4px)",
  },

  giggle: {
    position: "absolute",
    zIndex: 3,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    pointerEvents: "none",
  },

  heroRightDecor: {
    width: 210,
    minWidth: 210,
    borderRadius: 18,
    background:
      "radial-gradient(circle at 40% 35%, rgba(245,200,66,0.35), transparent 55%), radial-gradient(circle at 70% 65%, rgba(74,117,255,0.35), transparent 55%)",
    opacity: 0.9,
    border: "1px solid rgba(255,255,255,0.06)",
    zIndex: 1,
  },

  // CHAT CARD
  card: {
    width: "100%",
    borderRadius: 24,
    background: "rgba(25, 28, 35, 0.85)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
    backdropFilter: "blur(20px)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",

    // ↑ вот тут правка высоты: делаем чуть выше + аккуратнее на мобилке
    height: "calc(100vh - 220px)",
    minHeight: 520,
    maxHeight: 820,
  },

  header: {
    padding: 20,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: 700,
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
    padding: 18,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  msg: {
    display: "flex",
    animation: "softIn 0.55s ease both",
  },

  bubble: {
    maxWidth: "78%",
    padding: "12px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    lineHeight: 1.45,
    fontSize: 15,
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
    opacity: 0.65,
    fontStyle: "italic",
  },

  inputRow: {
    display: "flex",
    gap: 12,
    padding: 14,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(0,0,0,0.12)",
  },

  input: {
    flex: 1,
    minWidth: 0,
    background: "#0f1116",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: "12px 14px",
    color: "#fff",
    outline: "none",
    fontSize: 16, // важно для iOS чтобы не зумило
  },

  button: {
    background: "#f5c842",
    border: "none",
    borderRadius: 12,
    padding: "0 18px",
    color: "#111",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};
