import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Living Word Community <hello@livingwordcommunity.church>";

/** Sends via Resend when configured, otherwise logs to the console so local dev keeps working. */
export async function sendEmail(params: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.log(`\n📧  [dev email] to=${params.to} subject="${params.subject}"\n${params.html}\n`);
    return;
  }
  // The Resend SDK returns { error } on API-level failures rather than
  // throwing, so an unverified sender domain would otherwise fail silently
  // and the caller (e.g. a "check your email" toast) would never know.
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  if (error) throw new Error(`Resend failed to send email: ${error.message}`);
}
