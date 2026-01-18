function validateChatRequest(body) {
    const errors = [];
    if (!body.messages || !Array.isArray(body.messages)) errors.push("messages must be an array");
    else if (body.messages.length === 0) errors.push("messages array cannot be empty");
    else {
      body.messages.forEach((msg, i) => {
        if (!msg.role || !["system", "user", "assistant"].includes(msg.role)) {
          errors.push(`messages[${i}].role must be 'system', 'user', or 'assistant'`);
        }
        if (!msg.content || typeof msg.content !== "string") {
          errors.push(`messages[${i}].content must be a non-empty string`);
        }
        if (msg.content && msg.content.length > 50000) {
          errors.push(`messages[${i}].content exceeds maximum length of 50000 characters`);
        }
      });
    }
    if (body.model && typeof body.model !== "string") errors.push("model must be a string");
    if (body.temperature !== undefined && (typeof body.temperature !== "number" || body.temperature < 0 || body.temperature > 2)) {
      errors.push("temperature must be a number between 0 and 2");
    }
    if (body.max_tokens !== undefined && (!Number.isInteger(body.max_tokens) || body.max_tokens < 1 || body.max_tokens > 4000)) {
      errors.push("max_tokens must be an integer between 1 and 4000");
    }
    return errors;
  }
  
  export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const errors = validateChatRequest(req.body);
    if (errors.length) {
      return res.status(400).json({ error: "Invalid request", details: errors, code: "VALIDATION_ERROR" });
    }
  
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return res.status(500).json({ error: "API key not configured", code: "CONFIG_ERROR" });
  
    try {
      const { messages, model, temperature = 0.6, max_tokens = 1000 } = req.body;
      const selectedModel = model || "meta-llama/llama-3.1-8b-instruct:free";
  
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "X-Title": "ATS Resume Builder"
        },
        body: JSON.stringify({ model: selectedModel, messages, temperature, max_tokens })
      });
  
      if (!response.ok) {
        const error = await response.json();
        console.error("OpenRouter error:", error);
        return res.status(response.status).json({
          error: error.error?.message || "AI request failed",
          code: "OPENROUTER_ERROR"
        });
      }
  
      const data = await response.json();
      res.status(200).json({
        success: true,
        content: data.choices?.[0]?.message?.content || "",
        model: selectedModel,
        usage: data.usage
      });
    } catch (err) {
      console.error("Chat endpoint error:", err);
      res.status(500).json({ error: "Failed to process AI request", code: "SERVER_ERROR" });
    }
  };