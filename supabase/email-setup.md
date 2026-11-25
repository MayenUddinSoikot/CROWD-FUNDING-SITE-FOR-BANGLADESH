# Email setup — Brevo + Supabase

Two jobs, in this order:

1. **Connect Brevo** so Shohay can email anyone at all. Until this is
   done, Supabase's built-in sender refuses every address except the
   project owner's, so **nobody can sign up**.
2. **Put the code in the emails**, so the 6-digit login code actually
   appears instead of a bare link.

Brevo's free plan is 300 emails a day — about 9,000 a month — with no
card and no expiry.

---

## Part 1 — Connect Brevo

### Step 1: Add shohay.org in Brevo

Brevo → **Settings** → **Senders, Domains & IPs** → **Domains** →
**Add a domain** → `shohay.org`.

Choose **manual authentication** (the automatic option only works with
DNS providers Brevo can log into directly).

Brevo now shows three records. **The values are generated for your
account — copy them from your screen, never from any example, including
the ones below.**

| Record | Type | Name looks like | Purpose |
| --- | --- | --- | --- |
| Brevo code | TXT | `shohay.org` (the root) | Proves you own the domain |
| DKIM | TXT (or 2 CNAMEs) | `mail._domainkey` | Signs your emails |
| DMARC | TXT | `_dmarc` | Tells inboxes what to do with fakes |

Some accounts get one DKIM TXT record, some get two CNAMEs. Both are
normal — add whatever yours shows.

### Step 2: Add them in GoDaddy

GoDaddy → **My Products** → next to shohay.org click **DNS** → **Add
New Record**, once per row.

**The one mistake everybody makes:** GoDaddy adds `.shohay.org` to the
Name on its own. So when Brevo shows
`mail._domainkey.shohay.org`, type only:

```
mail._domainkey
```

Type the whole thing and you end up with
`mail._domainkey.shohay.org.shohay.org`, which never verifies. Same for
`_dmarc`. For the Brevo code at the root, GoDaddy wants `@`.

Two more things:

- The DKIM value is a very long string. Copy and paste it — one wrong
  character and it fails silently.
- **Do not add a second SPF record.** A domain may only have one. Brevo
  doesn't need an SPF include on a shared IP, and adding a second SPF
  line breaks the first one.

### Step 3: Verify

Back in Brevo, click **Verify** / **Authenticate**. Records usually go
green within minutes, sometimes up to an hour. Nothing to do but wait.

### Step 4: Get the SMTP key

Brevo → **Settings** → **SMTP & API** → **SMTP** tab.

That page shows your **login** and lets you **generate a new SMTP key**.

- The login is often `xxxxxxx@smtp-brevo.com`, not your email address.
  Use exactly what the page shows.
- The key is shown **once**. Copy it somewhere safe before leaving.

### Step 5: Point Supabase at Brevo

Supabase → **Authentication** → **Emails** → **SMTP Settings** → turn on
**Enable Custom SMTP**:

| Field | Value |
| --- | --- |
| Sender email | `login@shohay.org` |
| Sender name | `Shohay` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | the login from the SMTP page |
| Password | the SMTP key from step 4 |

Save. Emails now arrive from **Shohay &lt;login@shohay.org&gt;** instead
of Supabase Auth.

> The sender address needs no real mailbox — nobody replies to it. Use
> an address you actually read if you'd rather they could.

### Step 6: Raise the rate limit

Supabase throttles every new SMTP setup to 30 emails an hour, which is
nothing.

Supabase → **Authentication** → **Rate Limits** → *Emails per hour* →
set it to **100** or more.

---

## Part 2 — Put the 6-digit code in the emails

Supabase's templates send a *link*, not a code. The login screen asks
for a code, so both templates need changing once.

Supabase → **Authentication** → **Emails**. Edit **two** templates:

- **Magic Link** — sent to people who already have an account
- **Confirm signup** — sent to brand-new people

For each, set the subject to:

```
Your Shohay code: {{ .Token }}
```

Then click `</>` to switch the body to HTML, clear it, and paste this.
The only difference between the two is the `type=` at the end of the
backup link.

**Magic Link** — `type=magiclink`:

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

**Confirm signup** — identical, except that one line becomes
`type=email`:

```html
Or <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email" style="color:#11694a;font-weight:700">tap here to log in</a>.
```

Nothing in the app needs changing. It already asks for the code, checks
it, and handles the backup link at `/auth/confirm`. That link points
straight at shohay.org rather than bouncing through Supabase, so no
redirect URLs need adding anywhere.

---

## Test it

Sign up at **shohay.org/signup** with an address that is **not** yours —
a friend's, or a second Gmail. Before this setup that failed outright.
Now the code should arrive, from Shohay, within a minute.

If it doesn't:

| What you see | Almost always means |
| --- | --- |
| "Sign-ups aren't open yet" | Custom SMTP isn't on, or didn't save |
| Email arrives, but it's a *link* not a code | Templates in Part 2 not done |
| Nothing arrives, no error | Brevo domain not verified yet, or in spam |
| Works for you, fails for others | Custom SMTP still off — Supabase's own sender only reaches you |
| "Too many" after a few tries | Rate limit still at 30/hour — step 6 |

Brevo sometimes reviews new accounts before releasing transactional
sending. If the dashboard says sending is under review, that's them, not
you — it usually clears within a day.

---

## Later: when 300 a day isn't enough

9,000 emails a month is a long way off. When you pass it, **Amazon SES**
is $0.10 per 1,000 — 100,000 emails for $10 — but it has no free tier
and new accounts start restricted until AWS approves production
sending. Swapping is just new SMTP values in step 5; the DNS work is
already done.
