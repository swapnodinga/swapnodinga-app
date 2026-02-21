# Deployment Guide

## Vercel Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "Fix auth, credentials, and deployment issues"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New** → **Project**
3. Import your `swapnodinga-app` repository
4. Framework preset: **Vite** (auto-detected)
5. Root Directory: `./` (project root)
6. Build Command: `npm run build`
7. Output Directory: `dist`

### 3. Environment Variables (Required)

Add these in Vercel Project Settings → Environment Variables:

| Name | Value | Notes |
|------|-------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | e.g. `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | From Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | **Required for installments to load** (bypasses RLS) |

### 4. Deploy

Click **Deploy**. The build will run and your app will be live.

---

## Local Development

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials
3. Run `npm install` and `npm run dev`

---

## Notes

- **Installments API**: `/api/transactions` is a Vercel serverless function that fetches installments using the service role key (bypasses RLS). Add `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars for installments to show.
- **Reset Password**: Requires the user to be logged in. Use "Change Password" from the sidebar when logged in, or visit `/reset-password` after signing in.
