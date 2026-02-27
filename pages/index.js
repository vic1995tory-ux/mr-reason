import Head from "next/head";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const typingSound = useRef(null);
  const bottomRef = useRef(null);

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
      a.volume = 0.8; // сделай 1.0 если хочешь громче
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
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setLoading(true);

    // старт звука — важно: внутри клика/Enter
    await startTypingSound();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ отправляем историю, чтобы бот “помнил”
        body: JSON.stringify({
          message: text,
          history: nextMessages.slice(-20), // последние 20 реплик — хватает
        }),
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

  return (
    <div className="page">
      <Head>
        {/* важно для мобилки: без зума при фокусе, + корректная высота */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <style jsx global>{`
        /* ✅ Возвращаем “тот” аккуратный шрифт */
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

        :root {
          --bg: #1e1e1e;
          --card: rgba(25, 28, 35, 0.86);
          --stroke: rgba(255, 255, 255, 0.08);
          --stroke2: rgba(255, 255, 255, 0.06);
          --text: #ffffff;
          --sub: #a8a8a8;
          --input: #0f1116;
          --gold1: #f5c842;
          --gold2: #f7d774;
        }

        html,
        body {
          height: 100%;
          margin: 0;
          background: var(--bg);
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        }

        /* фон без белых рамок */
        .page {
          min-height: 100dvh;
          background: var(--bg);
          padding: 24px;
          box-sizing: border-box;
          display: flex;
          justify-content: center;
        }

        .wrap {
          width: 100%;
          max-width: 980px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* HERO */
        .hero {
          position: relative;
          width: 100%;
          background: var(--card);
          border: 1px solid var(--stroke);
          border-radius: 28px;
          padding: 26px 26px 24px 26px;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(18px);
          overflow: hidden;
        }

        .heroTitle {
          margin: 0;
          font-size: 56px;
          line-height: 1;
          letter-spacing: -0.02em;
          color: var(--text);
          opacity: 0;
          transform: translateY(8px);
          animation: appear 0.9s ease forwards;
        }

        .heroLine {
          margin: 14px 0 0 0;
          color: rgba(255, 255, 255, 0.78);
          font-size: 18px;
          line-height: 1.5;
          opacity: 0;
          transform: translateY(8px);
        }
        .heroLine.l2 {
          animation: appear 0.9s ease forwards;
          animation-delay: 0.2s;
        }
        .heroLine.l3 {
          animation: appear 0.9s ease forwards;
          animation-delay: 0.4s;
        }

        /* ✅ логотип БЕЗ отдельной рамки (просто картинка) */
        .logo {
          position: absolute;
          right: 18px;
          top: 14px;
          width: 230px;
          height: auto;
          opacity: 0.95;
          pointer-events: none;
          filter: drop-shadow(0 16px 30px rgba(0,0,0,0.35));
        }

        /* гирлянда "ыхы хы" (3 шейпа), появляется после 2-й строки */
        .giggle {
          position: absolute;
          left: 28px;
          top: 120px;
          color: rgba(255, 255, 255, 0.88);
          font-weight: 600;
          letter-spacing: 0.02em;
          opacity: 0;
        }

        /* замедли мерцание */
        @keyframes blinkSoft {
          0% { opacity: 0.18; }
          40% { opacity: 1; }
          100% { opacity: 0.25; }
        }

        @keyframes appear {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* каждая длится в сумме ~4с с момента первой */
        .g1 {
          animation: giggleShow 0.5s ease forwards 0.6s, blinkSoft 1.8s ease-in-out 0.9s infinite;
        }
        .g2 {
          left: 44%;
          top: 156px;
          animation: giggleShow 0.5s ease forwards 1.2s, blinkSoft 2.2s ease-in-out 1.5s infinite;
        }
        .g3 {
          left: 24%;
          top: 196px;
          animation: giggleShow 0.5s ease forwards 1.8s, blinkSoft 2.0s ease-in-out 2.1s infinite;
        }

        @keyframes giggleShow {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* прячем всё примерно через 4с после первой */
        .giggleWrap {
          animation: giggleHide 0.1s linear forwards;
          animation-delay: 4.6s; /* 0.6 + ~4s */
        }
        @keyframes giggleHide {
          to { opacity: 0; }
        }

        /* CHAT CARD */
        .card {
          width: 100%;
          background: var(--card);
          border: 1px solid var(--stroke);
          border-radius: 28px;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(18px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          /* ✅ Высота адекватная и на десктопе, и на мобилке */
          height: min(720px, calc(100dvh - 240px));
        }

        .header {
          padding: 22px 22px 16px 22px;
          border-bottom: 1px solid var(--stroke2);
        }

        .h2 {
          margin: 0;
          color: var(--text);
          font-size: 30px;
          font-weight: 700;
        }

        .sub {
          margin: 8px 0 0 0;
          color: var(--sub);
          font-size: 14px;
          line-height: 1.5;
        }

        /* чат: скролл есть, полосы нет */
        .chat {
          flex: 1;
          padding: 18px 18px 8px 18px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;

          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .chat::-webkit-scrollbar {
          width: 0;
          height: 0;
        }

        .row {
          display: flex;
          animation: fadeIn 0.35s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .bubble {
          max-width: 78%;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text);
          line-height: 1.45;
          font-size: 15px;
          backdrop-filter: blur(6px);
          word-break: break-word;
        }

        .user {
          background: linear-gradient(135deg, var(--gold1), var(--gold2));
          color: #111;
          border: none;
        }

        .typing {
          opacity: 0.65;
          font-style: italic;
        }

        .dots .dot {
          display: inline-block;
          animation: dotBlink 1.4s infinite both;
        }
        .dots .dot:nth-child(2) { animation-delay: 0.2s; }
        .dots .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotBlink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }

        /* ✅ UX как ChatGPT: поле ввода удобно и НЕ прилипает к самому низу */
        .inputRow {
          padding: 14px 14px calc(14px + env(safe-area-inset-bottom));
          border-top: 1px solid var(--stroke2);
          display: flex;
          gap: 12px;
          background: rgba(0,0,0,0.08);
        }

        .input {
          flex: 1;
          background: var(--input);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 14px;
          padding: 12px 14px;
          color: var(--text);
          outline: none;
          font-size: 16px; /* ✅ важно: iOS не будет зумить */
        }

        .btn {
          background: linear-gradient(135deg, var(--gold1), var(--gold2));
          border: none;
          border-radius: 14px;
          padding: 0 18px;
          color: #111;
          font-weight: 700;
          cursor: pointer;
          min-width: 132px;
          height: 44px;
        }

        /* ✅ мобилка */
        @media (max-width: 520px) {
          .page { padding: 14px; }
          .hero { padding: 18px; border-radius: 22px; }
          .heroTitle { font-size: 46px; }
          .heroLine { font-size: 16px; }
          .logo { width: 150px; right: 10px; top: 10px; }

          .card {
            border-radius: 22px;
            height: calc(100dvh - 260px); /* чтобы клавиатуре было куда жить */
          }

          .header { padding: 18px 18px 14px; }
          .h2 { font-size: 28px; }

          .chat { padding: 16px 14px 8px; }

          .inputRow {
            flex-direction: column;
            gap: 10px;
          }

          .btn {
            width: 100%;
            min-width: 0;
          }
        }
      `}</style>

      <audio
        ref={typingSound}
        src="https://cdn.pixabay.com/audio/2022/03/15/audio_6b1b6e3b0f.mp3"
        preload="auto"
        playsInline
      />

      <div className="wrap">
        {/* HERO */}
        <div className="hero">
          {/* ✅ положи файл сюда: /public/logo.png */}
          <img className="logo" src="/logo.png" alt="logo" />

          <h1 className="heroTitle">Mr. Reason!</h1>

          <p className="heroLine l2">Мой любимый человек Реваз! С днём рождения.</p>
          <p className="heroLine l3">Это мой изощрённый способ порадовать тебя.</p>

          {/* ыхы хы: после второй строки, мерцают мягко, исчезают */}
          <div className="giggleWrap">
            <div className="giggle g1">ыхы хы</div>
            <div className="giggle g2">ыхы хы</div>
            <div className="giggle g3">ыхы хы</div>
          </div>
        </div>

        {/* CHAT */}
        <div className="card">
          <div className="header">
            <h2 className="h2">Для Реваза</h2>
            <p className="sub">
              Можно сказать, что это зеркало. Отражение тебя, которое тебе понравится.
            </p>
          </div>

          <div className="chat">
            {messages.map((m, i) => (
              <div
                key={i}
                className="row"
                style={{ justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
              >
                <div className={`bubble ${m.role === "user" ? "user" : ""}`}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="row" style={{ justifyContent: "flex-start" }}>
                <div className="bubble typing">
                  печатает
                  <span className="dots">
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="inputRow">
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Напиши..."
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
            />
            <button className="btn" onClick={send}>
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
