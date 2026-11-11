# Lead capture and recovery (n8n)

Two importable workflows for the enquiry form on nunik.co. The form posts every step after the contact screen to a webhook with a stable `session_id`, so one row per visitor is kept up to date, and a scheduled job emails people who stopped part-way.

This folder is excluded from the published site by `_config.yml`.

To run these on your own server instead of n8n Cloud (no execution quota, so the every-minute schedule is free), follow `SELF-HOSTING.md`; the Docker files are in `server/`.

## What the form sends

`POST` as form fields (also `navigator.sendBeacon` when the tab is hidden or closed), set by `LEAD_WEBHOOK_URL` in `main.js`:

| Field | Values |
| --- | --- |
| `event` | `partial`, `abandoned`, `resumed`, `completed` |
| `status` | `partial` until the enquiry is sent, then `complete` |
| `session_id` | UUID, same for the visitor for 30 days on that device |
| `last_step`, `step` | 1-based number and name of the furthest screen (`contact`, `phone`, `business`, `goal`, `budget`) |
| `first_name`, `name`, `email`, `phone`, `whatsapp` | contact details; phone as `+61 412345678`; whatsapp `yes` or `no` |
| `business`, `website`, `industry`, `city` | business details, may be empty |
| `service`, `message`, `timeline`, `budget`, `heard` | the need, the brief, timeframe, budget band, how they heard |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `referrer`, `landing_page`, `device` | first-touch attribution, captured once |
| `page`, `sent_at`, `resume_url` | where the event fired, when, and the link that reopens the form on the same device |

## Workflow A: capture (`workflow-a-capture.json`)

Webhook -> normalise -> Google Sheets "append or update" matched on `session_id`.

1. Import. In the Webhook node copy the production URL and paste it into `LEAD_WEBHOOK_URL` in `main.js`, then rebuild `main.min.js`.
2. Create a Google Sheet with a tab called `Leads` and this header row, in this order:

```
session_id,status,last_step,step,event,first_name,name,email,phone,whatsapp,business,website,industry,city,service,message,timeline,budget,heard,utm_source,utm_medium,utm_campaign,utm_term,utm_content,referrer,landing_page,device,page,resume_url,last_activity,emails_sent,last_email_at,unsubscribed
```

3. Set the sheet ID in both Google Sheets nodes (both workflows) and pick your Google credential.
4. A `completed` event sets `status` to `complete`, which stops every follow-up. A booked call should do the same: add a row update from the Cal.com booking webhook if you want booked leads marked complete automatically (match on email).

## Workflow B: recovery (`workflow-b-recovery.json`)

Every minute: read the sheet, pick rows where `status` is `partial`, `email` is set, `unsubscribed` is not `yes`, fewer than three emails sent, and the spacing has passed: the first email two minutes after the visitor last typed or moved (the form reports typing 20 seconds after the last keystroke, so the real gap is about two and a half minutes), the second one day after the first, the third three days after the second. Sends the email, then bumps `emails_sent` and `last_email_at`.

Running every minute means about 1,450 executions a day on this workflow alone. On n8n Cloud that counts against the plan's execution quota; on a self-hosted n8n it is free. If that is too many, change the trigger to every 2 minutes (the first email then lands two to four minutes after they stop). `FIRST_AFTER` in the Code node sets the delay.

Email copy lives in the Code node ("Pick who gets an email"); edit it there. Before switching it on:

- Set the From address to a mailbox on nunik.co with SPF, DKIM and DMARC in place, or the emails land in spam. The Send Email node uses SMTP; Resend and Brevo both give SMTP credentials.
- Replace `ABN 00 000 000 000` in the Code node with the real ABN. The Spam Act 2003 requires the sender's name and contact details and a working way to opt out in every message.
- Unsubscribe is a reply with "stop" (the mailbox owner marks `unsubscribed` = `yes` in the sheet). If you want one-click unsubscribe, point the link at a second webhook that sets that column.
- The resume link only restores answers on the device they used. On another device it opens a fresh form and says so.

## Not built

- Cloudflare Turnstile. The static site cannot verify a Turnstile token on its own; it needs a server step. If spam rows appear, add Turnstile to the contact screen and verify the token in Workflow A before the upsert (Cloudflare's `siteverify` endpoint, one HTTP Request node).
- The automatic SEO snapshot for email two. Run the health crawler from the SEO pack by hand on the lead's website and paste one real finding into the email if you want that touch; nothing in the sequence invents a finding.
