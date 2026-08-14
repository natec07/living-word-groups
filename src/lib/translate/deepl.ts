import "server-only";

// Maps our simple stored language codes to DeepL's exact target-language
// codes, which don't always match plain ISO 639-1 (DeepL wants regional
// variants for English/Portuguese, for example).
const DEEPL_TARGET_LANG: Record<string, string> = {
  en: "EN-US",
  es: "ES",
  fr: "FR",
  de: "DE",
  pt: "PT-BR",
  it: "IT",
  nl: "NL",
  pl: "PL",
  ru: "RU",
  uk: "UK",
  tr: "TR",
  sv: "SV",
  da: "DA",
  fi: "FI",
  el: "EL",
  cs: "CS",
  ro: "RO",
  hu: "HU",
  id: "ID",
  ja: "JA",
  ko: "KO",
  zh: "ZH",
};

function deeplHost() {
  // Free-tier API keys always end in ":fx" — DeepL routes them to a
  // separate host from paid/pro keys.
  return process.env.DEEPL_API_KEY?.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
}

export class TranslationNotConfiguredError extends Error {
  constructor() {
    super("Translation isn't set up yet — ask an admin to add a DeepL API key.");
  }
}

export async function translateText(text: string, targetLanguageCode: string): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) throw new TranslationNotConfiguredError();

  const targetLang = DEEPL_TARGET_LANG[targetLanguageCode] ?? targetLanguageCode.toUpperCase();

  const res = await fetch(`https://${deeplHost()}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: [text], target_lang: targetLang }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`DeepL request failed (${res.status}): ${body}`);
  }

  const data: { translations: { text: string }[] } = await res.json();
  return data.translations[0]?.text ?? text;
}
