# 🏏 Dream11 Team Summarizer

AI-powered fantasy cricket team analysis with OCR extraction, performance insights, and comprehensive team comparison.

## 🚀 Core Features

- **📸 OCR Extraction** - Extract players from Dream11 screenshots automatically
- **🤖 AI Analysis** - Detailed team insights using OpenAI GPT-4
- **📊 Team Comparison** - Compare multiple teams with recommendations
- **📈 Performance Analytics** - Player stats, venue analysis, head-to-head data
- **🔄 Multi-Team Support** - Bulk analysis and team portfolio management
- **📱 Responsive Design** - Mobile-optimized interfaces

## 🏗️ Architecture

**Frontend:** HTML/CSS/JavaScript with TailwindCSS
**Backend:** Node.js/Express API server
**Database:** Supabase (PostgreSQL)
**OCR Service:** OCR.space API
**AI Engine:** OpenAI GPT-4
**Deployment:** Vercel

## 📱 User Interfaces

1. **Basic Analysis** (`index.html`) - Simple team analysis
2. **Enhanced Analysis** (`team-analysis-tabbed.html`) - Advanced tabbed interface
3. **Bulk Analysis** (`bulk-analysis.html`) - Multiple team analysis
4. **Team Comparison** (`team-comparison-focused.html`) - Side-by-side comparison

## ⚡ Quick Setup

### Prerequisites
- Node.js 16+
- OCR.space API key (free tier: 25,000 requests/month)
- OpenAI API key (optional, for AI analysis)
- Supabase account (optional, for database features)

### Backend Setup
```bash
cd backend
npm install
cp env-example.txt .env
# Edit .env with your API keys
npm start
```

### Frontend Setup
```bash
cd frontend
python -m http.server 3000
# Or use: npx http-server -p 3000
```

### Environment Variables (.env)
```env
PORT=3001
OCR_API_KEY=your_ocr_space_api_key
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

## 🔧 API Endpoints

### Core
- `GET /api/health` - Server status
- `POST /api/ocr` - Image processing and player extraction
- `POST /api/analyze` - Team analysis
- `POST /api/analyze-multiple` - Multiple teams comparison

### Data
- `GET /api/teams` - Available teams
- `GET /api/validate` - Player validation
- `GET /api/team-form` - Team recent form
- `GET /api/head-to-head` - Head-to-head statistics
- `GET /api/venue-stats` - Venue statistics
- `GET /api/player-performance` - Player performance data

## 📂 Project Structure

```
├── frontend/              # Web interfaces
│   ├── index.html         # Basic analysis
│   ├── team-analysis-tabbed.html  # Enhanced analysis
│   ├── bulk-analysis.html # Multiple team analysis
│   ├── js/               # JavaScript modules
│   └── css/              # Stylesheets
├── backend/              # Node.js API
│   ├── server.js         # Express server
│   ├── controllers/      # API controllers
│   ├── services/         # Business logic (OCR, AI, validation)
│   └── routes/           # API routes
├── database/             # Database schema and scripts
├── api/                  # Vercel API handler
└── vercel.json           # Deployment configuration
```

## 🎯 How to Use

1. **Upload Screenshot** - Drag/drop Dream11 team screenshot (JPG/PNG, max 5MB)
2. **Fill Match Details** - Select teams and match date
3. **Review Extraction** - Verify 11 players, captain (C), vice-captain (VC)
4. **Get Analysis** - AI-powered insights with ratings and recommendations
5. **Compare Teams** - Upload multiple teams for comparative analysis

## 🚀 Deployment (Vercel)

```bash
# Using Vercel CLI
npm i -g vercel
vercel login
vercel

# Or connect GitHub repo in Vercel Dashboard
```

Set environment variables in Vercel Dashboard for production.

## 🛠️ Key Components

### OCR Service (`backend/services/ocrService.js`)
- Processes Dream11 screenshots via OCR.space API
- Extracts player names, captain, vice-captain
- Advanced parsing with pattern recognition

### Analysis Service (`backend/services/analysisService.js`)
- AI-powered team analysis using OpenAI GPT-4
- Structured insights: Team Balance, Captaincy, Venue Strategy
- Multi-team comparison with portfolio analysis

### Validation Service (`backend/services/validationService.js`)
- Player name validation against database
- Team affiliation verification
- Suggestion engine for name corrections

## 🔍 Analysis Features

**Single Team Analysis:**
- Team Balance assessment
- Captaincy choice evaluation
- Match advantage analysis
- Venue strategy recommendations
- Player covariance analysis
- Overall rating (1-10)

**Multi-Team Analysis:**
- Portfolio overview
- Team patterns identification
- Scenario-based recommendations
- Best team selection
- Risk diversification analysis

## 🧪 Development

```bash
# Backend with auto-reload
cd backend
npm run dev

# Frontend - refresh browser for changes
```

## 📊 Technologies

- **Frontend:** HTML5, CSS3, JavaScript ES6+, TailwindCSS
- **Backend:** Node.js, Express, Multer, Helmet, Rate Limiting
- **Database:** Supabase (PostgreSQL), pg driver
- **APIs:** OCR.space (text extraction), OpenAI GPT-4 (analysis)
- **Deployment:** Vercel (serverless functions)

## 🎮 Testing

Access interfaces:
- **Main App:** `http://localhost:3000`
- **Enhanced:** `http://localhost:3000/team-analysis-tabbed.html`
- **Bulk Analysis:** `http://localhost:3000/bulk-analysis.html`
- **API Health:** `http://localhost:3001/api/health`

---

**Built for fantasy cricket enthusiasts with AI-powered insights 🏏**
