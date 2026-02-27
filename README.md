# Suruwe

Your measurements, your photos, one link for your tailor.

Suruwe lets you create a measurement profile, place orders with your tailors, and share everything via WhatsApp. Your tailor taps a link and sees your photos, measurements, and style notes. Read-only for them, editable for you.

---

## Prerequisites

Before you start, make sure you have:

1. **Node.js 18 or higher** installed on your machine. Check with `node -v`. If you need to install it: https://nodejs.org
2. **A GitHub account** (free). You will push this project to a GitHub repo.
3. **A Supabase account** (free tier). Sign up at https://supabase.com
4. **A Vercel account** (free tier). Sign up at https://vercel.com. Connect it to your GitHub account during signup.

Optional for custom domain:
5. **A domain name** (e.g. suruwe.com) with access to DNS settings.

---

## Step 1: Set Up Supabase

### 1.1 Create a Supabase project

1. Go to https://supabase.com/dashboard and click **New project**.
2. Give it a name (e.g. "suruwe").
3. Set a database password. Save this somewhere safe, you will not need it in the app code, but you will need it if you ever want to connect directly to the database.
4. Choose a region close to your users. If your tailors are in West Africa, choose a European region (e.g. West EU / London). If you are in the US and that is your primary use, US East works.
5. Click **Create new project**. Wait for it to finish provisioning (about 2 minutes).

### 1.2 Get your API credentials

1. In your Supabase dashboard, click **Project Settings** in the left sidebar (the gear icon at the bottom).
2. Click **Data API** under the Configuration section.
3. Copy two values from this page:
   - **Project URL**: looks like `https://abcdefg.supabase.co`
   - **anon / public key**: a long string starting with `eyJ...`
4. Save both values. You will need them in Step 3.

### 1.3 Run the database schema

1. In the Supabase dashboard, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file `supabase-setup.sql` from this project and copy the entire contents.
4. Paste it into the SQL editor.
5. Click **Run** (or press Cmd+Enter / Ctrl+Enter).
6. You should see "Success. No rows returned." This is correct. The script creates four tables (profiles, orders, order_attachments, profile_photos), sets up Row Level Security policies, creates indexes, and adds an auto-updating `updated_at` trigger.

### 1.4 Verify the tables were created

1. Click **Table Editor** in the left sidebar.
2. You should see four tables listed: `profiles`, `orders`, `order_attachments`, `profile_photos`.
3. If you do not see them, go back to SQL Editor and run the script again. Check for any error messages.

### 1.5 Create the storage bucket

1. Click **Storage** in the left sidebar.
2. Click **New bucket**.
3. Name it exactly `photos` (lowercase, no spaces).
4. Toggle **Public bucket** to ON. This allows profile photos and order attachments to be accessed via direct URLs, which is required for the tailor view to load images.
5. Click **Create bucket**.

### 1.6 Verify storage is working

1. Click into the `photos` bucket.
2. You should see an empty bucket with an "Upload files" button.
3. The bucket URL pattern will be: `https://your-project-id.supabase.co/storage/v1/object/public/photos/`

---

## Step 2: Set Up the Code Locally

### 2.1 Create a GitHub repository

1. Go to https://github.com/new
2. Name it `suruwe` (or whatever you prefer).
3. Set it to **Private** (recommended) or Public.
4. Do NOT initialize with a README or .gitignore (you already have code).
5. Click **Create repository**.
6. Copy the repository URL. It looks like: `https://github.com/your-username/suruwe.git`

### 2.2 Push the code to GitHub

Open your terminal, navigate to the folder where you have the Suruwe project files, and run:

```bash
cd suruwe
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/suruwe.git
git push -u origin main
```

Replace `your-username` with your actual GitHub username.

If you get a prompt to authenticate, follow GitHub's instructions for HTTPS authentication (you may need a personal access token instead of your password).

### 2.3 Verify the push

Go to your GitHub repository in the browser. You should see all the project files including `package.json`, `src/` folder, `supabase-setup.sql`, etc.

---

## Step 3: Deploy to Vercel

### 3.1 Import the project

