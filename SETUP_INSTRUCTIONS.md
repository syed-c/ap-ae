# AppointPanda Setup Instructions

## ✅ Repository Cloned Successfully!

Your repository `https://github.com/syed-c/ap-ae` has been successfully cloned and set up in the workspace.

## 🚀 Current Status

- ✅ Repository cloned from GitHub
- ✅ Dependencies installed (yarn)
- ✅ Next.js development server running on port 3000
- ⚠️ Environment variables need to be configured

## 🔧 Next Steps Required

### 1. Configure Supabase Environment Variables

The application requires Supabase credentials to work properly. You need to add your Supabase project details:

**File to edit:** `/app/.env.local`

**Required variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

**Where to find these values:**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Go to: **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 2. Restart the Next.js Server (if you update .env.local)

After adding your Supabase credentials, restart the server:
```bash
sudo supervisorctl restart nextjs
```

## 📂 Project Structure

This is a **Next.js 14** application with:
- **Framework:** Next.js 14.2.3 (App Router + Pages Router)
- **Database:** Supabase (PostgreSQL)
- **UI Library:** shadcn-ui + Radix UI
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **State Management:** React Query (@tanstack/react-query)

## 🎯 Key Directories

```
/app/
├── pages/              # Next.js pages (routing)
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── integrations/   # Supabase client
│   ├── pages/          # Additional page components
│   └── types/          # TypeScript types
├── public/             # Static assets
└── supabase/           # Supabase migrations & functions
```

## 🔌 Services Running

- **Next.js Development Server:** Port 3000 (running via supervisor)
- **MongoDB:** Port 27017 (running, but may not be needed for this app)

## 📝 Available Commands

```bash
# View Next.js logs
tail -f /var/log/supervisor/nextjs.out.log

# Check service status
sudo supervisorctl status

# Restart Next.js server
sudo supervisorctl restart nextjs

# Install new dependencies
cd /app && yarn add package-name

# Build for production
cd /app && yarn build
```

## 🌐 Preview URL

Once your environment variables are configured, your app should be accessible at:
- Local development: http://localhost:3000
- Preview URL: (will be provided by Emergent platform)

## 📚 Features in This App

Based on the codebase, this application includes:
- **Dental Clinic Listings** - Search and find dental clinics
- **Appointment Booking** - Book appointments with dentists
- **Dentist Profiles** - Detailed dentist and clinic pages
- **Admin Dashboard** - Comprehensive admin panel
- **Dentist Dashboard** - Dashboard for dental practices
- **SEO Optimization** - Advanced SEO features
- **Blog System** - Content management for dental articles
- **Review System** - Patient reviews and ratings
- **Insurance Integration** - Insurance provider information
- **Multi-location Support** - Coverage across different emirates/states
- **AI-powered Search** - Smart search functionality
- **Reputation Management** - Review and reputation tools for dentists

## ⚠️ Important Notes

1. **Environment Variables:** The app won't function properly without Supabase credentials
2. **Database:** Make sure your Supabase project has the necessary tables (use migrations in `/app/supabase/migrations/`)
3. **Hot Reload:** The development server supports hot reload - changes to code will reflect automatically

## 🐛 Troubleshooting

**If the app doesn't load:**
1. Check Next.js logs: `tail -f /var/log/supervisor/nextjs.out.log`
2. Verify environment variables in `.env.local`
3. Ensure Supabase credentials are correct
4. Restart the server: `sudo supervisorctl restart nextjs`

**If you see database errors:**
- Run Supabase migrations from your Supabase dashboard
- Check that your Supabase project is active

## 🎉 You're All Set!

Your repository is now ready for editing and preview. Once you add your Supabase credentials, the application will be fully functional.

Need help? Let me know what you'd like to work on!
