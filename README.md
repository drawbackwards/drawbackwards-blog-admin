# Drawbackwards Blog Admin

Editorial dashboard for reviewing and managing AI-generated blog drafts.

**Live URL:** https://drawbackwards-blog-admin-git-main-corie-2677s-projects.vercel.app

> No login required — access is via URL. The site is not indexed by search engines.

---

## What It Does

| Page | Purpose |
|------|---------|
| **Topics** | Review scraped topics. Reject or approve to generate a draft. |
| **Blog Drafts** | Edit, approve, and track drafts through the editorial workflow. |

### Editorial Flow

```
Topic: Pending → (Draft this) → Approved → drafted
Draft:  First Draft → (Edit) → Editing → (Mark Approved) → Approved
```

Once approved, a team member manually copies the `.md` file from the GitHub branch into the website repo to publish.

---

## Tech Stack

- **Next.js 14** (App Router, server components)
- **Supabase** — topics and posts database
- **Vercel** — hosting (auto-deploys from `main`)
- **GitHub API** — triggers Actions workflows and reads/writes draft files
- **Slack** — interactive notifications

---

## Running Locally

```bash
npm install
npm run dev
```

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://epyuubhjmcjtwegagjue.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GITHUB_ACTIONS_TOKEN=...        # Classic PAT with repo + workflow scopes
SLACK_SIGNING_SECRET=...        # From api.slack.com/apps → your app → Basic Information
```

---

## Environment Variables (Vercel)

Same as above — set in Vercel → Project Settings → Environment Variables.
After adding or changing any variable, **redeploy** for it to take effect.

---

## Key Files

```
app/(dashboard)/
  topics/
    page.tsx               # Topics list with Pending/Approved/Rejected tabs
    topic-actions.tsx      # Reject / Draft this buttons
    run-scraper-button.tsx # Triggers scraper workflow + polls for completion
  posts/
    page.tsx               # Blog Drafts list with Pending/Approved tabs
    post-actions.tsx       # Edit / Mark Approved buttons
    [id]/
      edit/                # Markdown editor with live preview, saves to GitHub
      preview/             # Rendered read-only preview of draft

app/api/
  run-scraper/             # Triggers scrape-topics GitHub Actions workflow
  generate-draft/          # Triggers generate-draft GitHub Actions workflow
  scraper-status/          # Polls GitHub Actions for scraper completion
  save-draft/[id]/         # Commits edited markdown back to GitHub branch
  slack/interactive/       # Handles Slack button clicks (Draft this, Run scraper again)
```

---

## GitHub Token

The dashboard uses a **classic PAT** (`GITHUB_ACTIONS_TOKEN`) with `repo` + `workflow` scopes. This token:
- Triggers GitHub Actions workflows (scraper + draft generator)
- Reads draft `.md` files from branches (for preview/edit)
- Commits edits back to branches (save draft)

If the token expires, generate a new one at github.com/settings/tokens and update it in both `.env.local` and Vercel.

---

## Supabase Schema

Two main tables:

**`topics`** — `id, title, summary, source_urls, audience, theme, status, scraped_at`
- status: `pending | approved | rejected | drafted`

**`posts`** — `id, topic_id, title, slug, branch_name, pr_number, status, created_at`
- status: `drafting | review | approved | scheduled | published`

Schema file: `drawbackwards/drawbackwards-blog-content/supabase/schema.sql`

---

## Deploying Changes

Push to `main` — Vercel auto-deploys. Build takes ~1 minute.

If the build fails, check Vercel → Deployments → the failed build → logs. Most common issues are TypeScript/ESLint errors.

---

## What's Next (Future Work)

- Auto-merge PR on "Publish" click in dashboard
- Scheduled publishing (infrastructure exists, not yet wired to auto-merge)
- Upgrade Anthropic tier for higher rate limits (currently Tier 1 — 30k TPM)
