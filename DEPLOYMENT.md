# Vercel Deployment Guide for Dream11 Team Analyzer

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: Your code should be in a GitHub repository
3. **Environment Variables**: Prepare your environment variables

## Environment Variables Setup

You'll need to set these environment variables in Vercel:

### Required Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration (if using Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Node Environment
NODE_ENV=production
```

### Optional Environment Variables

```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Server Configuration
PORT=3001
```

## Deployment Steps

### Step 1: Prepare Your Repository

1. **Push to GitHub**: Make sure your code is pushed to a GitHub repository
2. **Check Configuration Files**: Ensure these files are in your repository:
   - `vercel.json`
   - `api/index.js`
   - `.vercelignore`
   - `package.json` (root and backend)

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Set project name
   - Confirm deployment settings

#### Option B: Using Vercel Dashboard

1. **Go to Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Click "New Project"**
3. **Import Git Repository**: Select your GitHub repository
4. **Configure Project**:
   - Framework Preset: Other
   - Root Directory: `./` (root of your project)
   - Build Command: Leave empty (handled by vercel.json)
   - Output Directory: Leave empty (handled by vercel.json)

### Step 3: Set Environment Variables

1. **Go to Project Settings** in Vercel Dashboard
2. **Navigate to Environment Variables**
3. **Add each environment variable**:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
   - Environment: Production (and Preview if needed)
4. **Repeat for all required variables**

### Step 4: Deploy

1. **Click "Deploy"** in Vercel Dashboard
2. **Wait for build to complete**
3. **Your app will be available at**: `https://your-project-name.vercel.app`

## Project Structure for Vercel

```
your-project/
├── frontend/           # Static files (HTML, CSS, JS)
├── backend/           # Backend code
├── api/              # Vercel API handler
│   └── index.js
├── vercel.json       # Vercel configuration
├── .vercelignore     # Files to ignore
├── package.json      # Root package.json
└── DEPLOYMENT.md     # This file
```

## API Endpoints

After deployment, your API endpoints will be available at:

- **Base URL**: `https://your-project-name.vercel.app/api`
- **OCR**: `/api/ocr`
- **Analysis**: `/api/analyze`, `/api/team-summary`, `/api/analyze-multiple`
- **Teams**: `/api/teams`
- **Validation**: `/api/validate`
- **Health**: `/api/health`

## Frontend Access

Your frontend files will be served from:

- **Main App**: `https://your-project-name.vercel.app/frontend/index.html`
- **Team Analysis**: `https://your-project-name.vercel.app/frontend/team-analysis-tabbed.html`
- **Bulk Analysis**: `https://your-project-name.vercel.app/frontend/bulk-analysis.html`

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check environment variables are set correctly
   - Ensure all dependencies are in package.json
   - Check vercel.json configuration

2. **API Errors**:
   - Verify API routes in vercel.json
   - Check environment variables
   - Review serverless function logs

3. **CORS Issues**:
   - Update CORS configuration in backend/server.js
   - Add your Vercel domain to allowed origins

### Debugging

1. **Check Vercel Logs**:
   - Go to Project Dashboard
   - Click on "Functions" tab
   - View function logs

2. **Test API Endpoints**:
   - Use tools like Postman or curl
   - Test with: `https://your-project-name.vercel.app/api/health`

## Custom Domain (Optional)

1. **Add Custom Domain** in Vercel Dashboard
2. **Configure DNS** as instructed by Vercel
3. **Update CORS** if needed

## Monitoring

- **Vercel Analytics**: Available in dashboard
- **Function Logs**: Monitor API performance
- **Error Tracking**: Set up error monitoring

## Updates

To update your deployment:

1. **Push changes** to GitHub
2. **Vercel will automatically redeploy** (if auto-deploy is enabled)
3. **Or manually deploy** using Vercel CLI or dashboard

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: Available in dashboard
- **Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions) 