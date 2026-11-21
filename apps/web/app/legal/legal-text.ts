import { BUSINESS_EMAIL, BUSINESS_NAME } from "@world-vitality/support";

/**
 * The words of the Terms of Service and the Privacy Policy.
 *
 * **Written for this app as it is** (what it stores, which providers it uses,
 * what deletion and export do), checked against the code and database on
 * 2026-11-14/15; see `docs/runbooks/legal-pages.md` for what was checked and
 * what a lawyer still has to look at. **It is a plain-language draft, not legal
 * advice**, and it is only in English: English is the version that applies, and
 * every page says so in the person's own language.
 *
 * When something in the app changes what is collected, who it is shared with or
 * how long it is kept, change this text and `LEGAL_UPDATED` in the same commit.
 */

export type LegalBlock = { p: string } | { ul: string[] };

export interface LegalSection {
  id: string;
  heading: string;
  blocks: LegalBlock[];
}

const NAME = BUSINESS_NAME;
const EMAIL = BUSINESS_EMAIL;
/** Where Flow's server runs (Flow's Vercel project, Settings > Functions). */
const FLOW_REGION = "Washington, D.C., in the United States (Vercel’s iad1 region)";

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "about",
    heading: "1. About these terms",
    blocks: [
      {
        p: `World Vitality (“the service”) is run by ${NAME} (“we”, “us”) in Nigeria. You can write to us at ${EMAIL}.`,
      },
      {
        p: "By creating an account or using the service you agree to these terms and to our Privacy Policy. If you do not agree, please do not use the service. The Public Explorer, the Data sources page and these documents can be read without an account.",
      },
    ],
  },
  {
    id: "what-it-is",
    heading: "2. What World Vitality is, and is not",
    blocks: [
      {
        p: "World Vitality lets you look at weather, climate, fire, flood and other environmental information for places you care about, in workspaces for different kinds of work.",
      },
      {
        p: "It is an information tool. It is not an emergency service, not a warning system, and not a substitute for official warnings from your national or local authorities.",
      },
      {
        ul: [
          "Fires, floods, alerts, forecasts and camera pictures come from other organisations. They can be late, incomplete, wrong or only a model’s estimate. A fire or flood that is not shown can still be real.",
          "If someone is in danger, call your local emergency number (112 works in many countries) and follow the instructions of the authorities. Do not use World Vitality, including its support chat, to decide whether someone is safe or to report an emergency.",
          "Decisions about people, property, money or safety remain yours. Please check anything important with the official source.",
        ],
      },
    ],
  },
  {
    id: "account",
    heading: "3. Your account",
    blocks: [
      {
        ul: [
          "You must be at least 18 years old to create an account.",
          "Give us a real email address and keep your sign-in details to yourself. You are responsible for what happens under your account, so tell us at once if you think someone else has used it.",
          "If you create or join an organisation, its owner controls who is in it and the plan it uses. What members add to an organisation belongs to that organisation’s workspace, and its members can see it.",
          "You can delete your account at any time in Settings. Deletion is immediate and cannot be undone, so download your data first if you want a copy.",
        ],
      },
    ],
  },
  {
    id: "plans",
    heading: "4. Plans and payments",
    blocks: [
      {
        ul: [
          "The Basic plan is free. Standard and Premium are paid subscriptions. Enterprise is agreed with us in writing.",
          "A paid plan renews automatically every month or every year until you cancel. The price, the currency and the period are shown before you pay, and the price you see is the price you pay. Prices are shown in Nigerian naira (₦) or US dollars ($), depending on where you are.",
          "Payments are handled by Paystack. We never see or store your card number, and Paystack’s own terms apply to the payment itself.",
          "You can cancel at any time on the Plan and billing page. Your paid features stay until the end of the period you have already paid for.",
          "If a payment fails you will be told, and you will have a short time to put it right. After that you return to the Basic plan: anything above its limits becomes read-only, and nothing is deleted.",
          "We may change our prices. A change applies from your next renewal, and we will tell you before it does, so you can cancel first.",
          `Money paid for a period that has started is not refunded, except where the law says otherwise or where we agree to make an exception. If you think you were charged by mistake, write to ${EMAIL} and we will look into it promptly.`,
        ],
      },
    ],
  },
  {
    id: "fair-use",
    heading: "5. Using the service fairly",
    blocks: [
      { p: "Please do not:" },
      {
        ul: [
          "break the law, or help anyone else to;",
          "try to get around plan limits, security or rate limits, or overload the service, including with automated requests beyond normal use;",
          "upload or share another person’s private information without the right to;",
          "sell or republish the data shown here as if it were yours. Much of it belongs to other organisations and comes with its own licence and credit requirements, listed on the Data sources page;",
          "use the service to dispatch or coordinate emergency response.",
        ],
      },
      {
        p: "We may limit or suspend an account that breaks these terms, and we will say why where we can.",
      },
    ],
  },
  {
    id: "your-content",
    heading: "6. What you add",
    blocks: [
      {
        p: "Places, fields, properties, locations, comments and other things you add stay yours. You allow us to store them, process them and show them to the people you share them with, only so that we can run the service for you.",
      },
      {
        p: "The World Vitality name, logo and software are ours unless a licence says otherwise. Third-party data stays with its owners.",
      },
    ],
  },
  {
    id: "third-party",
    heading: "7. Other organisations’ data and services",
    blocks: [
      {
        p: "World Vitality shows data and uses services from other organisations (weather providers, NASA, GDACS, public agencies, map and payment providers). They are listed on the Data sources and credits page. Their terms apply to their data, they do not run or endorse World Vitality, and they can change or stop their service. We may add, change or remove a source at any time.",
      },
    ],
  },
  {
    id: "availability",
    heading: "8. Keeping the service running, and changing it",
    blocks: [
      {
        p: "We work to keep World Vitality available and accurate, but it is provided as it is. It may be unavailable for a while, and features can change, move between plans or be removed. If we remove something you pay for, we will tell you and deal with it fairly.",
      },
    ],
  },
  {
    id: "liability",
    heading: "9. Our responsibility",
    blocks: [
      {
        p: "To the extent the law allows:",
      },
      {
        ul: [
          "we give no promise that the service or any data in it is accurate, complete, on time or fit for a particular purpose;",
          "we are not responsible for loss that comes from relying on the data, alerts, forecasts or pictures shown, from other organisations’ data or services, or from the service being unavailable;",
          "we are not responsible for indirect or knock-on loss, such as lost profit, lost business or lost opportunity;",
          "for a claim connected with a paid plan, our total responsibility is limited to what you paid us in the 12 months before the claim.",
        ],
      },
      {
        p: "Nothing in these terms limits responsibility that cannot be limited by law, and nothing takes away the rights you have as a consumer under Nigerian law.",
      },
    ],
  },
  {
    id: "privacy",
    heading: "10. Your information",
    blocks: [
      {
        p: "How we collect and use personal information is explained in the Privacy Policy.",
      },
    ],
  },
  {
    id: "changes",
    heading: "11. Changes to these terms",
    blocks: [
      {
        p: "We may update these terms. The date at the top shows the latest version. If a change matters to you, such as a change to a paid plan, we will tell you in the app or by email before it applies to you. If you keep using the service after a change takes effect, you accept the new terms.",
      },
    ],
  },
  {
    id: "law",
    heading: "12. Governing law, and settling problems",
    blocks: [
      {
        p: "These terms are governed by the laws of the Federal Republic of Nigeria.",
      },
      {
        p: `If you have a problem or a complaint, please email ${EMAIL} and tell us what happened. We will reply and try in good faith to settle it with you by email. Most problems can be settled that way.`,
      },
      {
        p: "If we cannot settle a dispute by email, either of us may take it to the courts of Nigeria. You can also contact a consumer or data protection authority at any time, such as the Federal Competition and Consumer Protection Commission or the Nigeria Data Protection Commission.",
      },
    ],
  },
  {
    id: "general",
    heading: "13. General",
    blocks: [
      {
        p: "If part of these terms turns out to be unenforceable, the rest still applies. If we do not enforce a term straight away, we have not given it up. These terms, the Privacy Policy and any plan terms we agree with you in writing are the whole agreement between us about the service.",
      },
    ],
  },
  {
    id: "contact",
    heading: "14. Contact",
    blocks: [{ p: `${NAME}, Nigeria. Email: ${EMAIL}` }],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "who",
    heading: "1. Who we are",
    blocks: [
      {
        p: `${NAME} (“we”, “us”) runs World Vitality from Nigeria and is the controller of your personal information. This policy explains what we collect, why, who else sees it and what you can do about it. It is written to meet the Nigeria Data Protection Act 2023 and applies wherever you are. Write to us at ${EMAIL}.`,
      },
    ],
  },
  {
    id: "collect",
    heading: "2. What we collect",
    blocks: [
      { p: "You give us:" },
      {
        ul: [
          "Account details: your email address, a password (stored only as a one-way scrambled value, never readable by us), an optional display name, your language, and the role and home place you choose when you set up. If you sign in with Google, we receive the name and email Google shares.",
          "What you save: places, fields, insured properties, monitored locations (names, positions and notes), comments, the organisation you create or join, your role in it, and the email addresses of people you invite.",
          "Notification choices and the notices in your inbox.",
          "Messages you email to us, and whatever you put in them.",
        ],
      },
      { p: "We record when you use the service:" },
      {
        ul: [
          "Payments: your plan, its status and dates, Paystack’s customer and subscription codes, and a record of each payment (amount, currency, date, reference, status). Paystack collects your card or bank details; we never receive or store them.",
          "Technical records: your IP address and basic browser information in server logs, which we use for security, to stop abuse and to find faults. Failed sign-in attempts are counted per email address and per IP address so that guessing a password gets locked out. We also count a few product events (for example, which kind of page was opened), without any third-party analytics.",
          "Cookies and similar storage that the service needs: your sign-in session, your language choice and small settings such as whether the sidebar is collapsed. The app can also keep copies of pages on your device so it opens quickly and works offline. We do not use advertising cookies or trackers.",
        ],
      },
    ],
  },
  {
    id: "places",
    heading: "3. What leaves our servers when you look at a place",
    blocks: [
      {
        p: "To show weather, hazards and maps, we send the position of a place (and the words you typed when you searched for one) to the data providers listed on the Data sources page, such as Open-Meteo and NASA. We do not send them your name or email.",
      },
      {
        ul: [
          "Map pictures are requested from map servers such as OpenStreetMap’s, and camera pictures are loaded straight from the agencies that run the cameras. Those servers see your IP address, as any website you visit does.",
          "When the app is open, we compare the positions of your saved places with public hazard information (for example official weather alerts and satellite heat detections) to create notices in your inbox. Nothing is sent to your phone or email for this.",
          "When you choose a password, the first five characters of a one-way scramble of it are sent to the Have I Been Pwned service to check whether it appeared in a data breach. The password itself never leaves your device in readable form, and the service cannot tell which password it was.",
        ],
      },
    ],
  },
  {
    id: "support-chat",
    heading: "4. The help chat",
    blocks: [
      {
        p: "The help chat has built-in answers and, when we switch it on, an AI assistant. The topic buttons and the built-in answers run on your device: nothing you press or read there is sent anywhere. The notice at the top of the chat window always says which kind of chat you are in.",
      },
      {
        p: "When the AI assistant is on and you type your own question:",
      },
      {
        ul: [
          "What you type (up to 500 characters) and the last six messages of the chat are sent from our server to Flow, our own assistant service, which passes them to an AI provider to write the reply. The providers are Groq and Cloudflare Workers AI, and no others.",
          "We send nothing else: no cookie, no account, name or email address, no IP address, and not the page you are on. Flow and the AI providers see our server, not you.",
          "Messages that suggest someone is in danger are never sent. The chat answers those itself with the emergency note.",
          "We do not save what you type or the reply. Our logs record only that a call happened, how long it took and why it failed, never the words. Flow keeps no copy of the conversation by design: it is not added to Flow’s memory or action log, and its server logs hold technical flags rather than your words and are kept for a short time. One rare exception: if an AI model writes out its own working notes, Flow may keep the latest 100 of those notes, and a note could quote part of your question.",
          `Flow runs on Vercel’s servers in ${FLOW_REGION}. By their own published terms (read on 2026-11-17), Groq does not keep requests by default but may keep them for up to 30 days to guard against abuse and failures, in the United States, and Cloudflare does not keep requests once they are answered and does not use them to train AI models. Their terms apply to them, not to us, and may change.`,
          "Please do not type passwords, card numbers or personal details into the chat. The assistant is not a person, it can be wrong, and it cannot send help in an emergency.",
        ],
      },
      {
        p: `When the AI assistant is off, what you type stays on your device and is not stored by us. If you choose to email us from the chat, your own mail app opens with the chat copied in for you to read and edit; we receive only what you send to ${EMAIL}.`,
      },
    ],
  },
  {
    id: "why",
    heading: "5. Why we use it",
    blocks: [
      {
        ul: [
          "To provide the service you asked for: your account, saved places, organisation, notices and plan (a contract with you).",
          "To take payment and keep payment records, which we must also keep for accounting and tax (a contract and a legal duty).",
          "To keep the service secure, prevent abuse and fix faults (our legitimate interest in running a safe service).",
          "To write to you about your account, such as sign-in links, billing problems and changes to these documents.",
          "Where we ask for your consent, you can withdraw it at any time.",
        ],
      },
      {
        p: "We do not sell personal information, we do not use it for advertising, and we do not make decisions about you by computer alone that have legal or similarly serious effects.",
      },
    ],
  },
  {
    id: "share",
    heading: "6. Who else sees it",
    blocks: [
      {
        ul: [
          "Other members of your organisation can see your name or email, your role, and what you add to the organisation.",
          "Supabase hosts our database and sign-in, in Ireland (eu-west-1).",
          "Vercel hosts the app and keeps short-lived server logs; its servers for this app are in the United States.",
          "Paystack processes payments and holds its own records under its own terms and the law.",
          "Google, if you choose to sign in with Google.",
          "Our sign-in provider’s email service, which sends sign-in links and password resets.",
          "The data and map providers in section 3, who receive places and your IP address, not your identity.",
          "When the help chat’s AI assistant is on: Flow (our assistant service) and the AI providers Groq and Cloudflare Workers AI, who receive only what you type in the chat (section 4), never your identity.",
          "Authorities or other parties where the law requires it.",
        ],
      },
    ],
  },
  {
    id: "transfers",
    heading: "7. Transfers outside Nigeria",
    blocks: [
      {
        p: `Our providers store and process information in Ireland and the United States, so your information leaves Nigeria. We choose established providers that commit to protecting it by contract, and we send them only what the service needs. When the help chat’s AI assistant is on, what you type there is processed by Flow in ${FLOW_REGION}, by Groq in the United States, and by Cloudflare, which does not state a country (section 4).`,
      },
    ],
  },
  {
    id: "keep",
    heading: "8. How long we keep it",
    blocks: [
      {
        ul: [
          "Account information and what you saved: until you delete your account or remove it. Deleting your account in Settings removes your profile, memberships, notifications and comments straight away. If you own an organisation, what is saved in it is deleted too; if you are a member of someone else’s, what you added stays there without your name on it.",
          "Payment records tied to your account are deleted with it. Records that Paystack keeps follow Paystack’s terms and the law. Billing event records may remain without a link to your account.",
          "Sign-in attempt counters and server logs are kept only for a short time.",
          "Help chat: we do not save what you type. What the assistant’s providers may keep is in section 4.",
          "Backups, where they exist, expire on their own schedule.",
        ],
      },
    ],
  },
  {
    id: "rights",
    heading: "9. Your rights",
    blocks: [
      {
        p: "You can ask to see the personal information we hold about you, to correct it, to have it deleted, to limit or object to how we use it, to receive it in a portable form, and to withdraw consent you gave.",
      },
      {
        ul: [
          "In Settings you can download your data in one click and delete your account immediately.",
          `For anything else, email ${EMAIL}. We will reply promptly.`,
          "If you are not happy with how we handled your information, you can complain to the Nigeria Data Protection Commission, or to the data protection authority where you live.",
        ],
      },
    ],
  },
  {
    id: "security",
    heading: "10. Keeping it safe",
    blocks: [
      {
        p: "Connections are encrypted, passwords are stored scrambled and checked against known breaches, sign-in attempts are rate limited, and each person can reach only their own data and their own organisation’s. No system is perfectly secure. If a breach puts your information at risk, we will tell you and the authorities as the law requires.",
      },
    ],
  },
  {
    id: "children",
    heading: "11. Children",
    blocks: [
      {
        p: `World Vitality is for people aged 18 and over. We do not knowingly collect information from children. If you think a child has given us information, email ${EMAIL} and we will delete it.`,
      },
    ],
  },
  {
    id: "changes",
    heading: "12. Changes to this policy",
    blocks: [
      {
        p: "If we change what we collect or how we use it, we will update this page and its date, and tell you in the app or by email when the change matters to you.",
      },
    ],
  },
  {
    id: "contact",
    heading: "13. Contact",
    blocks: [{ p: `${NAME}, Nigeria. Email: ${EMAIL}` }],
  },
];
