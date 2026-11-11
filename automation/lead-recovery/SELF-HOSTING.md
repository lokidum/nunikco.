# Self-hosting n8n for the lead recovery workflows

n8n is free to run on your own server (sustainable use licence) with no execution quota, so Workflow B can run every minute without counting against anything. This guide takes a blank Ubuntu server to a working `https://n8n.nunik.co` with both workflows live. Budget about an hour the first time.

Files you need are in `server/`: `docker-compose.yml`, `Caddyfile`, `.env.example`.

## 1. Pick a server

Any small VPS with 2 GB of RAM running Ubuntu 24.04 LTS. n8n idles at a few hundred MB and the every-minute job is light.

| Option | Cost | Notes |
| --- | --- | --- |
| Hetzner (Singapore), smallest Cloud plan | around $5 a month | Simplest signup, reliable, pick Ubuntu 24.04 and add your SSH key at creation. |
| Vultr or Binary Lane (Sydney) | around $6 a month | Australian region if you care where the data sits. |
| Oracle Cloud Always Free (Ampere ARM VM) | $0 | Genuinely free, but new accounts often hit "out of host capacity", the console is heavy, and idle instances can be reclaimed. Use the `arm64` n8n image (the compose file's image tag is multi-arch, so nothing changes). |

Whichever you pick: Ubuntu 24.04, SSH key login, note the public IPv4 address.

## 2. DNS

In the DNS for nunik.co add:

```
A    n8n    <server IPv4>    TTL 300
```

Wait until `dig +short n8n.nunik.co` returns the IP before step 5, or Caddy cannot get a certificate.

## 3. Prepare the server

SSH in as root (or the default user with `sudo`).

```bash
apt update && apt upgrade -y
```

```bash
apt install -y ufw ca-certificates curl
```

Firewall: SSH, HTTP (certificate challenge) and HTTPS only.

```bash
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
```

Install Docker from Docker's own script (Ubuntu's packaged version is old):

```bash
curl -fsSL https://get.docker.com | sh
```

Check it:

```bash
docker compose version
```

## 4. Put the files on the server

On your Mac, from the repo root:

```bash
scp -r automation/lead-recovery/server root@<server IP>:/opt/n8n
```

Back on the server:

```bash
cd /opt/n8n && cp .env.example .env
```

Generate the encryption key and paste it into `.env`:

```bash
openssl rand -hex 32
```

```bash
nano /opt/n8n/.env
```

`N8N_DOMAIN` stays `n8n.nunik.co` unless you chose a different subdomain. Keep a copy of the key in your password manager: it encrypts every credential n8n stores, and without it a restored backup cannot read them.

## 5. Start it

```bash
cd /opt/n8n && docker compose up -d
```

Watch the first start (Caddy fetches the certificate, n8n sets up its database):

```bash
docker compose logs -f --tail 50
```

When you see `Editor is now accessible via: https://n8n.nunik.co`, open that address. The first visit asks you to create the owner account. Use a strong password; this login controls your Google and email credentials.

Stop watching with Ctrl+C. The containers keep running and restart on reboot.

## 6. Credentials

Open **Settings > Credentials** (or add them from inside a node).

### Google Sheets: service account (recommended for self-hosted)

A service account avoids the OAuth consent screen and never expires.

1. Go to console.cloud.google.com, create a project called `nunik-n8n`.
2. **APIs and Services > Library**: enable **Google Sheets API** and **Google Drive API**.
3. **IAM and Admin > Service Accounts > Create**. Name it `n8n-sheets`. No roles needed. Open it, **Keys > Add key > JSON**. A file downloads.
4. In n8n, new credential **Google Service Account**. Paste the `client_email` and `private_key` values from the JSON (keep the `\n` line breaks as they are in the file). Save.
5. Create the Google Sheet with a tab named `Leads` and the header row from `README.md`. Share the sheet with the service account's email (the `...@...iam.gserviceaccount.com` address) as **Editor**.
6. Copy the sheet ID from its URL (the long string between `/d/` and `/edit`).

### SMTP: the sending mailbox

The emails must come from a mailbox on nunik.co with SPF, DKIM and DMARC set up, or they land in spam. Three ways that each give you SMTP details:

