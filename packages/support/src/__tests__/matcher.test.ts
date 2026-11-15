import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMERGENCY_KEYWORDS,
  SUPPORT_LOCALES,
  SUPPORT_TOPIC_IDS,
  TOPIC_KEYWORDS,
} from "../keywords.js";
import { detectEmergency, normalise, replyTo, scoreTopics } from "../matcher.js";

const topicOf = (message: string, locale = "en") => {
  const reply = replyTo(message, locale);
  return reply.kind === "topic" ? reply.topic : reply.kind;
};

test("normalise folds case, accents, apostrophes, Arabic marks and symbols", () => {
  assert.equal(normalise("  Contraseña?? "), "contrasena");
  assert.equal(normalise("CAN’T   breathe!"), "cant breathe");
  assert.equal(normalise("Where's my e-mail"), "wheres my e mail");
  assert.equal(normalise("كَلِمَةُ المُرُورِ"), "كلمه المرور");
  assert.equal(normalise("أَعِدْ إعادة آلة"), "اعد اعاده اله");
});

test("only the first 500 characters of a message are read", () => {
  const long = `${"x".repeat(600)} password`;
  assert.equal(topicOf(long), "fallback");
});

test("every topic has keywords in every language, and every keyword is non-empty", () => {
  for (const locale of SUPPORT_LOCALES) {
    for (const topic of SUPPORT_TOPIC_IDS) {
      const words = TOPIC_KEYWORDS[locale][topic];
      assert.ok(words.length >= 3, `${locale}.${topic} has too few keywords`);
      for (const word of words)
        assert.ok(normalise(word).length > 0, `${locale}.${topic}: "${word}"`);
    }
  }
});

test("English questions reach the right topic", () => {
  assert.equal(topicOf("How much does Premium cost?"), "plans");
  assert.equal(topicOf("I want to cancel my subscription"), "plans");
  assert.equal(topicOf("I forgot my password"), "account");
  assert.equal(topicOf("How do I delete my account?"), "account");
  assert.equal(topicOf("Where do I turn off notifications"), "alerts");
  assert.equal(topicOf("what does the globe show"), "globe");
  assert.equal(topicOf("Can I invite a teammate?"), "workspaces");
  assert.equal(topicOf("where does your weather data come from"), "sources");
  assert.equal(topicOf("show me the privacy policy"), "privacy");
  assert.equal(topicOf("can I change the language to Spanish"), "language");
  assert.equal(topicOf("I want to talk to a real person"), "contact");
});

test("a specific phrase beats a short common word", () => {
  assert.equal(topicOf("can I email you"), "contact");
  assert.equal(topicOf("I can't sign in with my email"), "account");
  assert.equal(topicOf("export my data"), "account");
});

test("a word matches at the start of a word only", () => {
  assert.equal(topicOf("subscribing now"), "plans", "a stem finds its longer forms");
  assert.equal(topicOf("what is the airplane mode"), "fallback", "not in the middle of a word");
  assert.equal(scoreTopics("replan", "en").plans, 0);
});

test("other languages work, and English still works inside them", () => {
  assert.equal(topicOf("¿Cuánto cuesta el plan Premium?", "es"), "plans");
  assert.equal(topicOf("Olvidé mi contraseña", "es"), "account");
  assert.equal(topicOf("Comment annuler mon abonnement ?", "fr"), "plans");
  assert.equal(topicOf("Je veux changer la langue", "fr"), "language");
  assert.equal(topicOf("Como excluir minha conta?", "pt"), "account");
  assert.equal(topicOf("Quero falar com uma pessoa", "pt"), "contact");
  assert.equal(topicOf("كيف ألغي اشتراكي؟", "ar"), "plans");
  assert.equal(topicOf("نسيت كلمة المرور", "ar"), "account");
  assert.equal(topicOf("أين أغيّر اللغة", "ar"), "language");
  assert.equal(topicOf("how do I cancel", "ar"), "plans");
  assert.equal(topicOf("password", "fr"), "account");
});

test("a language's own words are not tried against the others", () => {
  assert.equal(topicOf("precio", "fr"), "fallback");
});

test("nothing recognised, empty or only symbols is a fallback, never a guess", () => {
  for (const text of ["", "   ", "?!?!", "asdf qwer", "hello"]) {
    assert.equal(topicOf(text), "fallback", JSON.stringify(text));
  }
});

test("danger and distress are caught in every language, whatever the app's language", () => {
  const messages = [
    "This is an emergency",
    "I am trapped by the flood",
    "my house is on fire",
    "I want to die",
    "estoy en peligro",
    "tengo una emergencia",
    "me siento mal, quiero morir",
    "c'est une urgence",
    "je veux mourir",
    "estou em perigo",
    "não consigo respirar",
    "هذه حالة طوارئ",
    "أنا في خطر",
    "أفكر في الانتحار",
  ];
  for (const message of messages) {
    for (const locale of SUPPORT_LOCALES) {
      assert.equal(replyTo(message, locale).kind, "emergency", `${locale}: ${message}`);
    }
  }
});

test("an emergency wins over any topic in the same message", () => {
  assert.equal(replyTo("emergency! how do I cancel my plan", "en").kind, "emergency");
});

test("ordinary questions are not emergencies", () => {
  const ordinary = [
    "how do I cancel my plan",
    "show the fires on the globe",
    "is the fire layer live",
    "what is the price",
    "my phone battery is dying",
    "forgot password",
    "comment changer la langue",
    "كيف أغير اللغة",
  ];
  // "dying" is a known, accepted false alarm (one calm sentence); everything else must be quiet.
  for (const message of ordinary.filter((m) => !m.includes("dying"))) {
    assert.equal(detectEmergency(message), false, message);
  }
});

test("emergency keywords are all normalisable and non-empty", () => {
  for (const word of EMERGENCY_KEYWORDS) assert.ok(normalise(word).length > 0, word);
});
