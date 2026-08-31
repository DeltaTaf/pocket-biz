// Pocket Biz v18 - Web-Grounded Country Mistakes
// Requires GEMINI_API_KEY in Vercel Production Environment Variables.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return res.status(500).json({
      error:
        "GEMINI_API_KEY is missing in the Vercel Production environment."
    });
  }

  try {
    const {
      country,
      countryName,
      language = "en"
    } = req.body || {};

    if (!countryName || typeof countryName !== "string") {
      return res.status(400).json({
        error: "Country is required."
      });
    }

    const prompt = `
You are Pocket Biz's current market-entry research specialist.

Research the CURRENT WEB for the most important mistakes that a
foreign entrepreneur or company could make when entering or doing
business in ${countryName}.

The selected country is:

${countryName}

Country code:
${country || "unknown"}

Find EXACTLY FIVE useful, country-specific mistakes.

Do NOT give generic advice that could apply to any country.

Prioritize mistakes involving:

- Business meetings
- Communication
- Negotiation
- Market entry
- Local business practices
- Regulations or compliance
- Hiring
- Partnerships
- Pricing or payments
- Customer expectations
- Business relationships

For every mistake explain:

1. The mistake
2. Why it matters in ${countryName}
3. What the foreign businessperson should do instead

IMPORTANT:

- Use Google Search grounding.
- Prefer government websites and official business portals.
- Also use reputable chambers of commerce, embassies,
  professional services firms, universities and established
  business publications.
- Do NOT invent facts.
- Do NOT invent URLs.
- Do NOT use stereotypes.
- Cultural tendencies must never be presented as universal rules.
- If a claim involves law, taxation, licensing, immigration or
  another regulated subject, make that clear.
- The information should be useful for someone actually considering
  entering the market.
- Answer in ${language}.

Return ONLY valid JSON in exactly this format:

{
  "mistakes": [
    {
      "title": "Short specific title",
      "explanation": "Clear explanation of the mistake, why it matters, and what to do instead.",
      "sourceTitle": "Supporting source title",
      "sourceUrl": "https://..."
    }
  ]
}
`;

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
                text:
                  "You are Pocket Biz's research engine. " +
                  "Use Google Search grounding to find current, " +
                  "country-specific business information. " +
                  "Never fabricate sources or URLs."
              }
            ]
          },

          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],

          tools: [
            {
              google_search: {}
            }
          ],

          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2200,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini research error:",
        JSON.stringify(data)
      );

      return res.status(502).json({
        error:
          data?.error?.message ||
          "The web research provider returned an error."
      });
    }

    const candidate =
      data?.candidates?.[0];

    const parts =
      candidate?.content?.parts || [];

    const text = parts
      .map(part => part.text || "")
      .join("")
      .trim();

    if (!text) {
      return res.status(502).json({
        error:
          "The research provider returned no usable result."
      });
    }

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (error) {

      const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.error(
          "Invalid JSON returned by Gemini:",
          text
        );

        return res.status(502).json({
          error:
            "The research provider returned an invalid result."
        });
      }
    }

    if (
      !parsed ||
      !Array.isArray(parsed.mistakes)
    ) {
      return res.status(502).json({
        error:
          "The research provider returned an invalid research structure."
      });
    }

    /*
     * Google Search grounding sources.
     *
     * Gemini can provide additional grounded web sources in
     * groundingMetadata. These are used as fallback sources when
     * the model does not attach a source directly to a mistake.
     */

    const groundingChunks =
      candidate?.groundingMetadata?.groundingChunks || [];

    const groundedSources =
      groundingChunks
        .map(chunk => ({
          title:
            chunk?.web?.title || "",
          url:
            chunk?.web?.uri || ""
        }))
        .filter(source => source.url);

    const mistakes =
      parsed.mistakes
        .slice(0, 5)
        .map((mistake, index) => {

          const fallback =
            groundedSources[index] || {};

          return {
            title:
              typeof mistake.title === "string"
                ? mistake.title
                : "Business mistake",

            explanation:
              typeof mistake.explanation === "string"
                ? mistake.explanation
                : "No explanation available.",

            sourceTitle:
              typeof mistake.sourceTitle === "string" &&
              mistake.sourceTitle.trim()
                ? mistake.sourceTitle
                : fallback.title || "Web source",

            sourceUrl:
              typeof mistake.sourceUrl === "string" &&
              /^https?:\/\//i.test(mistake.sourceUrl)
                ? mistake.sourceUrl
                : fallback.url || ""
          };
        });

    return res.status(200).json({
      country: countryName,
      countryCode: country || null,
      mistakes,
      researchedAt: new Date().toISOString()
    });

  } catch (error) {

    console.error(
      "Pocket Biz mistakes API exception:",
      error
    );

    return res.status(500).json({
      error:
        "Unexpected error while researching country mistakes."
    });
  }
}
