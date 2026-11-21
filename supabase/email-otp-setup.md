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

## 2. Connect a real email sender (required before launch)

Supabase's built-in email service is for testing only and is capped at a
**handful of messages per hour across the whole project**. With real
traffic most people would simply never receive their code.

Authentication → **Emails** → **SMTP Settings** → turn on *Enable Custom
SMTP*, using any of:

- **Resend** — free for 3,000 emails/month, easiest to set up
- **Brevo** (formerly Sendinblue) — free for 300/day
- **SendGrid**, **Mailgun**, or Google Workspace SMTP

Sender address should be something like `login@shohay.org`, and the
domain needs the SPF/DKIM records the provider gives you added at
GoDaddy — otherwise codes land in spam.

Then raise Authentication → **Rate Limits** → *Emails per hour* to
something sensible (e.g. 100).

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
