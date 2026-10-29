<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7a67ea24-0d5f-4480-8728-2cbe39328346

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Supabase backend

The portal uses Supabase Auth, Postgres, Row Level Security, and Realtime.
Only the project's URL and publishable key belong in the frontend. Never put a
Supabase secret/service-role key in `.env.local` or client code.

1. Create a Supabase project at [supabase.com](https://supabase.com/).
2. In **Project Settings > API Keys**, copy the project URL and publishable
   key. Use the project URL root (for example, `https://<project-ref>.supabase.co`),
   not a REST endpoint ending in `/rest/v1`. Copy `.env.example` to `.env.local`,
   then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Keep
   `.env.local` private; it is ignored by Git.
3. If this is a new Supabase database, run
   [`supabase/schema.sql`](./supabase/schema.sql) in **SQL Editor**. It also
   creates the public image bucket and its admin-only upload policies. If you
   already installed the earlier schema, run
   [`supabase/services_migration.sql`](./supabase/services_migration.sql) if
   you have not already added the services, then run
   [`supabase/storage_migration.sql`](./supabase/storage_migration.sql) to
   enable image uploads, private application document uploads, and the private
   transparency PDF bucket. Run
   [`supabase/printing_services_migration.sql`](./supabase/printing_services_migration.sql)
   to enable the dedicated 10 MB PDF-only printing request upload and its
   validation policy.
   If this database was already installed, run
   [`supabase/program_fiscal_years_migration.sql`](./supabase/program_fiscal_years_migration.sql)
   to enable fiscal-year settings for the public Programs page. Run
   [`supabase/council_contact_privacy_migration.sql`](./supabase/council_contact_privacy_migration.sql)
   to remove any previously saved SK council email addresses and contact numbers. Run
   [`supabase/program_disbursement_privacy_migration.sql`](./supabase/program_disbursement_privacy_migration.sql)
   to remove previously saved program-level disbursed amounts and itemized breakdowns. Run
   [`supabase/facebook_posts_migration.sql`](./supabase/facebook_posts_migration.sql)
   to enable admin-managed Facebook posts on the Home page.
4. In **Authentication > Users**, create an admin user with email and password.
   Copy that user's UUID. In **SQL Editor**, add them to the admin allowlist:

   ```sql
   insert into public.admin_users (user_id)
   values ('32b05511-4837-4c51-8387-871c2d51abab');
   ```

   That UUID is already set as `VITE_SUPABASE_ADMIN_UIDS` in your local
   `.env.local`. For multiple admins, comma-separate their UUIDs there and add
   each to the database table too. The database membership table and RLS
   policies are the security boundary; the environment allowlist only gates
   admin UI access.
5. Restart the Vite server and sign in at `/admin/login`.

The app uses client-side routes such as `/admin/login`. `vercel.json` rewrites
direct route requests to the app entry point so those paths also work when
opened or refreshed on Vercel.

For Vercel, add these variables under **Project Settings > Environment
Variables**, select the environments you deploy to, and redeploy:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and
`VITE_SUPABASE_ADMIN_UIDS`. The first two connect the live site to this
Supabase project; the UID variable must contain your administrator's auth user
UUID so the admin page is enabled. Use the public publishable key, never a
secret/service-role key.

All announcements created or edited in the admin system are published to the
public portal. If the database already has the older announcement policy, run
[`supabase/announcements_public_migration.sql`](./supabase/announcements_public_migration.sql)
in Supabase SQL Editor to publish existing drafts and allow public reads.

Public content can be read publicly. Visitors can submit applications and
feedback, while those private records are readable only by admins. Event
registration is handled by a database function that checks capacity
atomically. CMS data syncs in real time. Application documents are stored in a
separate private bucket and can be opened by administrators through short-lived
signed links. Transparency PDFs are stored in a private bucket; only
administrators and visitors viewing documents marked public can access them.
In the admin Transparency section, select a PDF with **Select File to Upload**
or drag it onto the dashed upload area, fill in its details, then confirm the
upload. PDFs are limited to 25 MB and are saved in Supabase Storage.
No Firebase project credentials are used by the app.

#### AI assistant

The public Kabataan Assistant calls the `ai-chat` Supabase Edge Function. The
browser receives only the public publishable key; the provider key stays in
Supabase Edge Function secrets. The assistant context is built with the
anonymous Supabase key and includes only public records. It never receives
applications, registrations, feedback, admin notes, private documents, or
visitor personal information.

The simplest secure deployment is:

1. In Supabase **SQL Editor**, run [`supabase/rate_limits.sql`](./supabase/rate_limits.sql).
   This is the only new database setup required for the assistant.
2. In Supabase **Edge Functions > Secrets**, add these names:
   `AI_PROVIDER=gemini`, `AI_MODEL`, `AI_API_KEY`, `AI_DAILY_CAP`, and
   `ALLOWED_ORIGINS`. Use the exact deployed site origin in
   `ALLOWED_ORIGINS`, separated by commas for multiple environments. Never
   place `AI_API_KEY` in `.env.local`, Vercel, or any `VITE_` variable.
3. From the repository folder, deploy the function:

   ```text
   supabase functions deploy ai-chat
   ```

The endpoint intentionally has `verify_jwt = false` because visitors are not
required to sign in. Strict input validation, anonymous-only data access,
per-IP/session rate limits, a global daily cap, CORS allowlisting, PII
filtering, validated JSON output, and timeouts provide the compensating
controls. The assistant does not use Turnstile, answer caching, or admin FAQ
management, so there are no extra AI tables or frontend AI secrets to
configure. Set an AI-provider spending limit and usage alert.

#### Emailing official feedback replies

Replies saved in the admin Feedback Inbox are emailed to the address supplied
with the original suggestion. Anonymous suggestions without an email address
are saved in the inbox but cannot receive email. Email delivery uses the
`skbagbaguin.2023@gmail.com` Gmail account through a Google Apps Script mailer;
the Gmail account password is never stored in the portal.

1. Sign in to [Google Apps Script](https://script.google.com/) as
   `skbagbaguin.2023@gmail.com`, create a project, and paste in the code from
   [`google-apps-script/Code.gs`](./google-apps-script/Code.gs).
2. In **Project Settings > Script Properties**, add `GMAIL_MAILER_SECRET` with
   a newly generated, long random value. Keep it private.
3. Choose **Deploy > New deployment > Web app**. Set **Execute as** to your
   account and **Who has access** to **Anyone**, then deploy and approve the
   Gmail sending permission. Copy the web app URL. The endpoint is protected
   by the shared secret, so do not share that secret or add it to frontend
   environment variables.
4. In the Supabase project, open **Edge Functions > Secrets** and add:
   - `GMAIL_MAILER_URL`: the Apps Script web app URL
   - `GMAIL_MAILER_SECRET`: the exact same random value used in Script
     Properties
5. Deploy the server function from the repository root with the Supabase CLI:
   `supabase functions deploy send-feedback-reply`

When an admin chooses **Mark In Progress** or **Send & Mark Resolved**, the
portal saves the reply and asks the protected Edge Function to email it using
the authorized Gmail account. The email includes a formatted SK Bagbaguin
header, the original subject, the official council response, and a council
signature. The inbox warns the admin if the reply was saved but email delivery
failed, so it can be retried after setup is corrected.

#### Synchronizing KK profiles with Google Forms

The KK profiling form stores each response in Supabase and can submit the same
answers to the existing Google Form and its linked response spreadsheet. Google
sync failures do not discard the portal record; an administrator can retry
sync from the Applications view.

1. Open the existing Google Form in edit mode and copy its form ID from the URL
   (`docs.google.com/forms/d/<FORM_ID>/edit`). Do not use the responder URL's
   `/d/e/` identifier.
2. Update the existing Google Apps Script project with
   [`google-apps-script/Code.gs`](./google-apps-script/Code.gs). In
   **Project Settings > Script Properties**, keep `GMAIL_MAILER_SECRET` and add
   `KK_FORM_ID` (the form ID from the edit URL) and `KK_FORM_SYNC_SECRET` (a
   newly generated long random value).
3. In the Apps Script editor, save the code, choose `authorizeKkFormAccess` in
   the function selector, and click **Run**. Review and grant the requested
   Google Forms and Sheets permissions. This setup function checks access but
   does not submit a response. Run it as the same account that will execute the
   web app and that can edit the form and linked spreadsheet.
4. Deploy or update the script as a **Web app**, executing as that same account,
   with access set to **Anyone**. Copy the deployed
   `https://script.google.com/macros/s/.../exec` URL.
5. In Supabase **Edge Functions > Secrets**, add `KK_FORM_WEB_APP_URL` with the
   deployed web app URL and `KK_FORM_SYNC_SECRET` with the exact same value as
   the Apps Script property. Do not add the secret to frontend environment
   variables.
6. Deploy the function from the repository root with the Supabase CLI:
   `supabase functions deploy sync-kk-profile`

The script checks for a linked response spreadsheet, matches the existing
question titles, and writes a portal-sync ledger tab to avoid duplicate
responses on retries. Test with a non-sensitive sample profile after
deployment.

The admin dashboard's **Youth Services** section lets an administrator add,
edit, hide/show, and delete services. Active services automatically appear on
the public home page, service catalog, and application form. The **Programs**,
**Council**, and **Announcements** editors accept JPG, PNG, or WebP uploads up
to 5 MB.
Images are stored in the public `portal-images` bucket so site visitors can
view them; only authenticated portal administrators can upload and replace
objects through the app.
