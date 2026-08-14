import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next's optimizer defaults to `Content-Disposition: attachment` on
    // every optimized image response. Chrome ignores that header for
    // <img> embeds and renders inline anyway, but Safari/WebKit — which is
    // what actually backs the iOS Simulator's WKWebView — honors it and
    // refuses to render the image at all, leaving a blank box. This is
    // what silently broke every next/image in the iOS app while looking
    // fine in any Chromium-based browser.
    contentDispositionType: "inline",
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.vimeocdn.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

export default nextConfig;