1. Go to https://vercel.com/dashboard
2. Click **Add New... > Project**
3. Find and select your `suruwe` GitHub repository. If you do not see it, click **Adjust GitHub App Permissions** and grant Vercel access to the repo.
4. Vercel will auto-detect that this is a Next.js project. The framework preset, build command, and output directory should all be correct by default. Do not change them.

### 3.2 Add environment variables

Before clicking Deploy, expand the **Environment Variables** section. Add these three variables:

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL from Step 1.2 (e.g. `https://abcdefg.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key from Step 1.2 (the long `eyJ...` string) |
| `NEXT_PUBLIC_APP_URL` | `https://suruwe.com` (or your custom domain, or your Vercel URL like `https://suruwe.vercel.app` if you do not have a custom domain yet) |

For each variable:
1. Type the variable name in the "Key" field.
2. Paste the value in the "Value" field.
3. Make sure all three environments are checked: Production, Preview, Development.
4. Click **Add**.

Triple-check that there are no extra spaces or line breaks in the values. This is a common source of "Supabase connection failed" errors.

### 3.3 Deploy

1. Click **Deploy**.
2. Vercel will install dependencies, build the project, and deploy it. This takes 1 to 2 minutes.
3. When it finishes, you will see a "Congratulations!" screen with a preview of your site.
4. Click **Visit** to open your live site.

### 3.4 Verify the deployment

1. You should see the Suruwe onboarding screen with the logo, tagline, name input field, and "Get Started" button.
2. Enter a test name and click "Get Started."
3. You should land on the home screen with your name, the "New Order" button, and the "Send to My Tailor" WhatsApp button.
4. If you see a blank white page or errors, check the Vercel deployment logs: go to your project on Vercel, click the latest deployment, and check the **Function Logs** tab. The most common issue is incorrect environment variables.

---

## Step 4: Custom Domain (Optional)

### 4.1 Add the domain in Vercel

1. In your Vercel project dashboard, go to **Settings > Domains**.
2. Type your domain (e.g. `suruwe.com`) and click **Add**.
3. Vercel will show you DNS records to configure. There are two options:

**Option A: Nameservers (recommended for simplicity)**
Point your domain's nameservers to Vercel. Vercel will show you the nameserver addresses. Update them in your domain registrar's settings. This gives Vercel full control of DNS and is the simplest setup.

**Option B: A/CNAME records**
If you want to keep your current DNS provider:
- For the root domain (`suruwe.com`): Add an A record pointing to `76.76.21.21`
- For the www subdomain: Add a CNAME record pointing to `cname.vercel-dns.com`

### 4.2 Wait for DNS propagation

DNS changes can take anywhere from 5 minutes to 48 hours to propagate. Vercel will automatically provision an SSL certificate once DNS is properly configured. You can check the status on the Domains page in Vercel.

### 4.3 Update the APP_URL environment variable

Once your domain is working:
1. Go to your Vercel project **Settings > Environment Variables**.
2. Update `NEXT_PUBLIC_APP_URL` to `https://suruwe.com` (or your domain).
3. Click **Save**.
4. Redeploy: go to the **Deployments** tab, click the three dots on the latest deployment, and select **Redeploy**. This ensures the WhatsApp share messages use your custom domain in the links.

---

## Step 5: Test the Full Flow

Run through the complete user journey to make sure everything works.

### 5.1 Owner flow

1. **Onboarding**: Open your site. Enter your name. Click "Get Started." You should land on the home screen.
2. **Add a photo**: In the Photos section, tap the "Add a photo" prompt. Select a photo from your phone or computer. It should upload and appear in the grid.
3. **New Order**: Tap "New Order."
   - Step 1: Enter a tailor name (e.g. "Baba Tailor"), a city (e.g. "Lagos"), and what you are making (e.g. "Agbada for a wedding"). Tap Continue.
   - Step 2: Optionally add fit notes and inspiration images. Tap the eye icon on an image to toggle visibility. Tap Continue.
   - Step 3: If this is your first time, you will see the measurements editor. Select your gender silhouette, choose inches or cm, and enter a few measurements. Tap "Save Measurements." (You can also skip this.)
   - Step 4: Review everything. You should see the tailor name, description, fit notes, and a WhatsApp message preview. Tap "Send to [Tailor Name]." WhatsApp should open with the pre-filled message.
4. **Phone prompt**: The first time you tap "Send to My Tailor" on the home screen, you will see a prompt to add your phone number. Enter it or skip.
5. **Style notes**: Tap "Add" next to Style Notes. Write your preferences. Tap "Save Notes."
6. **Order history**: Back on the home screen, you should see your order listed under Orders. Tap it to see the detail view.
7. **Completed photo**: In the order detail, tap the "Got your piece?" prompt to upload a photo of the finished garment.
8. **Theme toggle**: Tap the sun/moon icon in the header to switch between dark and light mode.

### 5.2 Tailor flow

1. Open the profile URL directly. It looks like `https://your-domain.com/your-name-xxxx` (the slug shown under your name on the home screen).
2. You should see the tailor view: the profile name, Suruwe branding, photo on the left (or top on narrow screens), key measurements on the right (or below), full measurements by body section, and style notes.
3. Test on a phone (or use browser dev tools to simulate a narrow screen). The layout should stack vertically and remain readable.
4. Tap the theme toggle to confirm it works independently from the owner's theme.

### 5.3 WhatsApp flow

1. Send the WhatsApp message to yourself or a friend.
2. Tap the link in the message. It should open the tailor view.
3. Confirm all photos load, measurements are visible, and the page loads quickly.

---

## Project Structure

```
suruwe/
  .env.example              # Template for environment variables
  next.config.js            # Next.js config (Supabase image domains)
  package.json              # Dependencies
  supabase-setup.sql        # Database schema (run in Supabase SQL Editor)
  tsconfig.json             # TypeScript config
  src/
    app/
      globals.css           # All styles (theme variables, components, layout)
      layout.tsx            # Root layout (metadata, fonts, viewport)
      page.tsx              # Owner view (onboarding, home, order flow)
      [profileId]/
        page.tsx            # Tailor view (read-only profile page)
    components/
      Icons.tsx             # All SVG icons as React components
      MeasurementsEditor.tsx# Gender toggle, unit toggle, measurement fields
      MeasurementsPreview.tsx# Key measurements chip grid
      NewOrderFlow.tsx      # 4-step order creation wizard
      OrderDetail.tsx       # Individual order view with completed photo upload
      PhonePrompt.tsx       # Bottom sheet modal for phone number collection
      PhotoGrid.tsx         # Profile photo grid with upload and delete
      ThemeToggle.tsx       # Sun/moon theme switch button
    lib/
      supabase.ts           # Supabase client initialization
      theme.ts              # Theme CSS variables and apply function
      upload.ts             # Image compression and Supabase storage upload
      utils.ts              # Slug generator, date formatting
      whatsapp.ts           # WhatsApp message generators and deep link opener
    types/
      index.ts              # TypeScript interfaces, measurement constants
```

---

## Troubleshooting

**Blank page after deploy**
Check the Vercel function logs. The most common cause is missing or incorrect environment variables. Go to Settings > Environment Variables in Vercel and verify all three variables are present and have no trailing spaces.

**Photos fail to upload**
1. Make sure the `photos` storage bucket exists in Supabase and is set to Public.
2. Check the Supabase Storage policies. The SQL setup script creates policies that allow public inserts. If you ran the SQL script before creating the bucket, the policies should still apply.
3. Open browser developer tools (F12), go to the Console tab, and look for error messages during upload.

**"relation does not exist" errors**
The database tables were not created. Go to Supabase SQL Editor and run `supabase-setup.sql` again. Make sure the entire script runs without errors.

**WhatsApp opens with wrong link**
Update the `NEXT_PUBLIC_APP_URL` environment variable in Vercel to match your actual domain (including `https://`). Redeploy after changing it.

**Theme does not persist**
Theme is saved to the profile in Supabase. If it resets on page reload, check that profile updates are succeeding. Open browser developer tools and watch for failed network requests to Supabase.

**Tailor view shows "Profile not found"**
The URL uses the slug, not the profile ID. The slug is shown on the owner's home screen under their name (e.g. `suruwe.com/chidi-k8f2`). Make sure you are using the slug in the URL, not the UUID.

**Profile lost after clearing browser data**
The owner's profile ID is stored in localStorage. If the user clears their browser data, they lose access to their profile. This is the expected behavior for V1. The phone number collection flow is designed so that in a future version, you can add phone-based profile recovery via WhatsApp.
