# Dream11 Team Analyzer - Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
3. **OpenAI API Key**: Get from [platform.openai.com](https://platform.openai.com/api-keys)
4. **OCR.space API Key**: Get free key from [ocr.space/ocrapi](https://ocr.space/ocrapi)

## Step 1: Set Up Supabase Database

1. Create a new Supabase project
2. Go to Settings → API to get your project URL and anon key
3. Run the SQL schema from `database/schema.sql` in your Supabase SQL editor

## Step 2: Configure Environment Variables

### For Local Development:
Create `backend/.env` file with:
```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OCR_API_KEY=your_ocr_space_api_key
OPENAI_API_KEY=your_openai_api_key

MAX_FILE_SIZE=5MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg
```

### For Vercel Deployment:
Add these environment variables in Vercel dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OCR_API_KEY`
- `OPENAI_API_KEY`
- `NODE_ENV=production`
- `FRONTEND_URL=https://your-domain.vercel.app`

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts and set environment variables
```

### Option B: Using GitHub Integration
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically

## Step 4: Update Frontend Configuration

After deployment, update the API base URL in your frontend files:

### Update `frontend/js/enhanced-app.js`:
```javascript
// Change from localhost to your Vercel domain
const API_BASE_URL = 'https://your-domain.vercel.app/api';
```

## Step 5: Test Your Deployment

1. Visit your Vercel domain
2. Test the tour selection
3. Upload a team screenshot
4. Verify OCR and analysis work
5. Check role detection and summaries

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Ensure `FRONTEND_URL` is set correctly
2. **API Key Errors**: Verify all environment variables are set
3. **Database Connection**: Check Supabase URL and key
4. **File Upload**: Ensure file size limits are appropriate

### Debug Steps:
1. Check Vercel function logs
2. Verify environment variables in Vercel dashboard
3. Test API endpoints directly
4. Check browser console for errors

## Production Considerations

1. **Rate Limiting**: Already configured in backend
2. **Security**: Helmet.js is configured
3. **File Upload**: Multer with size limits
4. **Error Handling**: Comprehensive error responses

## Monitoring

- Use Vercel Analytics for performance
- Monitor API usage in OpenAI dashboard
- Check Supabase dashboard for database usage
- Set up alerts for API rate limits

## Cost Estimation

- **Vercel**: Free tier (100GB bandwidth, 100 serverless function executions/day)
- **Supabase**: Free tier (500MB database, 50MB file storage)
- **OpenAI**: Pay per use (~$0.01-0.03 per analysis)
- **OCR.space**: Free tier (500 requests/day)

## Next Steps

1. Set up custom domain (optional)
2. Configure monitoring and alerts
3. Set up automated backups
4. Implement user authentication (if needed)
5. Add more cricket tours and data 