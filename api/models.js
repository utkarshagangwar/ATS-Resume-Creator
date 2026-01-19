/**
 * Get Available Models Endpoint
 * GET /api/models
 */

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: 'API key not configured on server',
            code: 'API_KEY_MISSING'
        });
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json({
                error: error.error?.message || 'Failed to fetch models',
                code: 'OPENROUTER_ERROR'
            });
        }

        const data = await response.json();
        const models = data.data || [];

        // Sort models: free first, then alphabetically
        const sortedModels = models.sort((a, b) => {
            const aFree = a.id.includes(':free') || (a.pricing?.prompt === '0' && a.pricing?.completion === '0');
            const bFree = b.id.includes(':free') || (b.pricing?.prompt === '0' && b.pricing?.completion === '0');
            if (aFree && !bFree) return -1;
            if (!aFree && bFree) return 1;
            return (a.name || a.id).localeCompare(b.name || b.id);
        });

        // Return processed models (limit to 50 for performance)
        const processedModels = sortedModels.slice(0, 50).map(m => ({
            id: m.id,
            name: m.name || m.id,
            isFree: m.id.includes(':free') || (m.pricing?.prompt === '0' && m.pricing?.completion === '0')
        }));

        res.status(200).json({
            success: true,
            models: processedModels,
            totalCount: models.length
        });

    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({
            error: 'Failed to connect to OpenRouter API',
            code: 'CONNECTION_ERROR'
        });
    }
}
