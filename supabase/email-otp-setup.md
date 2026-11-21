# Email one-time codes — Supabase setup

`/signup` and `/login` ask Supabase to email a **6-digit code**. Supabase
only puts that code in the email if the template contains `{{ .Token }}`.
The templates Supabase ships with contain a *link* instead — that's the
"Your sign-in link" email — so this has to be changed once, by hand, in
the dashboard.

Two different templates are used:

| When | Template Supabase sends | Default subject |
| --- | --- | --- |
| A brand-new person signs up | **Confirm signup** | "Confirm your signup" |
| Someone who already has an account logs in | **Magic Link** | "Your sign-in link" |

Both need changing, and they need **different** backup links (the `type=`
at the end differs). Everything else is identical.

---

## 1. Put the code in the emails

Supabase dashboard → **Authentication** → **Emails**.

### Template A — "Magic Link"

**Subject heading:**

```
Your Shohay code: {{ .Token }}
```

**Message body:** click `</>` (source / HTML view), delete everything
that's there, and paste this:

```html
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf6ee;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#ffffff;border-radius:16px;padding:32px">
      <tr><td align="center" style="font-size:22px;font-weight:700;color:#11694a">সহায় · Shohay</td></tr>
      <tr><td align="center" style="padding-top:20px;font-size:16px;color:#41493f">
        Here is your login code. It is good for one hour.
      </td></tr>
      <tr><td align="center" style="padding:24px 0">
        <div style="display:inline-block;background:#e7f0ea;color:#0b4f36;font-size:34px;font-weight:700;letter-spacing:10px;padding:16px 24px;border-radius:14px">{{ .Token }}</div>
      </td></tr>
      <tr><td align="center" style="font-size:14px;color:#5b6459;line-height:1.6">
        আপনার সহায় লগইন কোড — এক ঘণ্টার জন্য বৈধ।
      </td></tr>
      <tr><td align="center" style="padding-top:24px;font-size:14px;color:#41493f">
        Or <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink" style="color:#11694a;font-weight:700">tap here to log in</a>.
      </td></tr>
      <tr><td align="center" style="padding-top:24px;font-size:12px;color:#5b6459;line-height:1.6">
        If you didn&rsquo;t ask for this code, you can ignore this email —
        nobody can get into your account without it.
      </td></tr>
    </table>
  </td></tr>
</table>
```

### Template B — "Confirm signup"

Exactly the same subject and body, **except** the backup link ends in
`type=email` instead of `type=magiclink`:

```html
Or <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email" style="color:#11694a;font-weight:700">tap here to log in</a>.
```

Save both. Nothing in the app needs changing afterwards — it already
asks for the code, checks it, and handles the backup link at
`/auth/confirm`.

> The backup link points straight at shohay.org rather than bouncing
> through Supabase, so no redirect URLs need to be added anywhere.

---

## 2. Send from "Shohay", not "Supabase Auth" — do this now, not later

Right now the emails come from **Supabase Auth
&lt;noreply@mail.app.supabase.io&gt;**, which looks like spam next to a
donation request. Worse, Supabase's built-in sender has a hard limit
that is easy to miss:

> It only delivers to the email addresses of the project's own team
> members. Everybody else is refused with `email_address_not_authorized`.

So **no real campaigner can sign up at all** until this is done. It is
not a polish item. The app shows a plain message when it happens, but
the only real fix is below.

Changing the sender name and address is the same job: both live in
Supabase's custom SMTP settings. Roughly 20 minutes, most of it waiting
for DNS.

### Step 1 — Resend account (free, 3,000 emails/month)

1. Go to **resend.com** and sign up.
2. **Domains** → **Add Domain** → type `shohay.org` → choose the region
   closest to Bangladesh (Ireland is usually fine) → **Add**.
3. Resend now shows a table of **DNS records** — normally three: one
   `MX`, and two `TXT` (DKIM and SPF). Leave this page open.

### Step 2 — Put those records into GoDaddy

1. GoDaddy → **My Products** → next to shohay.org click **DNS**.
2. For each row Resend showed: **Add New Record**, pick the same Type,
   and copy **Name** and **Value** across exactly.
   - GoDaddy sometimes adds `.shohay.org` to the end of the Name by
     itself. If Resend says `send`, type `send`, not `send.shohay.org`.
   - Priority for the MX record is whatever Resend shows (usually 10).
3. Back in Resend, click **Verify**. It can take anywhere from two
   minutes to an hour. Wait for every row to turn green.

### Step 3 — Resend API key

Resend → **API Keys** → **Create API Key** → name it `shohay-login`,
permission **Sending access** → copy the key (starts `re_`). It is shown
only once.

### Step 4 — Point Supabase at it

Supabase → **Authentication** → **Emails** → **SMTP Settings** → turn on
**Enable Custom SMTP**, then fill in:

| Field | Value |
| --- | --- |
| Sender email | `login@shohay.org` |
| Sender name | `Shohay` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | the `re_...` API key from step 3 |

Save. Emails now arrive from **Shohay &lt;login@shohay.org&gt;**.

> The sender address doesn't need a real mailbox — nobody replies to it.
> If you'd rather people *could* reply, use an address you actually read.

### Step 5 — Raise the rate limit

Supabase drops new SMTP setups to **30 emails per hour** to protect your
domain's reputation. Authentication → **Rate Limits** → *Emails per
hour* → raise it to **100** or more, depending on how many sign-ups you
expect in a busy hour.

### Step 6 — Check it

Sign up with an address that is **not** your own — a friend's, or a
second Gmail. Before step 4 that would have failed outright; now it
should arrive from Shohay with six digits in it.

---

## 3. Code length and expiry (optional)

Authentication → **Sign In / Providers** → **Email**:

- *Email OTP Expiration* — 3600 seconds (1 hour) is the default and is
  what the app's wording says.
- *Email OTP Length* — leave at **6**. The app's input expects 6 digits.

---

## Not done: SMS codes to a mobile number

Sending a code by SMS needs a paid SMS provider connected under
Authentication → **Sign In / Providers** → **Phone** (Twilio, Twilio
Verify, MessageBird or Vonage). Bangladeshi numbers also normally need a
local operator/aggregator for reliable delivery. Once an account exists
the app change is small — the same two-step screen, pointed at
`signInWithOtp({ phone })` instead of `{ email }`.
