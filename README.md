# 🏏 Dream11 Team Analyzer

AI-powered fantasy cricket team analysis with OCR, performance insights, and comprehensive team comparison features.

## 🚀 Features

- 📸 **OCR Extraction** - Automatically extract players from Dream11 screenshots
- 🤖 **AI Analysis** - Detailed team performance insights with ratings
- 📊 **Team Comparison** - Compare multiple teams with scenario-based recommendations
- 🏆 **Expert Recommendations** - Cricbuzz-themed UI with comprehensive analysis
- 📱 **Mobile Optimized** - Responsive design for all devices
- 🔄 **Multi-team Support** - Analyze and compare multiple teams simultaneously
- 📈 **Match Statistics** - Head-to-head and venue analysis
- 🎯 **Scenario Analysis** - Recommendations for different match conditions

## 🛠️ Quick Setup

### Prerequisites
- Node.js 16+ installed
- OCR.space API key (free)
- OpenAI API key (optional, for AI analysis)

### Step 1: Get API Keys

#### OCR.space API Key (Free - Required)
1. Go to [OCR.space API](https://ocr.space/ocrapi)
2. Click "Register for Free API Key"
3. Enter your email and get your API key
4. Free tier: 25,000 requests/month

#### OpenAI API Key (Optional - For AI Analysis)
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign up/Login and create a new API key
3. Copy the key (starts with `sk-`)

### Step 2: Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create environment file from template
cp env-example.txt .env

# Edit .env file with your API keys
```

Edit `backend/.env` file:
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
OCR_API_KEY=your_ocr_space_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

```bash
# Start the backend server
npm start
```

### Step 3: Frontend Setup

Open a **new terminal window** and:

```bash
# Navigate to frontend folder (from project root)
cd frontend

# Start a simple HTTP server
python -m http.server 3000
```

**Alternative methods:**
```bash
# Using Node.js http-server
npx http-server -p 3000 -c-1

# Using VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

### Step 4: Test the Application

1. **Open browser:** `http://localhost:3000`
2. **Verify backend:** `http://localhost:3001/api/health`
3. **Upload test:** Try uploading a Dream11 screenshot
4. **Check console:** Look for any errors in browser developer tools

## 📱 How to Use

### 1. Upload Dream11 Screenshot
- Take a screenshot of your Dream11 team selection screen
- Make sure player names are clearly visible
- Drag & drop or click to upload (JPG/PNG, max 5MB)

### 2. Fill Match Details
- **Team A & B:** Select from IPL 2025 teams dropdown
- **Match Date:** Choose the match date
- **Important:** Teams must be different

### 3. View Extracted Data
- App will automatically extract 11 players
- Captain (C) and Vice-Captain (VC) will be detected
- Review the extracted information

### 4. Get AI Analysis (Optional)
- Click "🤖 Get AI Analysis" if you have OpenAI API key
- Wait for detailed team analysis and suggestions

### 5. Compare Teams (New Feature)
- Upload multiple teams
- Click "Compare Teams & Get Recommendations"
- Get comprehensive analysis with:
  - Overall analysis summary
  - Team patterns & strategies
  - Scenario-based recommendations
  - Best overall team selection

## 🚀 Deployment to Vercel

### Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: Your code should be in a GitHub repository
3. **Environment Variables**: Prepare your environment variables

### Deployment Steps

#### Option A: Using Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Click "New Project"**
3. **Import Git Repository**: Select your GitHub repository
4. **Configure Project**:
   - Framework Preset: Other
   - Root Directory: `./` (root of your project)
   - Build Command: Leave empty (handled by vercel.json)
   - Output Directory: Leave empty (handled by vercel.json)

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Environment Variables Setup

Set these environment variables in Vercel Dashboard:

**Required:**
```bash
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
```

**Optional:**
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
PORT=3001
```

### After Deployment

Your app will be available at:
- **Main App**: `https://your-project-name.vercel.app/frontend/index.html`
- **Team Analysis**: `https://your-project-name.vercel.app/frontend/team-analysis-tabbed.html`
- **Bulk Analysis**: `https://your-project-name.vercel.app/frontend/bulk-analysis.html`
- **API Endpoints**: `https://your-project-name.vercel.app/api/*`

## 📂 Project Structure

```
dream11-analyzer/
├── frontend/              # Web application
│   ├── index.html         # Main web page
│   ├── team-analysis-tabbed.html  # Enhanced team analysis
│   ├── bulk-analysis.html # Bulk analysis interface
│   ├── js/               # JavaScript files
│   └── css/              # Stylesheets
├── backend/              # Node.js API server
│   ├── server.js         # Express server
│   ├── controllers/      # API controllers
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   └── package.json      # Node.js dependencies
├── api/                  # Vercel API handler
│   └── index.js
├── database/             # Database scripts and schema
├── data/                 # Sample data and assets
├── vercel.json           # Vercel configuration
├── .vercelignore         # Files to ignore in deployment
└── package.json          # Root package.json
```

## 🔧 API Endpoints

### Core Endpoints
- `GET /api/health` - Server status
- `POST /api/ocr` - Image processing and player extraction
- `POST /api/analyze` - Single team analysis
- `POST /api/team-summary` - Team summary analysis
- `POST /api/analyze-multiple` - Multiple teams comparison
- `GET /api/teams` - Available teams
- `GET /api/validate` - Player validation

### Analysis Endpoints
- `GET /api/team-form` - Team recent form
- `GET /api/head-to-head` - Head-to-head statistics
- `GET /api/venue-stats` - Venue statistics
- `GET /api/player-performance` - Player performance data

## 🛠️ Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check if Node.js is installed
node --version

# Should show v16+ or higher
# If not installed, download from https://nodejs.org
```

#### "OCR API key not configured"
1. Check your `.env` file exists in `backend/` folder
2. Verify the API key is correct (no extra spaces)
3. Restart backend server after editing `.env`

#### Frontend Shows Blank Page
1. Make sure you're accessing `http://localhost:3000`
2. Check browser console for JavaScript errors
3. Verify frontend server is running

#### "Failed to fetch" Error
1. **Check backend is running:** Go to `http://localhost:3001/api/health`
2. **Port conflicts:** Make sure nothing else uses port 3001
3. **CORS issues:** Ensure frontend runs on port 3000

#### OCR Not Detecting Players
1. **Screenshot quality:** Ensure text is clear and readable
2. **Supported format:** Use JPG or PNG only
3. **File size:** Keep under 5MB
4. **Player names visible:** Names should be clearly visible in screenshot

#### Captain/Vice-Captain Not Detected
- Make sure C and VC markers are visible in screenshot
- The improved detection looks for C/VC markers near player names
- If still not working, you can see debug info in backend terminal

### Development Mode

For development with auto-reload:

```bash
# Backend with nodemon
cd backend
npm run dev

# Frontend - no change needed, just refresh browser
```

## 🎯 Key Features Explained

### Enhanced Team Comparison
- **Overall Analysis Summary**: Analyzes all teams together
- **Team Patterns & Strategies**: Identifies captaincy and composition trends
- **Scenario-Based Recommendations**: Best team for different match conditions
- **Best Overall Team**: Highlights the top-performing team

### AI-Powered Analysis
- **Team Balance**: Composition analysis with ratings
- **Captaincy Choice**: Captain/vice-captain evaluation
- **Match Advantage**: Team-specific advantages
- **Venue Strategy**: Venue-specific recommendations
- **Covariance Analysis**: Player combination analysis
- **Pitch Conditions**: Pitch-specific insights
- **Overall Rating**: Comprehensive team rating

### OCR Improvements
- **Enhanced Detection**: Better player name extraction
- **Captain/Vice-Captain Detection**: Automatic C/VC identification
- **Error Handling**: Robust error management
- **Debug Information**: Detailed extraction logs

## 📈 Performance & Monitoring

### Vercel Deployment
- **Automatic Scaling**: Handles traffic spikes
- **Global CDN**: Fast loading worldwide
- **Function Logs**: Monitor API performance
- **Analytics**: Built-in performance tracking

### Local Development
- **Hot Reload**: Backend auto-restart with nodemon
- **Error Logging**: Detailed error messages
- **API Testing**: Built-in health check endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check this README and other .md files
- **API Documentation**: Check the backend routes for endpoint details

---

**Made with ❤️ for cricket fans and fantasy sports enthusiasts!**
