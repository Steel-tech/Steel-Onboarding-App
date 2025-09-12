# New Hire App Testing Checklist

Before sending to new hires, test these critical workflows:

## Pre-Deployment Testing

### ✅ Local Testing
- [ ] Open `index.html` in browser directly
- [ ] All tabs load without errors
- [ ] Forms can be filled out and saved
- [ ] Progress tracking works
- [ ] Supabase connection successful (check browser console)

### ✅ Environment Check
- [ ] `.env` file has all required variables
- [ ] Supabase project is active and accessible
- [ ] Database tables exist (user_profiles, onboarding_progress)
- [ ] HR email (tasha@fsw-denver.com) is configured correctly

## Deployment Testing

### ✅ Deploy to Netlify
```bash
./deploy-static.sh
```

### ✅ Live Site Testing
- [ ] Site loads at deployment URL
- [ ] No console errors in browser dev tools
- [ ] Forms submit without errors
- [ ] Progress saves between sessions
- [ ] Mobile responsive design works
- [ ] All links and buttons functional

## New Hire Workflow Testing

### ✅ Complete Employee Journey
1. **Access Site**
   - [ ] URL loads quickly
   - [ ] Welcome screen appears
   - [ ] No loading errors

2. **Account Creation** (if using Supabase Auth)
   - [ ] Can create account with email
   - [ ] Email confirmation works
   - [ ] Login after confirmation successful

3. **Personal Information**
   - [ ] Form accepts all required fields
   - [ ] Data saves successfully
   - [ ] Progress updates correctly

4. **Safety Training**
   - [ ] All 4 modules load correctly
   - [ ] "Mark Complete" buttons work
   - [ ] Progress bar updates

5. **Company Story**
   - [ ] All sections display properly
   - [ ] Images and styling work
   - [ ] Mobile responsive

6. **Forms & Documents**
   - [ ] All forms open and display
   - [ ] Digital signature works
   - [ ] Form submission successful
   - [ ] Documents can be downloaded

7. **Final Submission**
   - [ ] Completion status accurate
   - [ ] "Email HR" functionality works
   - [ ] Confirmation message appears

### ✅ HR Notification Testing
- [ ] Tasha receives email notification when employee completes onboarding
- [ ] Email contains employee name and completion details
- [ ] No errors in email delivery

## Data Verification

### ✅ Database Check
- [ ] Employee data saved in Supabase
- [ ] Progress data captured correctly
- [ ] Form submissions recorded
- [ ] Audit trail complete

### ✅ Security Check
- [ ] No sensitive data in browser storage
- [ ] Supabase RLS policies working
- [ ] HTTPS encryption active
- [ ] No XSS or injection vulnerabilities

## Mobile Testing

### ✅ Phone/Tablet Testing
- [ ] Site works on iPhone Safari
- [ ] Site works on Android Chrome
- [ ] Forms usable on touchscreen
- [ ] Digital signatures work on mobile
- [ ] All content readable on small screens

## Performance Testing

### ✅ Load Testing
- [ ] Site loads in under 3 seconds
- [ ] Images optimized and load quickly
- [ ] No broken links or 404 errors
- [ ] Works on slow internet connections

## Final Go-Live Checklist

### ✅ Documentation Ready
- [ ] Update DEPLOYMENT-GUIDE-NEW-HIRES.md with actual URL
- [ ] Employee guide tested and accurate
- [ ] Contact information current

### ✅ Support Ready
- [ ] Tasha knows how to access employee data
- [ ] Troubleshooting procedures documented
- [ ] Backup contact method available

### ✅ Launch Ready
- [ ] All above items completed
- [ ] URL shared with HR team
- [ ] First test employee scheduled

---

## If Any Test Fails

**Don't send to new hires yet!**

1. Document the specific issue
2. Fix the problem
3. Re-run all related tests
4. Only proceed when all tests pass

## Emergency Contacts

- **Technical Issues**: Review this checklist and documentation
- **Database Problems**: Check Supabase dashboard
- **Email Issues**: Verify email configuration in `.env`
- **Deployment Issues**: Check Netlify deployment logs

---

*Complete this checklist before going live to ensure new hires have a smooth onboarding experience.*