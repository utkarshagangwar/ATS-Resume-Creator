module.exports = async (req, res) => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      });
  
      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json({
          error: error.error?.message || "Failed to fetch models",
          code: "OPENROUTER_ERROR"
        });
      }
  
      const data = await response.json();
      const models = data.data || [];
  
      const sorted = models.sort((a, b) => {
        const aFree = a.id.includes(":free") || (a.pricing?.prompt === "0" && a.pricing?.completion === "0");
        const bFree = b.id.includes(":free") || (b.pricing?.prompt === "0" && b.pricing?.completion === "0");
        if (aFree && !bFree) return -1;
        if (!aFree && bFree) return 1;
        return (a.name || a.id).localeCompare(b.name || b.id);
      });
  
      const processed = sorted.slice(0, 50).map(m => ({
        id: m.id,
        name: m.name || m.id,
        isFree: m.id.includes(":free") || (m.pricing?.prompt === "0" && m.pricing?.completion === "0")
      }));
  
      res.status(200).json({ success: true, models: processed, totalCount: models.length });
    } catch (err) {
      console.error("Error fetching models:", err);
      res.status(500).json({ error: "Failed to connect to OpenRouter API", code: "CONNECTION_ERROR" });
    }
  };