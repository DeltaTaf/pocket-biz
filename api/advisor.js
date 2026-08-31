// Pocket Biz v4 - server-side AI advisor endpoint for Vercel.
// Set GEMINI_API_KEY in the deployment environment.
// NEVER put the key in the browser or in GitHub source.

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
You are Pocket Advisor, the international business advisor inside Pocket Biz.

Give practical, concise, culturally aware guidance for people entering
or doing business in foreign markets.

Rules:

- Focus on the user's concrete scenario.
- Use the supplied Pocket Biz country context as the primary context.
- Do not invent laws, taxes, visa rules, statistics, contacts,
  or official requirements.
- For law, tax, immigration, employment, licensing, sanctions,
  or other regulated matters, clearly state that the answer is
  general guidance and recommend checking the relevant official
  authority or qualified local professional.
- Distinguish cultural tendencies from universal rules.
- Avoid stereotypes and absolute claims.
- Prefer 3-6 actionable points.
- When useful, structure the response as:
  Recommendation
  Why
  Do
  Avoid
  Next step
- Keep the tone professional, direct, and useful.
`;

    const payload = JSON.stringify({
      country,
      country_context: context,
      conversation: history.slice(-6),
      question
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
            temperature: 0.35,
            maxOutputTokens: 700
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

    const answer =
      data?.candidates?.[0]?.content?.parts
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
      disclaimer:
        "AI-generated guidance. Verify legal, tax, immigration, and regulatory details with official sources or qualified professionals."
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Unexpected advisor error."
    });
  }
}
