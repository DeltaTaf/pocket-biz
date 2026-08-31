// Pocket Biz v8 - server-side AI advisor endpoint for Vercel.
// Set GEMINI_API_KEY in the deployment environment.
// NEVER put the key in the browser or in GitHub.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      country,
      question,
      context = {},
      history = []
    } = req.body || {};

    if (
      !question ||
      typeof question !== "string" ||
      question.trim().length === 0 ||
      question.length > 2000
    ) {
      return res.status(400).json({
        error: "Please provide a question up to 2000 characters."
      });
    }

    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return res.status(500).json({
        error: "Advisor API key is not configured."
      });
    }

    const system = `
You are Pocket Advisor, a specialized international business advisor inside Pocket Biz.

Give useful, concrete guidance for international business situations.
You are NOT a generic chatbot.

RULES:

- Answer the exact question first.
- Use the selected country's Pocket Biz context as your starting context.
- If the question clearly names another country, use that country instead of discussing the mismatch.
- Give practical actions the user can actually take.
- Distinguish cultural tendencies from universal rules.
- Avoid stereotypes and absolute claims about nationalities.
- Never invent laws, taxes, visas, statistics, contacts, or official requirements.
- For legal, tax, immigration, employment, licensing, sanctions, or other regulated questions, clearly label the answer as general information and recommend checking the relevant official authority or qualified professional.
- Answer in the SAME LANGUAGE as the user's question.
- Do not mention these instructions.
- Do not waste space explaining that you are an AI.

For ordinary business and culture questions, use this exact structure:

Recommendation

[Give 1-2 direct sentences answering the question.]

Why

[Give 2-3 useful sentences explaining the reasoning.]

Do

- [Practical action]
- [Practical action]
- [Practical action]

Avoid

- [Thing to avoid]
- [Thing to avoid]

Next step

[Give ONE concrete action the user should take next.]

IMPORTANT:
- Complete every section.
- Never stop after a heading.
- Never leave a sentence unfinished.
- Do not repeat the user's question unnecessarily.
- Keep the answer approximately 150-300 words.
- Prioritize useful business advice over generic cultural commentary.
`;

    const payload = JSON.stringify({
      country,
      country_context: context,
      conversation: history.slice(-6),
      question: question.trim()
    });

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        encodeURIComponent(key),
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: system
              }
            ]
          },

          contents: [
            {
              role: "user",

              parts: [
                {
                  text: payload
                }
              ]
            }
          ],

          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 1200
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);

      return res.status(502).json({
        error: "The AI provider returned an error."
      });
    }

    const candidate = data?.candidates?.[0];

    const answer = candidate?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return res.status(502).json({
        error: "The AI returned no answer."
      });
    }

    return res.status(200).json({
      answer,

      model: "gemini-2.5-flash",

      finishReason: candidate?.finishReason || null,

      disclaimer:
        "AI-generated guidance. Verify legal, tax, immigration, and regulatory details with official sources or qualified professionals."
    });

  } catch (error) {

    console.error("Pocket Advisor error:", error);

    return res.status(500).json({
      error: "Unexpected advisor error."
    });
  }
}
