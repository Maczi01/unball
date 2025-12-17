# Contact Form Setup Guide

## Overview

A fully functional contact form with rate limiting, built with Astro, React, and Supabase.

## Features

- ✅ Form validation with Zod
- ✅ Character counters for all fields
- ✅ Rate limiting (IP-based and email-based)
- ✅ Success/error feedback
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Accessibility compliant (ARIA)
- ✅ Stores submissions in Supabase

## Setup Instructions

### 1. Database Setup

Run the SQL migration in your Supabase SQL editor:

```bash
# Navigate to your Supabase project
# Dashboard → SQL Editor → New Query
# Copy and paste the contents of docs/contact-form-schema.sql
# Run the query
```

Or if using local Supabase:

```bash
# Apply the migration
supabase db push
```

The migration creates:
- `contact_submissions` table
- Indexes for efficient queries
- Row Level Security policies
- Proper constraints

### 2. Database Types (Optional but Recommended)

Regenerate TypeScript types to include the new table:

```bash
npm run generate-types
```

### 3. Verify Installation

Check that all files were created:

```
src/
├── components/
│   └── ContactForm.tsx          # React contact form component
├── lib/
│   └── services/
│       └── contact.service.ts   # Business logic for contact submissions
├── pages/
│   ├── contact.astro            # Contact page
│   └── api/
│       └── contact/
│           └── submit.ts        # API endpoint for form submission
docs/
├── contact-form-schema.sql      # Database migration
└── CONTACT_FORM_SETUP.md       # This file
```

### 4. Test the Form

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/contact`

3. Test the following scenarios:
   - Valid submission
   - Invalid email
   - Empty fields
   - Character limits (100 for email, 50 for topic, 500 for message)
   - Rate limiting (submit 3+ times quickly from the same email)

## Rate Limiting Configuration

Current limits (configurable in `src/lib/services/contact.service.ts`):

```typescript
const RATE_LIMITS = {
  MAX_MESSAGES_PER_IP_PER_DAY: 5,        // 5 messages per IP per 24 hours
  MAX_MESSAGES_PER_EMAIL_PER_HOUR: 2,    // 2 messages per email per hour
  COOLDOWN_HOURS: 24,                     // IP cooldown period
  EMAIL_COOLDOWN_HOURS: 1,                // Email cooldown period
};
```

## Viewing Submissions

### Option 1: Supabase Dashboard
1. Go to your Supabase project
2. Navigate to Table Editor
3. Select `contact_submissions`

### Option 2: Build an Admin Panel (Future Enhancement)

You can create an admin page at `/admin/contact-submissions` to:
- View all submissions
- Filter by status (pending/read/resolved)
- Mark submissions as read/resolved
- Search by email or topic

Example API endpoint (not included, but easy to add):

```typescript
// src/pages/api/admin/contact/submissions.ts
export const GET: APIRoute = async ({ locals }) => {
  const contactService = new ContactService(locals.supabase);
  const result = await contactService.getAllSubmissions({
    status: 'pending',
    limit: 20,
  });
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

## Email Notifications (Optional Enhancement)

To get email notifications when someone submits the form:

### Option 1: Supabase Edge Function + Resend

1. Create a Supabase Edge Function
2. Use the Resend API for sending emails
3. Trigger on `contact_submissions` insert

### Option 2: Database Webhook

1. Set up a webhook in Supabase
2. Point it to a service like Zapier or Make
3. Configure email notifications

### Option 3: Add nodemailer (Not Recommended)

If you really want to use nodemailer (requires Node.js adapter):

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

Add to `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@yourdomain.com
```

Update the API endpoint to send emails after successful submission.

## Customization

### Change Colors

The form uses Tailwind classes. Update colors in `src/components/ContactForm.tsx`:

- Primary color: `orange-500` → Change to your brand color
- Success color: `green-600`
- Error color: `red-600`

### Change Text

All text is in the component. Search for strings like:
- "Get in Touch"
- "Thank you!"
- "Your message has been sent successfully"

### Add More Fields

1. Update the Zod schema in `ContactForm.tsx`
2. Update the database schema in `contact-form-schema.sql`
3. Add the form field to the component
4. Update the API endpoint to handle the new field

## Troubleshooting

### Form submission fails with 400 error
- Check browser console for validation errors
- Verify Supabase connection is working
- Check that the table exists and has correct permissions

### Rate limiting not working
- Verify `contact_submissions` table has the necessary indexes
- Check that IP address is being captured correctly (test with `console.log`)
- Confirm timestamps are being stored correctly in UTC

### Dark mode not working
- Ensure your Layout or root component has dark mode provider
- Check Tailwind config includes dark mode support
- Verify `dark:` classes are being applied

### TypeScript errors
- Run `npm run generate-types` to update Supabase types
- Check that all imports are correct
- Verify `@/` path alias is configured

## Security Notes

- Rate limiting is enforced at the service layer
- IP addresses are stored for rate limiting only
- Row Level Security (RLS) is enabled on the submissions table
- Only admins can read submissions (enforced by RLS policy)
- Anyone can insert (required for public form)
- Input validation with Zod on both client and server
- XSS protection via React's automatic escaping

## Next Steps

Consider adding:
- [ ] Admin panel to view submissions
- [ ] Email notifications via Supabase Edge Functions
- [ ] Captcha/reCAPTCHA for spam prevention
- [ ] File attachments support
- [ ] Auto-responder email to user
- [ ] Analytics tracking
- [ ] Honeypot field for bot detection
