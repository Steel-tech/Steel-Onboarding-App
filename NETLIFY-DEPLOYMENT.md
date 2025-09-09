# Netlify Deployment Guide for Flawless Steel Welding Onboarding App

## Prerequisites

1. YouTube video uploaded and configured (see YOUTUBE-SETUP.md)
2. Video ID updated in `script.js` (line 1555)
3. All files ready in your project folder

## Step 1: Create Netlify Account

1. Go to [netlify.com](https://www.netlify.com)
2. Click "Sign up" → Choose "Sign up with email" or use GitHub/Google
3. Verify your email address
4. Complete account setup

## Step 2: Prepare Your Files

### Remove Large Video File

Since we're using YouTube, remove the large video file:

```bash
# In your project folder, remove the local video
rm orientation-video.mp4
```

### Required Files for Deployment

Your deployment should include:

- `index.html` (main application)
- `script.js` (application logic)
- `styles.css` (styling)
- `fsw-onboarding-processor.js` (n8n script)
- `fsw-report-generator.js` (n8n script)
- `Flawless Steel Logo_vector_ydMod3 (002) Page 003.jpg` (company logo)
- `YOUTUBE-SETUP.md` (setup instructions)
- `NETLIFY-DEPLOYMENT.md` (this file)

## Step 3: Deploy to Netlify

### Option A: Drag & Drop Deployment (Easiest)

1. Log into your Netlify dashboard
2. Look for "Want to deploy a new site without connecting to Git? Drag and drop your site output folder"
3. Select ALL your project files (except orientation-video.mp4)
4. Drag them into the deployment area
5. Wait for deployment to complete (usually 1-2 minutes)
6. You'll get a URL like: `https://amazing-name-123456.netlify.app`

### Option B: Git Repository Deployment

1. Create a GitHub repository for your project
2. Upload all files (except orientation-video.mp4) to GitHub
3. In Netlify: "New site from Git" → Connect GitHub
4. Select your repository
5. Deploy settings:
   - Build command: (leave empty)
   - Publish directory: (leave empty or set to `/`)
6. Click "Deploy site"

## Step 4: Configure Your Site

### Custom Domain (Optional)

1. In Netlify dashboard → "Domain settings"
2. Click "Add custom domain"
3. Enter your domain (e.g., `onboarding.flawlesssteel.com`)
4. Follow DNS configuration instructions
5. SSL certificate will be automatically provided

### Site Settings

1. **Site name**: Change from random name to something meaningful
   - Go to "Site settings" → "General" → "Site details"
   - Change site name to: `fsw-onboarding` or similar

2. **Password protection** (Recommended for employee access):
   - Go to "Site settings" → "Visitor access"
   - Enable "Password protect this site"
   - Set password: Choose something employees can remember
   - Distribute URL and password to new employees

## Step 5: Test Your Deployed Site

1. Visit your Netlify URL
2. Test the YouTube video loads and plays
3. Test form submissions and progress tracking
4. Test on mobile devices
5. Verify all sections work correctly

## Step 6: Employee Access Instructions

### For HR/Management

Create a simple instruction sheet for new employees:

```text
Flawless Steel Welding - Online Onboarding

1. Go to: [YOUR_NETLIFY_URL]
2. Password: [YOUR_PASSWORD] (if enabled)
3. Complete all sections:
   - Welcome & Company Story
   - Orientation Video (required viewing)
   - Safety Training Modules
   - Download Documents
   - Complete Employee Information Form
4. Contact HR at (720) 638-7289 with questions

Access from any device - computer, tablet, or phone!
```

## Maintenance and Updates

### Updating Content

1. Edit files locally
2. Re-deploy using same method (drag & drop or Git push)
3. Changes go live immediately

### Monitoring Usage

- Netlify provides basic analytics in your dashboard
- See visitor count, bandwidth usage, and form submissions
- Free tier includes: 100GB bandwidth/month, 300 build minutes

### Backup Strategy

- Keep local copies of all files
- Consider GitHub repository for version control
- Export employee data regularly if using form submissions

## Troubleshooting

### Video Not Loading

- Check YouTube video is set to "Unlisted" (not Private)
- Verify VIDEO_ID is correct in `script.js`
- Check browser console for errors

### Site Not Loading

- Check Netlify deploy log for errors
- Ensure all files uploaded correctly
- Verify no missing dependencies

### Form Submissions Not Working

- Check Netlify Forms are enabled (automatically detected)
- Verify form has `name` attribute
- Check Netlify dashboard → Forms section

## Cost Considerations

### Free Tier Limits (Netlify)

- 100GB bandwidth/month
- 300 build minutes/month
- 100 form submissions/month
- Basic SSL and CDN included

### When You Might Need to Upgrade

- More than 100 employees accessing per month
- Need advanced form handling
- Want custom redirects or headers
- Require team collaboration features

For most small to medium businesses, the free tier is sufficient for employee onboarding.