- **Google Workspace** (if hello@nunik.co is on it): host `smtp.gmail.com`, port 465, SSL on, user `hello@nunik.co`, password = an **App password** (Google Account > Security > 2-Step Verification > App passwords). Google already signs with DKIM once you have added it in the admin console.
- **Resend** (free, 100 a day): add nunik.co under Domains, add the DNS records it shows, then host `smtp.resend.com`, port 465, user `resend`, password = an API key.
- **Brevo** (free, 300 a day): same idea, host `smtp-relay.brevo.com`, port 587, user = your login, password = SMTP key.

In n8n, new credential **SMTP** with those values. Test it with a Send Email node to yourself before going further.

## 7. Import the workflows

1. **Workflows > Create > Import from file**: `workflow-a-capture.json`, then `workflow-b-recovery.json`.
2. In Workflow A, open **Upsert lead** (Google Sheets): pick the service account credential, paste the sheet ID in **Document**, confirm the tab is `Leads`.
3. In Workflow B, do the same in both Google Sheets nodes, pick the SMTP credential in **Send email**, and in **Pick who gets an email** replace `ABN 00 000 000 000` with the real ABN and check the From address.
4. In Workflow A, open **Form webhook**. **Allowed origins** is already `https://nunik.co`. Copy the **Production URL**; it looks like `https://n8n.nunik.co/webhook/nunik-lead`.
5. Switch both workflows to **Active** (toggle top right). Workflow A only listens for the production URL while active.

Workflow B is set to keep failed runs but not successful ones, so 1,440 runs a day leave almost nothing in the database. If you want to see the successful runs while testing, change that under the workflow's **Settings** and change it back afterwards.

## 8. Point the site at it

In `main.js` set:

```js
const LEAD_WEBHOOK_URL = "https://n8n.nunik.co/webhook/nunik-lead";
```

Rebuild the bundle and commit:

```bash
npx --yes esbuild main.js --minify --target=es2020 --outfile=main.min.js
```

Test before the site deploys, from your Mac:

```bash
curl -s -X POST https://n8n.nunik.co/webhook/nunik-lead -d "event=partial&status=partial&session_id=test-1&last_step=2&step=contact&first_name=Test&name=Test Person&email=you@example.com&sent_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)&resume_url=https://nunik.co/contact/?resume=test-1"
```

A row should appear in the sheet within a few seconds. Leave it for three minutes and the "Your spot's saved" email should arrive at the address you used. Then delete the test row, or set its `status` to `complete`.

After the site deploys, fill the form on nunik.co to the phone step, close the tab, and check the sheet.

## 9. Keep it healthy

**Updates** (monthly is plenty; n8n ships often):

```bash
cd /opt/n8n && docker compose pull && docker compose up -d
```

**Backups.** Everything lives in the `n8n_data` volume (SQLite database, encryption key, settings) and `/opt/n8n/.env`. Nightly copy to your Mac or an object store:

```bash
docker run --rm -v n8n_n8n_data:/data -v /opt/backups:/backup alpine tar czf /backup/n8n-$(date +%F).tgz -C /data .
```

Put that in root's crontab (`crontab -e`) with `0 3 * * *` in front and add a line to delete archives older than 14 days. Workflow JSON is already in this repo, and the lead data itself is in Google Sheets, so the backup mostly protects the credentials and the owner login.

**If the server reboots** both containers come back on their own (`restart: unless-stopped`).

**If emails stop** check **Executions** in n8n for red runs on Workflow B; the error text names the SMTP problem. Check the mailbox's daily limit if you are on a free email tier.

**Security.** Only ports 22, 80 and 443 are open. n8n's own login protects the editor. Keep the server updated (`apt upgrade` when you do the Docker update) and keep SSH on keys only (`PasswordAuthentication no` in `/etc/ssh/sshd_config`, then `systemctl restart ssh`).

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Caddy logs show certificate errors | DNS not propagated yet, or port 80 blocked by a cloud firewall (Oracle and Vultr have one outside the VM as well as `ufw`). |
| Webhook returns 404 | Workflow A is not active, or you copied the Test URL instead of the Production URL. |
| Browser console shows a CORS error on nunik.co | The site is posting from a different origin (for example `www.`). Add it to **Allowed origins** in the webhook node, comma-separated. |
| Google Sheets node says permission denied | The sheet is not shared with the service account email as Editor. |
| Code node refuses to run | `N8N_RUNNERS_ENABLED` missing; it is set in the compose file, so run `docker compose up -d` again after any edit. |
| Emails arrive in spam | SPF, DKIM or DMARC missing for the From domain. Check with a free mail tester before sending to real leads. |
