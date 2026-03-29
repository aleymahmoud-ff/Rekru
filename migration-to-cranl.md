# Migrating from Vercel to Cranl

Step-by-step guide based on the Strategy Community migration.

---

## Prerequisites

- Cranl account at https://app.cranl.com
- Cranl CLI installed
- GitHub repo for the project

### Install Cranl CLI

**macOS/Linux:**
```bash
curl -fsSL https://cranl.com/install.sh | bash
```

**Windows (PowerShell):**
```powershell
powershell -NoExit -c "irm https://cranl.com/install.ps1 | iex"
```

### Authenticate
1. Go to https://app.cranl.com → Settings → API Keys → Generate key
2. Login:
```bash
cranl login cranl_sk_YOUR_API_KEY
```

---

## Step 1: Push Code to New GitHub Repo

```bash
# Add new remote
git remote add cranl-origin https://github.com/YOUR_ORG/YOUR_REPO.git

# Push
git push cranl-origin main
```

---

## Step 2: Connect GitHub to Cranl

1. Go to https://app.cranl.com/dashboard
2. Select your project (or create one: `cranl projects create "My Project"`)
3. Go to project settings → Connect GitHub
4. Authorize the GitHub account that has the repo

---

## Step 3: Create the App on Cranl

From the Cranl dashboard, create a new application linked to your GitHub repo.

Or via CLI:
```bash
cranl apps create --repo <repository-id> --name my-app --branch main --build-type nixpacks --region eg
```

Available regions: `eu` (Germany), `us` (US East), `eg` (Egypt), `sa` (Saudi Arabia), `asia` (India)

---

## Step 4: Create a Database

```bash
cranl db create --name my-app-db --type pg --region eg
```

Database types: `pg`, `mysql`, `mariadb`, `mongodb`, `redis`

Get connection details from the Cranl dashboard → Database → Connection Information.

---

## Step 5: Configure the App

### Procfile
Create a `Procfile` in the project root:
```
web: next start -H 0.0.0.0 -p ${PORT:-3000}
```

The `-H 0.0.0.0` is critical — without it the app only listens on localhost and Cranl returns 502.

### Build Command
In `package.json`, make sure the build does NOT run any database commands:
```json
"build": "prisma generate && next build"
```

Do NOT put `prisma db push` or `prisma migrate` in the build command — the internal database hostname is not reachable during build, only at runtime.

### Environment Variables
Set via the Cranl API:
```bash
curl -s -X PUT \
  -H "Authorization: Bearer cranl_sk_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"env":"DATABASE_URL=postgresql://user:pass@internal-host:5432/dbname"}' \
  https://app.cranl.com/api/applications/APP_ID/environment
```

Use the **Internal Connection URL** from the Cranl dashboard for DATABASE_URL.

---

## Step 6: Push Database Schema

The internal DB hostname is only reachable from within Cranl's network. To push the schema, enable **External Access** on the database from the Cranl dashboard, then run locally:

```bash
DATABASE_URL="postgresql://user:pass@EXTERNAL_IP:40000/dbname" npx prisma db push
```

---

## Step 7: Migrate Data from Old Database

### Option A: Direct migration script (if both DBs are accessible)

Create a script that connects to both databases and copies data table by table in dependency order (parent tables first, then children with foreign keys).

```bash
DATABASE_URL="postgresql://user:pass@EXTERNAL_IP:40000/new_db" \
SOURCE_DATABASE_URL="postgres://old_connection_string" \
npx tsx prisma/migrate-data.ts
```

### Option B: SQL backup and restore

**Backup old database:**
```bash
pg_dump "OLD_DATABASE_URL" -F p --no-owner --no-acl -f backup.sql
```

**Restore to new database:**
```bash
psql "postgresql://user:pass@EXTERNAL_IP:40000/dbname" -f backup.sql
```

---

## Step 8: Deploy

```bash
cranl apps deploy APP_ID
```

Or deploy from the Cranl dashboard.

---

## Step 9: Custom Domain

### Add domain in Cranl:
```bash
cranl apps domains add APP_ID yourdomain.com
```

### Configure DNS:

**If your DNS provider supports CNAME on root (@):**
- Add CNAME: `@` → `your-app-name.cranl.net`

**If NOT (e.g., GoDaddy):**
1. Resolve the Cranl IP: `nslookup your-app-name.cranl.net`
2. Add A record: `@` → the resolved IP address
3. Add CNAME: `www` → `your-app-name.cranl.net`

**Important:** If using Cloudflare, turn off the proxy (use DNS-only / grey cloud).

### Enable SSL:
Click "Enable SSL" in the Cranl dashboard after DNS propagates.

---

## Step 10: Security Checklist

- [ ] All API routes require authentication (check middleware)
- [ ] No `--accept-data-loss` in any build/start commands
- [ ] Remove any temporary setup/migration API endpoints
- [ ] Remove `SOURCE_DATABASE_URL` from env after migration
- [ ] Disable external database access after schema push
- [ ] Add `*.sql` to `.gitignore`
- [ ] Keep a local SQL backup of the old database before destroying it

---

## Common Issues

### 502 Bad Gateway
The app isn't listening on the right host/port. Make sure:
- Procfile uses `-H 0.0.0.0 -p ${PORT:-3000}`
- No long-running startup scripts blocking the app from starting

### Can't reach database during build
The internal database hostname only works at runtime, not build time. Move all DB commands out of the build script.

### Database data wiped after deploy
Never use `prisma db push --accept-data-loss` in build or start commands. Only run it manually via external access when you need to update the schema.

### Login not working after migration
Sessions from the old database may not have been migrated, or the session tokens are stale. Clear cookies and login fresh.

### DNS not pointing to Cranl
Delete old A records (Vercel IPs or "Parked" entries) before adding the new CNAME or A record pointing to Cranl.

---

## Useful Commands

```bash
cranl whoami                              # Check auth
cranl projects list                       # List projects
cranl apps list                           # List apps
cranl apps deploy APP_ID                  # Deploy
cranl apps logs APP_ID                    # Runtime logs
cranl apps env list APP_ID                # List env vars
cranl db list                             # List databases
cranl db info DB_ID                       # Database details
cranl apps domains list APP_ID            # List domains
cranl regions                             # Available regions
```
