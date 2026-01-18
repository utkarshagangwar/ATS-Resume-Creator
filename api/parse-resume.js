export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const { text, model } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Resume text is required", code: "VALIDATION_ERROR" });
    }
    if (text.length > 100000) {
      return res.status(400).json({ error: "Resume text exceeds maximum length", code: "VALIDATION_ERROR" });
    }
  
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return res.status(500).json({ error: "API key not configured", code: "CONFIG_ERROR" });
  
    try {
      const selectedModel = model || "meta-llama/llama-3.1-8b-instruct:free";
      const systemMessage = "You are a precise resume parser. You extract structured data from resume text and return valid JSON only. You follow instructions exactly.";
      const userMessage = `Parse this resume and extract all information into JSON format.\n\n=== RESUME TEXT ===\n${text.substring(0, 12000)}\n=== END RESUME TEXT ===\n\nReturn ONLY valid JSON.`;
  
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "X-Title": "ATS Resume Builder"
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });
  
      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json({
          error: error.error?.message || "AI parsing failed",
          code: "OPENROUTER_ERROR"
        });
      }
  
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
  
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) {
        return res.status(422).json({ error: "AI response did not contain valid JSON", code: "PARSE_ERROR", rawContent: content });
      }
  
      try {
        const parsed = JSON.parse(match[0]);
        res.status(200).json({ success: true, data: parsed, method: "ai" });
      } catch {
        res.status(422).json({ error: "Failed to parse AI response as JSON", code: "PARSE_ERROR", rawContent: content });
      }
    } catch (err) {
      console.error("Parse resume error:", err);
      res.status(500).json({ error: "Failed to parse resume", code: "SERVER_ERROR" });
    }
  };