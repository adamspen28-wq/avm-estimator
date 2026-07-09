# Home Value Estimator — Setup Guide

This is a small app: a search box where you type an address, and Claude
gives you a rough ballpark value range. It is **not** a real appraisal —
just a quick reference number.

You need two things before this works:
1. A **Google Maps API key** (for the address autocomplete dropdown)
2. An **Anthropic API key** (for Claude to generate the estimate)

Then you deploy it to Vercel (free), which hosts both the page and a tiny
backend function. Total time: 20–40 minutes the first time.

---

## Step 1: Get a Google Maps API key

1. Go to https://console.cloud.google.com/ and sign in.
2. Create a new project (top-left dropdown → "New Project"). Name it
   anything, e.g. "home-value-estimator."
3. In the search bar at the top, search for **"Places API"** and click
   **Enable**.
4. Go to **APIs & Services → Credentials → Create Credentials → API key**.
   Copy the key it gives you.
5. Click on the key to edit it, and under **"Application restrictions"**
   choose **"Websites"** and add your Vercel domain (you'll get this in
   Step 5 — you can come back and add it after deploying). Under
   **"API restrictions"**, restrict it to **Places API** and
   **Maps JavaScript API**.

Note: this key is *meant* to be visible in your webpage's code (that's how
Google's maps widgets work) — the security comes from restricting which
websites can use it, not from hiding it. This is different from the
Anthropic key below, which must stay completely secret.

Google requires a billing account on file, but includes a monthly free
credit that easily covers normal personal use of this app.

## Step 2: Get an Anthropic API key

1. Go to https://console.anthropic.com/ and sign in (or create an account).
2. Go to **API Keys** and click **Create Key**. Copy it immediately — you
   won't be able to see it again.
3. Add a small amount of credit to your account under **Billing** (a few
   dollars will cover a lot of testing at this app's usage level).

**Keep this key secret.** Never paste it into `index.html` or any file
that runs in the browser — it goes in Vercel's environment variables only
(Step 4).

## Step 3: Add your Google Maps key to the app

1. Open `index.html` in any text editor.
2. Near the very bottom, find this line:
   ```
   src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places&callback=initAutocomplete"
   ```
3. Replace `YOUR_GOOGLE_MAPS_API_KEY` with the key from Step 1. Save the file.

## Step 4: Deploy to Vercel

**Easiest path — no command line needed:**

1. Create a free account at https://vercel.com/ (you can sign up with GitHub).
2. Put this whole `home-value-estimator` folder into a new GitHub
   repository (GitHub has a "drag and drop files to create a repo" upload
   flow at https://github.com/new if you're not familiar with git).
3. In Vercel, click **Add New → Project**, and import that GitHub repo.
4. Before clicking Deploy, expand **Environment Variables** and add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: (paste your Anthropic key from Step 2)
5. Click **Deploy**. After a minute, Vercel gives you a live URL like
   `home-value-estimator.vercel.app`.
6. Go back to Google Cloud Console (Step 1.5) and add that URL to your
   Google Maps key's website restrictions.

## Step 5: Test it

Open your Vercel URL, start typing a real address, select it from the
dropdown, and you should see a loading message followed by an estimated
range. If something goes wrong, see Troubleshooting below.

---

## Troubleshooting

- **No autocomplete suggestions appear:** Your Google Maps key is missing,
  wrong, or the Places API isn't enabled. Check the browser console
  (right-click → Inspect → Console) for an error message from Google.
- **"Server misconfigured: missing ANTHROPIC_API_KEY":** You deployed
  without setting the environment variable, or misspelled its name in
  Vercel. Go to Project Settings → Environment Variables, fix it, then
  redeploy.
- **"Estimate service unavailable":** Usually means your Anthropic API key
  is invalid or out of credit. Check https://console.anthropic.com/
- **"Could not generate an estimate for this address":** The model
  couldn't produce a usable answer for that specific address (very rural
  or unusual addresses sometimes trip this up). Try a more complete or
  well-known address.
- **It works but numbers seem off:** Expected — this is explicitly a rough,
  AI-generated ballpark, not pulled from real estate sale records. Treat
  it as a conversation starter, not a number to make financial decisions
  with.

## Files in this project

- `index.html` — the entire front-end: search box, autocomplete, results.
- `api/estimate.js` — the backend function Vercel runs automatically. It
  receives an address and asks Claude for an estimate, keeping your
  Anthropic key hidden from users.
- `package.json` — tells Vercel this project needs Node 18 or newer.
- `.env.example` — reference only; shows what your local `.env` should
  look like if you ever want to test on your own computer before deploying.
