"use client";

import { createContext, useContext } from "react";

// Set once per request by the app shell (which already knows the viewer's
// profile) and read from anywhere via usePreferredLanguage() — avoids
// threading preferredLanguage as a prop through every page that renders a
// translatable message or announcement.
const PreferredLanguageContext = createContext<string>("en");

export function PreferredLanguageProvider({
  language,
  children,
}: {
  language: string;
  children: React.ReactNode;
}) {
  return <PreferredLanguageContext.Provider value={language}>{children}</PreferredLanguageContext.Provider>;
}

export function usePreferredLanguage() {
  return useContext(PreferredLanguageContext);
}
