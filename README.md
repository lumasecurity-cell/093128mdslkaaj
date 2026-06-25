# Sleepy UD — Website

Full-stack site on Cloudflare: static frontend served by Pages, API handled by Pages Functions, database on D1.

## Project Structure

```
Site/
├── public/                   # Static frontend (HTML, CSS, JS)
│   ├── index.html                  # Landing page
│   ├── pricing.html                # Product pricing
│   ├── login.html                  # Login (username/password or key)
│   ├── register.html               # Account registration
│   ├── dashboard/
│   │   ├── owner.html              # Owner: key generation & management
│   │   └── customer.html           # Customer: profile, keys, downloads
│   ├── css/style.css
│   └── js/api.js
├── functions/api/
│   └── [[catchall]].js       # All API routes (Cloudflare Pages Function)
├── schema.sql                 # D1 database schema
├── wrangler.toml              # Wrangler config
└── README.md
```

## Quick Start (Local Dev)

### Prerequisites
- Node.js v18+ installed
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/): `npm install -g wrangler`
- A Cloudflare account (free tier works)

### 1. Create the D1 database

```bash
npx wrangler d1 create sleepy-ud-db
```

This prints a `database_id`. Copy it and paste into `wrangler.toml`.

### 2. Initialize the schema

```bash
npx wrangler d1 execute sleepy-ud-db --file=schema.sql
```

### 3. Run locally

```bash
npx wrangler pages dev public --d1 DB
```

Opens at **http://localhost:8788** — both frontend and API work together.

### Default owner account
- Username: `admin`
- Password: `admin123`

**Change the password after first login.**

---

## Cloudflare Deployment Guide

### Step 1: Push to GitHub

Create a repo on GitHub, then:

```bash
cd "C:\Sleepy UD\Site"
git init
git add -A
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/sleepy-ud.git
git branch -M main
git push -u origin main
```

### Step 2: Create the D1 database

In the Cloudflare dashboard:
- Go to **Workers & Pages** → **D1** → **Create database**
- Name: `sleepy-ud-db`
- Click **Create**

### Step 3: Initialize the schema

```bash
npx wrangler d1 execute sleepy-ud-db --file=schema.sql
```

### Step 4: Deploy to Cloudflare Pages

1. Go to https://dash.cloudflare.com → **Workers & Pages** → **Pages** → **Create a project** → **Connect to Git**
2. Authorize GitHub and select the `sleepy-ud` repo
3. Build settings:
   - **Project name:** `sleepy-ud` (choose whatever)
   - **Build command:** leave empty
   - **Build output directory:** `public`
4. Click **Deploy**

### Step 5: Add the D1 binding

1. In your Pages project → **Settings** → **Functions** → **D1 database bindings**
2. Click **Add binding**
   - **Binding name:** `DB`
   - **Database:** select `sleepy-ud-db`
3. Click **Save**

### Step 6: Add environment variables

In your Pages project → **Settings** → **Environment variables** → **Add variable**:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | Generate a random string (use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |

### Step 7: Redeploy

Go to **Deployments** tab → click the three dots on the latest deployment → **Retry deployment**.

The site is now live at `https://sleepy-ud.pages.dev`

---

## Namecheap Domain → Cloudflare Setup

### 1. Add your domain to Cloudflare

1. In Cloudflare dashboard → **Websites** → **Add a site**
2. Enter your domain (e.g., `sleepyud.com`)
3. Select the **Free plan**
4. Cloudflare will scan existing DNS records — click **Continue**
5. You'll see two Cloudflare nameservers (e.g., `kai.ns.cloudflare.com` and `nikita.ns.cloudflare.com`)

### 2. Change nameservers at Namecheap

1. Log in to https://namecheap.com
2. Go to **Domain List** → click **Manage** next to your domain
3. Find **Nameservers** → select **Custom DNS**
4. Enter the two Cloudflare nameservers you got in step 1
5. Click the checkmark to save
6. **Wait 5–30 minutes** for DNS propagation

### 3. Connect your domain to Cloudflare Pages

1. In Pages project → **Custom domains** → **Set up a custom domain**
2. Enter your domain (e.g., `sleepyud.com`) or a subdomain (e.g., `www.sleepyud.com`)
3. Cloudflare automatically adds the DNS records — click **Activate**

### 4. Bypass SSL certificate waiting time

1. In Cloudflare dashboard → **SSL/TLS** → **Overview**
2. Set to **Full (strict)**
3. Your domain is ready in ~2 minutes instead of 24h

### 5. (Optional) Redirect apex to www (or vice versa)

1. Cloudflare dashboard → **Rules** → **Single Redirects** or **Bulk Redirects**
2. Create a rule:
   - If you own `sleepyud.com` and set Pages to `sleepyud.com`:
     - From: `sleepyud.com/*` → To: `sleepyud.com/` (optional)
   - Or redirect `www.sleepyud.com` → `sleepyud.com`

---

## Local Dev (Alternate: run wrangler locally)

```bash
npx wrangler pages dev public --d1 DB
```

Visit http://localhost:8788

---

## Security

- **Change `JWT_SECRET`** to a random string before production
- **Change the admin password** after first login
- Enable Cloudflare's **Bot Fight Mode** and **Under Attack mode** during high-risk periods
- The D1 database is persistent — it won't reset on redeploy

## Troubleshooting

- **API returns 404:** Make sure the D1 binding is set correctly (binding name must be `DB`)
- **Database is empty:** Run `npx wrangler d1 execute sleepy-ud-db --file=schema.sql` again
- **Custom domain not working:** Check DNS records in Cloudflare → your domain → **DNS**; there should be a CNAME record pointing to your `pages.dev` URL
- **Still shows "Sign in" after deploying:** The Pages Function needs a redeploy after adding the D1 binding — go to **Deployments** → **Retry deployment**
