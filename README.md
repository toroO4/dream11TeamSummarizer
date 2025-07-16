# cricbuzz11 Team Analyzer

AI-powered fantasy cricket team analysis with OCR and performance insights.

## Quick Setup

### Prerequisites
- Node.js 16+
- OCR.space API key (free)
- OpenAI API key (optional, for AI analysis)

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
# Or: npx http-server -p 3000
```

### API Keys
1. **OCR.space** (Required): [Get free key](https://ocr.space/ocrapi) - 25K requests/month
2. **OpenAI** (Optional): [Get API key](https://platform.openai.com/api-keys) - For AI analysis

## Usage

1. **Upload Screenshot** - Drag & drop Dream11 team screenshot
2. **Select Match** - Choose teams and match date
3. **Review Data** - Verify extracted players and captain/vice-captain
4. **Get Analysis** - AI-powered team insights and recommendations

## Features

- 📸 **OCR Extraction** - Automatically extract players from screenshots
- 🤖 **AI Analysis** - Detailed team performance insights
- 📊 **Match Statistics** - Head-to-head and venue analysis
- 🏏 **Multi-team Support** - Analyze multiple teams simultaneously
- 📱 **Mobile Optimized** - Responsive design for all devices

## File Structure

```
├── frontend/          # Web application
├── backend/           # Node.js API server
├── database/          # Database scripts and schema
└── data/             # Sample data and assets
```

## Troubleshooting

- **Backend issues**: Check `.env` file and API keys
- **OCR problems**: Ensure clear screenshot with visible player names
- **Port conflicts**: Verify ports 3000 (frontend) and 3001 (backend) are free

## API Endpoints

- `GET /api/health` - Server status
- `POST /api/ocr` - Image processing
- `POST /api/analysis` - Team analysis
- `GET /api/teams` - Available teams
- `GET /api/matches` - Recent matches
