import { APP_NAME, APP_FULL_NAME, APP_TAGLINE } from "@/lib/constants";

// Mirrors the in-app design tokens (src/app/globals.css light theme) —
// keep these in sync if the app's brand colors change.
const BRAND = {
  primary: "#f97316",
  primaryDark: "#c2410c",
  ink: "#171719",
  inkMuted: "#6f6a64",
  surface: "#f7f4f1",
  border: "#ebe6e1",
};

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif";

// Same glyph as the in-app Logo component (lucide-react "flame" path),
// rendered as inline SVG so the email header matches the app header.
const FLAME_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" fill="#ffffff"/></svg>`;

export function emailLayout(opts: { preheader?: string; title: string; bodyHtml: string; ctaText?: string; ctaUrl?: string }) {
  const { preheader = "", title, bodyHtml, ctaText, ctaUrl } = opts;
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BRAND.surface};font-family:${FONT_STACK};color:${BRAND.ink};">
    <span style="display:none;font-size:1px;color:${BRAND.surface};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surface};padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
            <tr>
              <td style="padding:0 8px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:32px;height:32px;border-radius:16px;background:${BRAND.primary};text-align:center;vertical-align:middle;">${FLAME_SVG}</td>
                    <td style="padding-left:10px;font-size:15px;font-weight:800;letter-spacing:0.02em;color:${BRAND.ink};text-transform:uppercase;">${APP_NAME}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border:1px solid ${BRAND.border};border-radius:24px;padding:32px;">
                <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${BRAND.ink};">${title}</h1>
                <div style="font-size:15px;line-height:1.7;color:${BRAND.ink};">${bodyHtml}</div>
                ${
                  ctaText && ctaUrl
                    ? `<div style="margin-top:28px;">
                        <a href="${ctaUrl}" style="display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:999px;font-size:14px;font-weight:600;">${ctaText}</a>
                      </div>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:20px 8px 0;font-size:12px;color:${BRAND.inkMuted};">
                ${APP_FULL_NAME} · ${APP_TAGLINE}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export const emailTemplates = {
  welcome: (name: string) =>
    emailLayout({
      title: `Welcome, ${name}!`,
      bodyHtml: `<p>We're so glad you've joined ${APP_FULL_NAME}. Your account request has been received.</p><p>A member of our team will review your request shortly. Once approved, you'll have full access to groups and everything else our church family shares together.</p>`,
    }),

  verifyMagicLink: (url: string) =>
    emailLayout({
      title: "Your sign-in link",
      bodyHtml: `<p>Tap the button below to securely sign in to ${APP_NAME}. This link expires shortly and can only be used once.</p>`,
      ctaText: "Sign in",
      ctaUrl: url,
    }),

  resetPassword: (url: string) =>
    emailLayout({
      title: "Reset your password",
      bodyHtml: `<p>We received a request to reset your password. If this was you, choose a new password using the button below. If you didn't request this, you can safely ignore this email.</p>`,
      ctaText: "Reset password",
      ctaUrl: url,
    }),

  accountApproved: (name: string, url: string) =>
    emailLayout({
      title: `You're in, ${name}!`,
      bodyHtml: `<p>Your ${APP_NAME} account has been approved. We can't wait to grow alongside you.</p>`,
      ctaText: "Go to your home feed",
      ctaUrl: url,
    }),

  groupRequestReceived: (groupName: string) =>
    emailLayout({
      title: "Your group request was received",
      bodyHtml: `<p>Thanks for your interest in <strong>${groupName}</strong>. A group leader will review your request soon.</p>`,
    }),

  groupRequestApproved: (groupName: string, url: string) =>
    emailLayout({
      title: `Welcome to ${groupName}`,
      bodyHtml: `<p>Your request to join <strong>${groupName}</strong> has been approved. We're glad to have you.</p>`,
      ctaText: "Visit the group",
      ctaUrl: url,
    }),

  eventReminder: (eventTitle: string, when: string, url: string) =>
    emailLayout({
      title: `Reminder: ${eventTitle}`,
      bodyHtml: `<p>Just a friendly reminder — <strong>${eventTitle}</strong> is coming up on ${when}. We hope to see you there.</p>`,
      ctaText: "View event details",
      ctaUrl: url,
    }),

  newMessage: (senderName: string, url: string) =>
    emailLayout({
      title: "New message",
      bodyHtml: `<p><strong>${senderName}</strong> sent you a new message on ${APP_NAME}.</p>`,
      ctaText: "Read message",
      ctaUrl: url,
    }),

  digest: (period: "Daily" | "Weekly", itemsHtml: string, url: string) =>
    emailLayout({
      title: `Your ${period.toLowerCase()} digest`,
      bodyHtml: `<p>Here's what you may have missed at ${APP_NAME}:</p>${itemsHtml}`,
      ctaText: `Open ${APP_NAME}`,
      ctaUrl: url,
    }),

  announcement: (title: string, bodyText: string, url: string) =>
    emailLayout({
      title,
      bodyHtml: `<p>${bodyText}</p>`,
      ctaText: "Read more",
      ctaUrl: url,
    }),

  prayerUpdate: (requestTitle: string, url: string) =>
    emailLayout({
      title: "There's an update on your prayer request",
      bodyHtml: `<p>Your prayer request "<strong>${requestTitle}</strong>" has a new update from our prayer team.</p>`,
      ctaText: "View update",
      ctaUrl: url,
    }),

  verificationCode: (code: string, purpose: string) =>
    emailLayout({
      title: "Your verification code",
      bodyHtml: `<p>Use this code to confirm ${purpose}. It expires in 10 minutes.</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:0.2em;color:${BRAND.ink};margin:20px 0;">${code}</p>
        <p>If you didn't request this, you can safely ignore this email — your account is still secure.</p>`,
    }),
};
