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
   transparency PDF bucket. If you previously ran an earlier version, run it
   again; it safely adds the missing buckets and policies.
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

The admin dashboard's **Youth Services** section lets an administrator add,
edit, hide/show, and delete services. Active services automatically appear on
the public home page, service catalog, and application form. The **Council**
and **Announcements** editors accept JPG, PNG, or WebP uploads up to 5 MB.
Images are stored in the public `portal-images` bucket so site visitors can
view them; only authenticated portal administrators can upload and replace
objects through the app.
