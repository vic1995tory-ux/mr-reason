import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Привет. Хочешь начать с вопроса: «Кто такой Реваз?»" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();

      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply || "…" }
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Ошибка. Попробуй ещё раз." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Для Реваза</h2>
          <p style={styles.sub}>Открытка с диалогом</p>
        </div>

        <div style={styles.chat}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.msg,
                justifyContent:
                  m.role === "user" ? "flex-end" : "flex-start"
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  ...(m.role === "user" ? styles.user : {})
                }}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={styles.msg}>
              <div style={styles.bubble}>…</div>
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
  page: {
    minHeight: "100vh",
    background: "#0b0f19",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "system-ui",
    color: "#fff"
  },

  card: {
    width: "90%",
    maxWidth: 800,
    height: "80vh",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)"
  },

  header: {
    padding: 20,
    borderBottom: "1px solid rgba(255,255,255,0.08)"
  },

  title: { margin: 0 },

  sub: {
    margin: "6px 0 0",
    opacity: 0.7,
    fontSize: 13
  },

  chat: {
    flex: 1,
    padding: 20,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  msg: {
    display: "flex"
  },

  bubble: {
    maxWidth: "70%",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    fontSize: 14
  },

  user: {
    background: "rgba(120,140,255,0.25)"
  },

  inputRow: {
    display: "flex",
    gap: 10,
    padding: 14,
    borderTop: "1px solid rgba(255,255,255,0.08)"
  },

  input: {
    flex: 1,
    background: "#05070f",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: "10px",
    color: "#fff"
  },

  button: {
    background: "#2d3cff",
    border: "none",
    borderRadius: 12,
    padding: "0 18px",
    color: "#fff",
    cursor: "pointer"
  }
};
