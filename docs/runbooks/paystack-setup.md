# Paystack setup guide (test mode first)

Do this in order. Steps 1–5 change nothing anyone can see; billing stays off
until step 6. Never paste a key into chat or into a file in the repo — keys go
into the Paystack dashboard's own screen and into Vercel, nowhere else.

Menu names in dashboards move around. If you cannot find something below,
use the dashboard's search box or Paystack's help centre
(<https://support.paystack.com>) for the same words.

## What you need first

- A Paystack login — **the one you already have for your other project;
  there is nothing to sign up for.** Read "Give World Vitality its own
  business" below before touching any settings, because one setting is shared
  and changing it would affect that project.
- The older Paystack dashboard that Paystack support gave you, the one that
  has the **Add a Business** button. (Where that button sits in that
  dashboard I have not seen; Paystack's help pages put it at the arrow beside
  your business name, top left, so look there first.)
- The Vercel project `world-vitality` (team `micheal6`).
- The prices in `billing.md` ("The prices").

## Give World Vitality its own business (Add a Business)

Your existing project's payments are live and working, so the aim is to add
this app **without touching anything it relies on**. The one thing that is
shared is easy to trip over: **a Paystack business has a single webhook URL**
(one for test mode, one for live mode), and yours already points at your other
project. So World Vitality gets **its own business under the same login**.
Each business keeps its own API keys, webhook URL, plans, subscriptions,
customers, settlement details and activation status (source:
<https://support.paystack.com/en/articles/10643330>). Nothing in your
existing business changes, and the two projects' payments never mix.

1. In the older dashboard, click the arrow next to your business name and
   Business ID (top left) → **Add a Business**.
2. Choose **Duplicate an existing business** (it copies your compliance
   details, which saves re-entering documents; the source must be in the same
   country) or **Create a new business**. If the wording is different on your
   screen, the two choices are still "copy my existing one" and "start a
   fresh one".
3. Enter the trading name (for example _World Vitality_), review, and
   **Create Business**. You are switched into it. **Read the name at the top
   left before every step below**, because every key, plan and webhook
   setting in this guide must be made **inside the World Vitality business**,
   not your existing one.
4. Test mode works in the new business **straight away** — do steps 1–5
   below now. For **live** payments the new business must be reviewed and
   activated by Paystack (even when duplicated), and you add payout details
   for it; start that from its Compliance section whenever you like. It is
   the only wait in the whole plan, and it does not block testing.

(Payout can go to the same bank account as your other business, if you want
the money in one place; that is a setting inside the new business.)

**Why not share one business.** The webhook receives every event of the
business. If World Vitality used your existing one, your other project would
start receiving World Vitality's subscription and payment events (with
customer emails) and could mistake them for its own. World Vitality's side is
safe — it ignores events that are not its own (an unknown plan or customer is
acknowledged and recorded as `ignored`, never acted on) — so the risk would be
entirely on the other project, and the only fix would be to change that
project. Do not reuse a secret key by copying it between businesses, and never
paste one into chat.

### How we got here (for the record)

On 2 November 2026 Paystack's in-dashboard chat bot told the owner a second
business could not be created under the same login, which contradicted
Paystack's own help pages (<https://support.paystack.com/en/articles/10643330>).
Paystack support then wrote that the Business Owner also carries the Admin
role and that Add a Business is at the top left of the dashboard; the owner's
31 October screenshot of the business switcher showed only a search box and
"No businesses found". Support then supplied the **older dashboard**, which
has the **Add a Business** button, and that is the route above. If the button
ever goes missing again: ask Paystack support for a person (not the bot) and
quote the article above, and meanwhile use the stop-gap below. Before adding
anything, check that the business you are looking at is your own (Settings →
Team shows who the Owner is): its money settles to the Owner's payout account.

**Stop-gap only — test mode inside your existing business.** A business has
a separate _Test_ webhook URL and _Live_ webhook URL. If the **Test Webhook
URL** in your existing business is **empty** (look, do not change anything
yet), World Vitality can use that business's _test_ keys and test webhook for
the test-payment phase without touching your live project; test plans and test
payments are separate from live ones. Stop if that field already holds an
address. Two cautions: enabling Google Pay or any other channel in Settings →
Preferences changes checkout for **both** projects in a shared business; and
this does not get you to live payments, which need World Vitality's own
business.

### Before you click anything — a checklist that keeps your other project safe

- **Read the business name at the top left before every step.** World
  Vitality settings belong in the World Vitality business only.
- **Never edit these in your existing business:** its live keys, its **Live
  Webhook URL**, its plans, and Settings → Preferences (payment channels).
- **Check the Test/Live switch** before you copy a key or paste a URL; steps
  1–5 are all Test mode.
- **In Vercel, double-check the project name** (`world-vitality`, team
  `micheal6`) before saving the two settings. Do not add them to your other
  project, and do not add World Vitality's to any project that already holds
  Paystack keys.
- **Nothing here needs a live transaction.** Do not make a real payment to
  "see if the other project still works"; if you want reassurance, use that
  project's own test mode, or simply leave it alone — none of the steps
  touch it.
- **When in doubt, stop and ask me** — and never paste a key into chat.

## 0. Which business am I in? (the gate)

Before steps 1–5, read the business name at the top left of the Paystack
dashboard. Then:

- **World Vitality's own business** → go ahead.
- **Your existing business** → stop and switch (the arrow beside the name).
  The only exception is the stop-gap above, and only if its Test Webhook URL
  is empty; if it already holds an address, something of yours is using it.

## 1. Get the test secret key

(Make sure you are inside the **World Vitality business** — top left.)

1. Paystack Dashboard → **Settings** → **API Keys & Webhooks**.
2. Make sure you are looking at **API Configuration – Test Mode**, not Live.
3. Click the eye icon next to **Test Secret Key** (it asks for your password).
   It starts with `sk_test_`.

Keep that tab open: you will paste it into Vercel in step 4. You do not need
the public key — the app never uses it.

## 2. Create the four plans (on the Plans page — not Products)

**Open the Plans page, not Products.** In the left menu look for **Plans**,
or go straight to <https://dashboard.paystack.com/#/plans> (the address
Paystack's own help gives), then click **New Plan**. If the older dashboard
has no Plans entry in its menu, send me what its left menu shows.

> **The "New Product" form is the wrong one.** It has Name, Description,
> Price (NGN), Quantity (Unlimited / Limited) and a "This product contains
> one or more physical goods" switch. That form is for selling one-off items
> (a product link, payment page or storefront) and never repeats a charge, so
> a subscription made there would not renew. Press **Cancel** and do not
> create anything there.

The **New Plan** form asks for:

| Field                                    | What to enter                                                       |
| ---------------------------------------- | ------------------------------------------------------------------- |
| Plan Name                                | From the table below                                                |
| Description                              | Optional; leave blank                                               |
| Plan Amount                              | In naira (see the table)                                            |
| Interval                                 | Monthly or Annually (the choices run hourly to annually)            |
| Max. Number of Payments                  | **Leave blank** — charge until cancelled                            |
| Create a Subscription Page for this Plan | **Leave unticked** — the app has its own checkout and uses the code |

Create exactly these four, in test mode (the plan fixes the amount, the
currency and how often it charges, so each price is its own plan):

| Plan Name                         | Plan Amount (₦) | Interval |
| --------------------------------- | --------------- | -------- |
| World Vitality Standard — monthly | 7,500           | Monthly  |
| World Vitality Standard — annual  | 75,000          | Annually |
| World Vitality Premium — monthly  | 25,000          | Monthly  |
| World Vitality Premium — annual   | 250,000         | Annually |

The currency is naira (NGN) — it is the business's currency, not a field on
the form. (The dashboard asks in naira. Paystack's API counts in kobo, so in
the API these are 750000, 7500000, 2500000 and 25000000.)

After saving each, open it and copy its **plan code** (it starts with
`PLN_`). Plan codes are identifiers, not secrets — it is fine to share them.

Do **not** create plans for USD or Enterprise now (see `billing.md`).

## 3. Write the plan-code list

Put the four codes into this exact shape, replacing the `PLN_…` parts. It is
one line of JSON:

```json
{
  "standard.NGN.monthly": "PLN_aaaa",
  "standard.NGN.annual": "PLN_bbbb",
  "premium.NGN.monthly": "PLN_cccc",
  "premium.NGN.annual": "PLN_dddd"
}
```

The keys are `plan.currency.interval`. The interval is spelled **`annual`**
here even though Paystack calls it "Annually" — that is how the app reads it.

## 4. Add the settings in Vercel

Vercel → project **world-vitality** (team `micheal6`) → **Settings** →
**Environment Variables**. Add, for **Production** only (the webhook points at
the live site, so Preview has no use for them):

| Name                  | Value                           | Notes                                        |
| --------------------- | ------------------------------- | -------------------------------------------- |
| `PAYSTACK_SECRET_KEY` | the `sk_test_…` key from step 1 | Tick **Sensitive** so it cannot be read back |
| `PAYSTACK_PLAN_CODES` | the one-line JSON from step 3   | Not secret                                   |

Subscribing also needs `SUPABASE_AUTH_REDIRECT_URL`, which gives Paystack the
address to send people back to — it is already set (it is what the sign-in
emails use), so there is nothing to add for it. Do **not** add
`BILLING_ENABLED` yet. Environment variables only take
effect on a new deployment: after saving, redeploy (Deployments → the latest
→ ⋯ → Redeploy), or push any change.

(If you would rather not handle even the plan codes, send me the four `PLN_`
codes and I will add `PAYSTACK_PLAN_CODES` through the Vercel connector and
redeploy. The secret key you add yourself — I will not take it in chat.)

## 5. Point Paystack at the webhook

In the World Vitality business: Paystack Dashboard → **Settings** → **API
Keys & Webhooks** → **Test Webhook URL**:

```
https://world-vitality.vercel.app/api/paystack/webhook
```

(Use your own domain once you have one.) Save. Paystack signs every webhook
with the secret key from step 1; there is no separate webhook secret to
copy. Live mode has its own separate webhook field — you will fill that in
again when you go live.

## 5b. Optional — Google Pay

Paystack's hosted checkout supports Google Pay (Nigeria, Kenya, Ghana and
South Africa; Visa and Mastercard saved to the customer's Google account).
This app needs **no code for it**: it sends people to Paystack's checkout
without restricting payment channels, so whatever you switch on is what they
see. In the **World Vitality business**: Settings → **Preferences** → payment
channels → turn on **Google Pay** (Cards must stay on). Customers then see
"Pay with Card or Google Pay" on devices that support it; on iPhone and
desktop Paystack adds a 3D Secure step. Paystack says the authorisation can
be reused for subscription renewals. Details:
<https://support.paystack.com/en/articles/10458754>. Check in test mode that
it shows on a _plan_ checkout; I could not verify that from here.

## 6. Switch billing on

The plan screen (`/billing`) exists and appears only once billing is on:

1. Add `BILLING_ENABLED` = `true` in Vercel and redeploy.
2. **Read this first:** with billing on, everyone is on the free Basic plan
   until they subscribe. Basic allows 3 saved items and 1 person, so anyone
   who already has more simply cannot **add** more (nothing is deleted or
   hidden). With one customer so far this is harmless; with more, decide
   whether to grandfather them (set them to Standard by hand, see
   "Putting a customer on Enterprise" in `billing.md` — same SQL with
   `'standard'`).
3. Make a test payment with one of Paystack's test cards
   (<https://paystack.com/docs/payments/test-payments/> lists them with the
   expiry and security code to use; the one planned is `4084 0840 8408 4081`) —
   Subscribe on `/billing` as the organisation's owner (sign in as yourself).
   Then check, in the Supabase SQL editor:

   ```sql
   select user_id, plan, status, source, paystack_subscription_code
   from public.billing_subscriptions;
   select event_type, outcome, reason, received_at
   from public.billing_events order by received_at desc limit 10;
   ```

   You want a `standard` or `premium` row with `status = 'active'`, and
   events with outcome `applied`. Anything `ignored` carries a reason —
   send it to me and it is a small fix (`billing.md`, "First test payment",
   lists what to confirm).

## If checkout says it couldn't start the payment

The message the customer sees is deliberately plain ("Couldn't start the
payment, and nothing was charged"). The reason is in the production log as
`billing_checkout_failed`, with Paystack's own words in `paystackMessage` and
the HTTP status in `httpStatus` (never the key). In Vercel: Project →
Logs, search `billing_checkout_failed`.

- **404, "Plan not found."** (What happened on 2026-11-07: the first four plan
  codes were rejected; the same key accepted four plans created again in Test
  mode, so the plans were the problem, not the key.) Paystack looked for the
  plan code the app sent and has no such plan **in the account and mode the
  secret key belongs to**.
  Paystack keeps **Test** and **Live** completely separate, and each business
  has its own plans. Check both, in this order:
  1. In the Paystack dashboard, switch to **Test mode** (the toggle at the top)
     and open **Plans**. The four plans must be listed there, not only under
     Live. If they are only under Live, create them again in Test mode and send
     me the new `PLN_` codes (I swap `PAYSTACK_PLAN_CODES` and redeploy).
  2. **Settings → API Keys & Webhooks**, still in Test mode, in the **World
     Vitality** business (not your other business): the **Test Secret Key**
     must be the one copied from there. A key from another business cannot see
     these plans.
- **401, "Invalid key."** The secret key is wrong, from the wrong mode, or has
  a stray space or line break. Paste it again in Vercel (as a Sensitive
  variable) and redeploy.
- **400 about the amount or currency.** The plan's currency must be one your
  business is enabled for (Nigeria: NGN).
- Anything else: send me the `paystackMessage` text.

## Going live (later)

1. Get the World Vitality business activated (its Compliance section;
   Paystack reviews it, and you add payout details).
2. In the **live** side of that business, repeat steps 1, 2 and 5: the live
   secret key (`sk_live_…`), the same four plans created again on the Plans
   page (live and test plans are separate, so the codes differ), and the
   **Live Webhook URL**.
3. Replace `PAYSTACK_SECRET_KEY` and `PAYSTACK_PLAN_CODES` in Vercel with the
   live values and redeploy.
4. Subscribe to Open-Meteo and set `OPEN_METEO_API_KEY` first
   (`billing.md`, "Weather data licence").

## What the app does once it is on

The plan screen (`/billing`) lets the organisation's owner subscribe, update
the card on Paystack's page and cancel (keeping the plan until the paid term
ends), and deleting an account cancels its Paystack subscription first — if
Paystack cannot confirm that, the account is left in place. All of it is
described in `billing.md` ("The plan screen"). It has been tested in a
browser against a stand-in Paystack, **not** against the real one: the first
test payment is where that happens, and `billing.md` ("First test payment")
lists what to look for.
