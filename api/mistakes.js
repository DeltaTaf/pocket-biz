// Pocket Biz v15 - Web-Grounded Top Mistakes
// Vercel serverless function
// Requires GEMINI_API_KEY in Vercel Environment Variables

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      country,
      countryName,
      language = "en"
    } = req.body || {};

    if (!countryName) {
      return res.status(400).json({
        error: "Country is required."
      });
    }

    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return res.status(500).json({
        error: "Advisor API key is not configured."
      });
    }

    const prompt = `
Research the CURRENT web for common mistakes foreign entrepreneurs,
business travelers, and companies make when doing business in:

${countryName}

The information must be specifically relevant to ${countryName}.

Use Google Search grounding.

PRIORITIZE THESE SOURCES:

- Government websites
- Official business portals
- Chambers of commerce
- Embassies
- Reputable professional services firms
- Established business publications
- Universities and business organizations

DO NOT:
- Invent sources
- Invent URLs
- Make unsupported claims
- Use stereotypes
- Treat cultural tendencies as universal rules
- Give generic advice that could apply to every country

Find exactly FIVE meaningful mistakes that a foreign businessperson
should know about when entering or doing business in ${countryName}.

Each mistake should explain:
1. What the mistake is
2. Why it matters
3. What the foreign businessperson should do instead

The mistakes should be useful and specific.

Examples of useful categories include:
- Business etiquette
- Communication
- Negotiation
- Market entry
- Regulations
- Business relationships
- Payment practices
- Decision-making
- Hiring
- Meetings
- Local expectations

Answer in language:

${language}

RETURN ONLY VALID JSON.

Use exactly this structure:

{
  "mistakes": [
    {
      "title": "Short mistake title",
      "explanation": "2-3 sentences explaining the mistake and what to do instead.",
      "sourceTitle": "Title of supporting source",
      "sourceUrl": "https://example.com"
    }
  ]
}
`;

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
                text:
                  "You are Pocket Biz's country research specialist. " +
                  "You research current information using Google Search grounding. " +
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
            maxOutputTokens: 1800,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini grounding error:", data);

      return res.status(502).json({
        error: "Web research provider returned an error."
      });
    }

    const candidate = data?.candidates?.[0];

    const text = candidate?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!text) {
      return res.status(502).json({
        error: "Web research returned no answer."
      });
    }

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      parsed = JSON.parse(cleaned);
    }

    if (!Array.isArray(parsed.mistakes)) {
      throw new Error("Invalid research format.");
    }

    /*
     * Gemini grounding metadata may contain additional verified
     * web sources. We use them as a fallback if the model doesn't
     * provide a source URL.
     */

    const groundingChunks =
      candidate?.groundingMetadata?.groundingChunks || [];

    const groundedSources = groundingChunks
      .map(chunk => ({
        title: chunk?.web?.title || "",
        url: chunk?.web?.uri || ""
      }))
      .filter(source => source.url);

    const mistakes = parsed.mistakes
      .slice(0, 5)
      .map((mistake, index) => {

        const fallback =
          groundedSources[index] || {};

        return {
          title: String(
            mistake.title ||
            "Business mistake"
          ),

          explanation: String(
            mistake.explanation ||
            "No explanation available."
          ),

          sourceTitle: String(
            mistake.sourceTitle ||
            fallback.title ||
            "Web source"
          ),

          sourceUrl: String(
            mistake.sourceUrl ||
            fallback.url ||
            ""
          )
        };
      });

    return res.status(200).json({
      country: countryName,
      mistakes: mistakes,
      researchedAt: new Date().toISOString()
    });

  } catch (error) {

    console.error(
      "Pocket Biz mistakes research error:",
      error
    );

    return res.status(500).json({
      error: "Unexpected web research error."
    });
  }
}
