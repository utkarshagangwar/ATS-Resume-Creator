/**
 * Chat Completion Endpoint
 * POST /api/chat
 */

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: 'API key not configured on server',
            code: 'API_KEY_MISSING'
        });
    }

    // Validate request body
    const { messages, model, temperature = 0.6, max_tokens = 1000 } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
            error: 'Invalid request: messages array is required',
            code: 'VALIDATION_ERROR'
        });
    }

    // Validate each message
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (!msg.role || !['system', 'user', 'assistant'].includes(msg.role)) {
            return res.status(400).json({
                error: `Invalid message role at index ${i}`,
                code: 'VALIDATION_ERROR'
            });
        }
        if (!msg.content || typeof msg.content !== 'string') {
            return res.status(400).json({
                error: `Invalid message content at index ${i}`,
                code: 'VALIDATION_ERROR'
            });
        }
        if (msg.content.length > 50000) {
            return res.status(400).json({
                error: `Message content too long at index ${i}`,
                code: 'VALIDATION_ERROR'
            });
        }
    }

    try {
        const selectedModel = model || 'meta-llama/llama-3.1-8b-instruct:free';

        console.log(`[Chat] Using model: ${selectedModel}`);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
                'X-Title': 'ATS Resume Builder'
            },
            body: JSON.stringify({
                model: selectedModel,
                messages,
                temperature,
                max_tokens
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('OpenRouter error:', error);
            return res.status(response.status).json({
                error: error.error?.message || 'AI request failed',
                code: 'OPENROUTER_ERROR'
            });
        }

        const data = await response.json();

        console.log(`[Chat] Response received successfully`);

        res.status(200).json({
            success: true,
            content: data.choices?.[0]?.message?.content || '',
            model: selectedModel,
            usage: data.usage
        });

    } catch (error) {
        console.error('Chat endpoint error:', error);
        res.status(500).json({
            error: 'Failed to process AI request',
            code: 'SERVER_ERROR'
        });
    }
}
