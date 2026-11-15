# Regional pricing: naira in Nigeria, dollars abroad (v120, Decision #037)

Visitors from **Nigeria** see and pay **naira (₦)**. Visitors from **anywhere else** see and
pay **US dollars ($)**. The rule is applied twice, on the billing page (what is listed) and in
the checkout action (what is accepted), so the screen and the server cannot disagree.

## The rule (`services/billing-service/src/region.ts`)

| Country the visitor appears to come from | USD plans exist | What is offered                      |
| ---------------------------------------- | --------------- | ------------------------------------ |
| Nigeria (`NG`)                           | yes or no       | naira only                           |
| Any other country                        | yes             | dollars only                         |
| Any other country                        | **no**          | naira (today's behaviour, unchanged) |
| Not known (no header, local dev, `XX`)   | yes             | both, with a selector; naira first   |
| Not known                                | no              | naira                                |

- **Nothing changes until USD plans exist.** A currency is only offered once a Paystack plan
  code is configured for it, so today (four naira plans) every visitor still sees naira.
- A list is **never emptied**: if the preferred currency has no plans the other is offered.
- Where the country decided the currency (and both currencies exist), the billing page says so
  in one line ("Prices are shown in naira because you appear to be connecting from Nigeria…").
- A person who is already subscribed is not affected: their plan keeps its own currency, and
  Paystack's card page manages it. Only a **new** subscription is priced by region.

## Where the country comes from

Vercel adds `x-vercel-ip-country` (a two-letter ISO 3166-1 code) to every request, from the
visitor's IP address (<https://vercel.com/docs/headers/request-headers>). It is read in
`apps/web/lib/billing-region.ts`. On a host without that header (local development) the region
is "unknown" and both currencies are offered.

**Limits, stated plainly:**

- It is the **connection's** country, not the person's. Someone on a VPN, or a Nigerian
  travelling abroad, is priced as the country they appear in. Nothing here claims to prevent
  that; a person who really wants the other price can usually get it, and that is accepted.
- Vercel's page does not say what the header holds when a location cannot be worked out, so
  anything that is not exactly two letters (or is `XX`/`ZZ`) is treated as "unknown".
- A naira price is converted by the customer's own bank if their card is in another currency;
  Paystack charges the currency of the plan.

## Does Paystack allow dollars? (read 2026-11-15)

**Yes, for a Nigerian business, once international payments are switched on for the account.**
What Paystack's own help pages say (support.paystack.com, articles 360009973799 and
360009882000):

- Request it in the Dashboard under **Preferences → Request international payments**. Review
  takes about 48 working hours, and the account must already be activated (compliance done).
- **Paying out in dollars** needs a USD domiciliary account with **Zenith Bank**. If you would
  rather be paid in naira, price in naira and the customer's bank does the conversion.
- Fees on the pages read: international cards 3.9%; local cards 3.9% + ₦100 (check
  <https://paystack.com/pricing>, which is the authority and changes).

**What I could not confirm from public pages** (so check before relying on it): whether a USD
**subscription plan** can be created without the Zenith dollar account, and whether dollar
charges are then settled in naira at Paystack's rate. The create-plan form is the quickest
test (step 2 below); if it has no USD choice, ask Paystack support the two questions above.

## Turning dollars on, step by step

Do these in your own Paystack account (they need your login). Nothing in the app changes
until step 4.

1. **Ask for international payments.** Paystack Dashboard → **Preferences** → **Request
   international payments** → submit. Wait for the confirmation (about 48 working hours).
   If you want dollars paid into a dollar account, ask Paystack at the same time how to link
   the Zenith USD domiciliary account.
2. **Check that a dollar plan can be made.** Dashboard → **Payments** → **Plans** → **Create
   Plan**. Open the **Currency** list: if **USD** is there, continue. If only NGN shows, dollars
   are not enabled for your plans yet: contact Paystack through the dashboard's help chat and
   ask: _"Can my business create USD subscription plans, and are USD payments settled in NGN
   or only to a USD account?"_ Stop here until they answer.
3. **Create four dollar plans** (currency **USD**), the same shape as the naira ones:

   | Plan name                               | Amount | Interval |
   | --------------------------------------- | ------ | -------- |
   | World Vitality Standard — monthly (USD) | 9      | Monthly  |
   | World Vitality Standard — annual (USD)  | 90     | Annually |
   | World Vitality Premium — monthly (USD)  | 29     | Monthly  |
   | World Vitality Premium — annual (USD)   | 290    | Annually |

   Copy each **plan code** (`PLN_…`). They are identifiers, not secrets.

4. **Add the codes to `PAYSTACK_PLAN_CODES`** in Vercel (Settings → Environment Variables,
   Production). Keep the four naira lines and add the four dollar lines:

   ```json
   {
     "standard.NGN.monthly": "PLN_aaaa",
     "standard.NGN.annual": "PLN_bbbb",
     "premium.NGN.monthly": "PLN_cccc",
     "premium.NGN.annual": "PLN_dddd",
     "standard.USD.monthly": "PLN_eeee",
     "standard.USD.annual": "PLN_ffff",
     "premium.USD.monthly": "PLN_gggg",
     "premium.USD.annual": "PLN_hhhh"
   }
   ```

   Redeploy (Deployments → latest → ⋯ → Redeploy). Or send me the four new codes and I add
   them through the Vercel connector.

5. **Test with Paystack test mode first**, from outside Nigeria if you can (or a VPN): the
   billing page should show dollars, and from Nigeria naira.

## If it needs changing

- A different home country, or a third currency: `region.ts` and `PRICE_CURRENCIES` in
  `prices.ts` are the only places; the tests in `region.test.ts` hold the rule.
- A "pay in naira anyway" option for Nigerians abroad: not built, on purpose (it also lets
  anyone pick the cheaper price). Revisit if travelling customers complain.
- Prices in the Terms say "naira or US dollars, by region"; they need no change.
