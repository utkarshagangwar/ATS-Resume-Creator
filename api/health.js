export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiConfigured: !!process.env.OPENROUTER_API_KEY
  });
}