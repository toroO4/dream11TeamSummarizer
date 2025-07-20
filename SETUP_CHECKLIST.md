# Dream11 Team Analyzer - Setup Checklist

## ✅ Prerequisites (Complete these first)

### 1. API Keys & Services
- [ ] **OpenAI API Key**: Get from [platform.openai.com](https://platform.openai.com/api-keys)
- [ ] **OCR.space API Key**: Get free key from [ocr.space/ocrapi](https://ocr.space/ocrapi)
- [ ] **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
- [ ] **Vercel Account**: Sign up at [vercel.com](https://vercel.com)

### 2. Database Setup
- [ ] Create new Supabase project
- [ ] Get project URL and anon key from Settings → API
- [ ] Run `database/schema.sql` in Supabase SQL editor
- [ ] Test database connection

### 3. Local Environment
- [ ] Create `backend/.env` file with your API keys
- [ ] Test local development server
- [ ] Verify OCR and AI analysis work locally

## 🚀 Deployment Steps

### Step 1: Prepare Code
- [ ] Ensure all files are committed to git
- [ ] Verify `vercel.json` configuration
- [ ] Check API base URL auto-detection

### Step 2: Deploy to Vercel
- [ ] Run `./deploy.sh` or use Vercel CLI
- [ ] Follow deployment prompts
- [ ] Note your deployment URL

### Step 3: Configure Environment Variables
In Vercel dashboard, add these environment variables:
- [ ] `SUPABASE_URL` = your_supabase_project_url
- [ ] `SUPABASE_ANON_KEY` = your_supabase_anon_key
- [ ] `OCR_API_KEY` = your_ocr_space_api_key
- [ ] `OPENAI_API_KEY` = your_openai_api_key
- [ ] `NODE_ENV` = production
- [ ] `FRONTEND_URL` = https://your-domain.vercel.app

### Step 4: Test Deployment
- [ ] Visit your Vercel domain
- [ ] Test tour selection
- [ ] Upload team screenshot
- [ ] Verify OCR extraction
- [ ] Check AI analysis
- [ ] Test role detection
- [ ] Verify mini summary display

## 🔧 Troubleshooting

### Common Issues:
- [ ] CORS errors → Check `FRONTEND_URL` environment variable
- [ ] API key errors → Verify all environment variables are set
- [ ] Database connection → Check Supabase URL and key
- [ ] File upload issues → Check file size limits

### Debug Steps:
- [ ] Check Vercel function logs
- [ ] Verify environment variables
- [ ] Test API endpoints directly
- [ ] Check browser console for errors

## 📊 Cost Monitoring

### Free Tier Limits:
- **Vercel**: 100GB bandwidth, 100 serverless function executions/day
- **Supabase**: 500MB database, 50MB file storage
- **OpenAI**: Pay per use (~$0.01-0.03 per analysis)
- **OCR.space**: 500 requests/day

### Monitoring:
- [ ] Set up Vercel Analytics
- [ ] Monitor OpenAI API usage
- [ ] Check Supabase dashboard
- [ ] Set up rate limit alerts

## 🎯 Success Criteria

Your deployment is successful when:
- [ ] Website loads without errors
- [ ] Tour selection works
- [ ] Screenshot upload works
- [ ] OCR extracts player names correctly
- [ ] AI analysis generates insights
- [ ] Role detection shows accurate breakdown
- [ ] Mini summary displays properly
- [ ] All features work in production

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Vercel function logs
3. Verify all environment variables
4. Test API endpoints individually
5. Check browser console for errors 