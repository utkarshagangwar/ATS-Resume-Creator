/**
 * Resume Parsing Endpoint
 * POST /api/parse-resume
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

    const { text, model } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({
            error: 'Resume text is required',
            code: 'VALIDATION_ERROR'
        });
    }

    if (text.length > 100000) {
        return res.status(400).json({
            error: 'Resume text exceeds maximum length',
            code: 'VALIDATION_ERROR'
        });
    }

    try {
        const selectedModel = model || 'meta-llama/llama-3.1-8b-instruct:free';

        const systemMessage = `You are a precise resume parser. You extract structured data from resume text and return valid JSON only. You follow instructions exactly.`;

        const userMessage = `Parse this resume and extract all information into JSON format.

=== RESUME TEXT ===
${text.substring(0, 12000)}
=== END RESUME TEXT ===

EXTRACT AND RETURN THIS EXACT JSON STRUCTURE:

{
    "name": "Full Name from resume",
    "email": "email@domain.com",
    "phone": "phone number",
    "location": "City, State",
    "linkedin": "linkedin URL if present",
    "portfolio": "website URL if present",
    "summary": "Professional summary paragraph if present",
    "experience": [
        {
            "title": "Exact Job Title",
            "company": "Company Name",
            "dates": "Start - End dates",
            "location": "Job location",
            "bullets": "• bullet 1\\n• bullet 2\\n• bullet 3"
        }
    ],
    "education": [
        {
            "degree": "Degree Type and Field (e.g., Bachelor of Science in Computer Science)",
            "school": "Institution Name (e.g., Stanford University)",
            "dates": "Year or date range",
            "details": "GPA, honors if present"
        }
    ],
    "skills": {
        "technical": "comma-separated technical skills",
        "soft": "comma-separated soft skills",
        "tools": "comma-separated tools"
    },
    "projects": [
        {
            "name": "Project name",
            "tech": "Technologies",
            "description": "Brief description"
        }
    ],
    "certifications": [
        {
            "name": "Certification name",
            "issuer": "Issuer",
            "date": "Date"
        }
    ]
}

RULES:
1. "degree" = degree type + field of study (NOT school name)
2. "school" = institution name only
3. Extract ALL work experiences found
4. Keep bullet points as-is with • prefix
5. Return ONLY the JSON, no explanations
6. If a field is not found, use empty string ""

OUTPUT: Valid JSON only, nothing else.`;

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
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json({
                error: error.error?.message || 'AI parsing failed',
                code: 'OPENROUTER_ERROR'
            });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                res.status(200).json({
                    success: true,
                    data: parsed,
                    method: 'ai'
                });
            } catch (parseError) {
                res.status(422).json({
                    error: 'Failed to parse AI response as JSON',
                    code: 'PARSE_ERROR',
                    rawContent: content
                });
            }
        } else {
            res.status(422).json({
                error: 'AI response did not contain valid JSON',
                code: 'PARSE_ERROR',
                rawContent: content
            });
        }

    } catch (error) {
        console.error('Parse resume error:', error);
        res.status(500).json({
            error: 'Failed to parse resume',
            code: 'SERVER_ERROR'
        });
    }
}
