# ATS Resume Builder

A powerful, AI-powered resume builder that creates ATS-friendly resumes with humanized content. Features secure backend API proxy, resume parsing, and comprehensive ATS scoring.

## 🔒 Secure Architecture

This application uses a **secure backend proxy** pattern:
- Your OpenRouter API key is stored **only on the server** (in environment variables)
- The frontend **never sees or stores** your API key
- All AI requests are proxied through the backend with:
  - Rate limiting (100 requests per 15 minutes per IP)
  - Input validation
  - CORS protection

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- An OpenRouter API key (free at [openrouter.ai/keys](https://openrouter.ai/keys))

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your OpenRouter API key
# OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 3. Start the Backend Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will start at `http://localhost:3001`

### 4. Open the Frontend

Open `index.html` in your browser, or serve it with a simple HTTP server:

```bash
# Using Python
python -m http.server 5500

# Using Node.js
npx serve .
```

Then open `http://localhost:5500` in your browser.

### 5. Connect to Backend

1. Go to **Settings** tab in the app
2. Enter the backend URL: `http://localhost:3001`
3. Click **"Test Backend Connection"**
4. Select your preferred AI model
5. Click **"Save Settings"**

## 📁 Project Structure

```
├── index.html          # Frontend application (single HTML file)
├── server.js           # Backend API proxy server
├── package.json        # Node.js dependencies
├── .env.example        # Environment variables template
├── .env                # Your environment variables (create this)
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🔐 Security Features

### Backend Security
- **Environment Variables**: API key stored in `.env`, never in code
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Only allowed origins can access the API
- **Helmet**: Security headers enabled
- **Input Validation**: All requests are validated before forwarding

### Frontend Security
- **No API Key Storage**: Frontend never receives or stores the API key
- **Local Data Only**: Resume data stored in browser localStorage
- **No External Tracking**: No analytics or third-party scripts

## 🛠️ API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check and API status |
| `/api/models` | GET | List available AI models |
| `/api/chat` | POST | AI chat completion (proxied) |
| `/api/parse-resume` | POST | Parse resume text with AI |

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes | - | Your OpenRouter API key |
| `PORT` | No | 3001 | Server port |
| `ALLOWED_ORIGINS` | No | localhost | Comma-separated allowed origins |

### CORS Configuration

To allow your production frontend, update `ALLOWED_ORIGINS` in `.env`:

```env
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

## 🚀 Production Deployment

### Option 1: Traditional Server

1. Set up a Node.js server (e.g., on DigitalOcean, AWS EC2)
2. Clone the repository
3. Run `npm install --production`
4. Set environment variables
5. Use PM2 or similar for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "resume-api"
   ```

### Option 2: Serverless (Vercel/Netlify)

The `server.js` can be adapted for serverless:

```javascript
// api/chat.js (for Vercel)
module.exports = async (req, res) => {
  // ... handler code
};
```

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

## 📝 Features

### Resume Editor
- Section-wise editing (Contact, Summary, Experience, Education, Skills, Projects, Certifications, Languages)
- Add/remove entries dynamically
- Auto-save to localStorage

### AI Generation
- **Generate All**: One-click generation for all sections
- **Section-specific**: Generate individual sections
- **ATS-Optimized**: Prompts enforce ATS compliance rules
- **Humanized Tone**: Natural, impactful language

### Resume Parsing
- Upload PDF or DOCX files
- AI-powered text extraction and structuring
- Fallback heuristic parser (works without AI)

### ATS Scoring
- Section-by-section analysis
- Action verb detection
- Metrics/quantification check
- First-person pronoun detection
- Keyword relevance scoring
- Actionable recommendations

### Export
- **PDF**: ATS-friendly, selectable text
- **DOCX**: Editable Word document

## 🔧 Troubleshooting

### "Connection Failed" Error

1. **Server not running**: Start with `npm start`
2. **Wrong port**: Check the backend URL in Settings
3. **API key not set**: Ensure `.env` has your API key
4. **CORS error**: Add your frontend URL to `ALLOWED_ORIGINS`

### AI Generation Not Working

1. Test the backend connection in Settings
2. Check the browser console for errors
3. Verify your OpenRouter API key is valid
4. Check if you have API credits remaining

### Resume Parsing Issues

1. Ensure the PDF has selectable text (not scanned image)
2. Try a DOCX file for better results
3. Check if AI is connected for best parsing accuracy

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 💬 Support

For issues and feature requests, please open a GitHub issue.
