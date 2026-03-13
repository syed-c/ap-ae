# Quick Edit Guide for AppointPanda

## 🎨 Where to Edit Common Things

### Homepage Content
- **Main Homepage:** `/app/pages/index.tsx` or `/app/src/pages/Index.tsx`
- **Hero Section:** `/app/src/components/hero/` directory
- **Search Box:** `/app/src/components/SearchBox.tsx`

### Styling
- **Global Styles:** `/app/src/index.css`
- **Tailwind Config:** `/app/tailwind.config.ts`
- **Component Styles:** Most use Tailwind classes inline

### Components
- **UI Components:** `/app/src/components/ui/` (shadcn components)
- **Custom Components:** `/app/src/components/`
- **Navbar:** `/app/src/components/Navbar.tsx`
- **Footer:** `/app/src/components/Footer.tsx`

### Pages
- **About:** `/app/pages/about.tsx`
- **Contact:** `/app/pages/contact.tsx`
- **Pricing:** `/app/pages/pricing.tsx`
- **FAQ:** `/app/pages/faq.tsx`
- **Search Results:** `/app/pages/search.tsx`

### Admin & Dashboard
- **Admin Dashboard:** `/app/pages/admin.tsx`
- **Dentist Dashboard:** `/app/pages/dashboard.tsx` or `/app/pages/dashboard-v2.tsx`
- **Admin Components:** `/app/src/components/admin/`
- **Dashboard Components:** `/app/src/components/dashboard/` or `/app/src/components/dashboard-v2/`

### Booking System
- **Booking Modal:** `/app/src/components/BookingModal.tsx`
- **Multi-step Booking:** `/app/src/components/MultiStepBookingModal.tsx`
- **Calendar Booking:** `/app/src/components/booking/CalendarBookingForm.tsx`

### API Routes (Next.js API)
- **All API Routes:** `/app/pages/api/`
- **Supabase Proxy:** `/app/pages/api/sb/[[...path]].ts`

### Database & Backend
- **Supabase Client:** `/app/src/integrations/supabase/client.ts`
- **Database Types:** `/app/src/integrations/supabase/types.ts`
- **Custom Hooks:** `/app/src/hooks/` (for data fetching)

### SEO & Meta
- **SEO Component:** `/app/src/components/seo/SEOHead.tsx`
- **Structured Data:** `/app/src/components/seo/StructuredData.tsx`
- **Meta Tags:** `/app/src/components/analytics/MetaTagInjector.tsx`

## 🔧 Making Changes

1. **Edit any file** - Changes will auto-reload (hot reload enabled)
2. **Add new dependencies:**
   ```bash
   cd /app && yarn add package-name
   ```
3. **View changes** - Check http://localhost:3000 or your preview URL

## 📊 Viewing Logs

```bash
# Next.js application logs
tail -f /var/log/supervisor/nextjs.out.log

# Next.js error logs
tail -f /var/log/supervisor/nextjs.err.log
```

## 🚀 Restart After Major Changes

```bash
sudo supervisorctl restart nextjs
```

## 💡 Tips

- **TypeScript:** This is a TypeScript project - type checking is lenient (strict: false)
- **Hot Reload:** Most changes reflect immediately without restart
- **Component Library:** Uses shadcn-ui components in `/app/src/components/ui/`
- **Icons:** Uses `lucide-react` for icons
- **Forms:** Uses `react-hook-form` + `zod` for validation

## 📱 Project Features to Edit

### Frontend Features:
- Search & Filter dentists
- Booking appointments
- Dentist profiles
- Clinic pages
- Blog system
- Review system
- Insurance information

### Admin Features (Login required):
- Manage clinics
- Manage dentists
- SEO tools
- Content management
- Analytics
- User management

### Dentist Dashboard Features (Login required):
- View appointments
- Manage availability
- Review management
- Profile editing
- Patient forms
- Analytics

Happy editing! 🎉
