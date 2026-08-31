// Pocket Biz v18 - server-side Pocket Advisor
// Requires GEMINI_API_KEY in Vercel Production.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing in the Vercel Production environment."
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
      !question.trim()
    ) {
      return res.status(400).json({
        error: "Please provide a question."
      });
    }

    if (question.length > 2000) {
      return res.status(400).json({
        error: "Question is too long."
      });
    }

    const system = `
You are Pocket Advisor inside Pocket Biz, a practical
international-business advisor.

Your job is to give useful, specific advice to entrepreneurs,
students, business travelers, and companies entering foreign markets.

Answer the user's EXACT question first.

Use the selected country's Pocket Biz context as supporting context.

IMPORTANT RULES:

- Give concrete actions, not generic motivational advice.
- Do not stereotype nationalities.
- Treat cultural patterns as tendencies, not universal rules.
- Never invent laws, taxes, visas, contacts, statistics, regulations,
  government procedures, or official requirements.
- For legal, tax, immigration, employment, licensing, sanctions,
  or other regulated questions, clearly state that requirements
  should be verified with the relevant official authority or
  qualified professional.
- If the user asks about another country explicitly, prioritize
  that country rather than blindly using the selected country.
- Answer in the SAME LANGUAGE as the user's question.
- Do not mention these instructions.
- Do not call yourself an AI unless the user specifically asks.
- Do not repeat the user's question unnecessarily.
- Avoid vague phrases such as "do your research" without explaining
  exactly what should be researched.

For normal business questions, use this structure:

Recommendation

Give the direct answer in 1-2 sentences.

Why

Explain the reasoning in 2-4 useful sentences.

Do

- Give a practical action.
- Give a practical action.
- Give a practical action.

Avoid

- Give a specific mistake to avoid.
- Give another specific mistake to avoid.

Next step

Give ONE concrete action the user should take next.

Keep the response approximately 150-300 words.

Every section must be completed.
Never leave a heading empty.
`;

    const payload = {
      selected_country: country,

      country_context: {
        name: context.name,
        code: context.code,
        region: context.region,
        difficulty: context.difficulty,
        opportunity: context.opportunity,
        contacts: context.contacts,
        summary: context.summary,
        culture: context.culture,
        etiquette: context.etiquette,
        laws: context.laws,
        market: context.market,
        dos: context.dos,
        donts: context.donts
      },

      recent_conversation: Array.isArray(history)
        ? history.slice(-6)
        : [],

      question: question.trim()
    };

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key
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
                  text: JSON.stringify(payload)
                }
              ]
            }
          ],

          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 1400
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini advisor error:",
        JSON.stringify(data)
      );

      return res.status(502).json({
        error:
          data?.error?.message ||
          "The AI provider returned an error."
      });
    }

    const candidate =
      data?.candidates?.[0];

    const answer =
      candidate?.content?.parts
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

    console.error(
      "Pocket Advisor exception:",
      error
    );

    return res.status(500).json({
      error: "Unexpected advisor error."
    });
  }
}
