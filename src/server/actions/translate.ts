"use server";

import { requireActiveUser } from "@/lib/authz";
import { translateText } from "@/lib/translate/deepl";

// Translate-on-demand only — triggered by an explicit tap on a message or
// announcement's "Translate" action, never run automatically, so DeepL
// usage stays bounded to what people actually ask for.
export async function translateTextAction(text: string, targetLanguageCode: string) {
  await requireActiveUser();
  if (!text.trim()) return text;
  return translateText(text, targetLanguageCode);
}
