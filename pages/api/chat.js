import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST" });

  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: "No message" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Ты тёплый, бережный собеседник и поддержка для Реваза. " +
            "Отвечай доброжелательно, с мягким юмором. Не дави, задавай уточняющие вопросы."
        },
        { role: "user", content: message }
      ]
    });

    res.status(200).json({ reply: completion.choices[0].message.content });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}
