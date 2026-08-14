import type { CapacitorConfig } from "@capacitor/cli";

// TODO before any real build: replace `appId` and `server.url` below.
//
// appId — reverse-DNS bundle identifier. This is essentially permanent once
// used in App Store Connect (changing it later means a new app listing, not
// a rename), so confirm it deliberately rather than accepting this default.
//
// server.url — this app is a full dynamic Next.js app (server actions, Prisma,
// live auth sessions), so it can't be statically exported into the binary.
// Capacitor instead loads this URL directly in a native WKWebView. Point it
// at a real staging/production deployment before syncing — localhost won't
// work on a physical device or for Apple's review team.
const config: CapacitorConfig = {
  appId: "net.livingword.community",
  // The home-screen/launcher label — kept short deliberately. The fuller
  // "Groups - Living Word Rockland" name lives in the web app's page
  // metadata and email branding instead (see src/lib/constants.ts).
  appName: "Groups",
  webDir: "public",
  server: {
    // TEMPORARY for local preview in the iOS Simulator only — the
    // Simulator shares the host Mac's network stack, so localhost is
    // reachable from inside it (a physical device could not reach this).
    // Revert to the real staging/production URL (with cleartext: false)
    // before any build meant for a device or App Store review.
    url: "http://localhost:3000",
    cleartext: true,
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
