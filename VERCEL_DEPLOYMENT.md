# Vercel Deployment Guide

Deploy ExtractLab to Vercel in 5 minutes.

## Prerequisites

- Vercel account (free at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)
- Anthropic API key

## Step 1: Push Code to Git

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Ready for Vercel deployment"
git remote add origin <your-github-repo>
git push -u origin main
```

## Step 2: Create Vercel Account & Project

1. Go to https://vercel.com
2. Sign up (free)
3. Click "Add New..." → "Project"
4. Import your Git repository
5. Click "Import"

## Step 3: Set Environment Variables

Vercel will show you a form to add environment variables:

**Add this variable:**
```
ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxxxxx
```

(Paste your actual API key from console.anthropic.com)

Then click "Deploy"

## Step 4: Wait for Deployment

Vercel will:
- Build your Next.js app
- Deploy serverless functions
- Give you a live URL (something like `extractlab.vercel.app`)

Takes about 2-3 minutes.

## Step 5: Test It

1. Open the Vercel URL (e.g., `https://extractlab.vercel.app`)
2. Create a review
3. Click "Start Review"
4. Upload a portfolio screenshot
5. Should extract holdings in 2-3 seconds ✅

## Step 6: Add Custom Domain (Optional)

If you want `extractlab.leet.sg`:

1. In Vercel dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter `extractlab.leet.sg`
4. Vercel will show you DNS records to add
5. Go to your domain registrar (GoDaddy, Namecheap, etc.)
6. Add the CNAME record Vercel gives you
7. Wait 5-10 minutes for DNS to propagate
8. Done! Your app is live at `extractlab.leet.sg`

## Deploying Updates

After any code changes:

```bash
git add .
git commit -m "Add new features"
git push
```

Vercel automatically detects the push and redeploys (takes 1-2 minutes).

## Troubleshooting

### API Key Not Working
- Check `.env` variable is set in Vercel dashboard
- Verify API key is valid at console.anthropic.com
- Redeploy after changing the key

### Extraction Fails
- Check Vercel logs: Dashboard → Project → Deployments → View Logs
- Look for `[API/EXTRACT]` messages
- Verify API key has access to claude-opus-4-6

### CORS Errors
- The API function already handles CORS
- Should work from any domain
- Check browser console for exact error

### Custom Domain Not Working
- DNS changes take 5-10 minutes to propagate
- Use `nslookup extractlab.leet.sg` to verify DNS
- Try clearing browser cache

## Monitoring

Monitor your app in Vercel dashboard:
- **Deployments** - See build logs and errors
- **Analytics** - View usage and performance
- **Settings** - Manage domains and environment variables

## Rolling Back

If something breaks:

1. Go to Vercel dashboard
2. Click "Deployments"
3. Find the previous working deployment
4. Click "..." → "Promote to Production"

Done! Automatically rolls back.

## Next Steps

- Share extractlab.leet.sg with your team
- Get feedback on the extraction accuracy
- Plan Phase 4 features (reports, database, etc.)
- Update in real-time: git push = live update
