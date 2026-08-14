import { sendEmail } from "@/lib/email/resend";
import { emailTemplates } from "@/lib/email/templates";
import { APP_NAME } from "@/lib/constants";

/**
 * Best-effort send for *notification* mail — email that accompanies an action
 * but is never the point of it (welcome, approval, group requests,
 * announcements, prayer updates).
 *
 * These must not be able to fail the action that triggered them. Registration
 * previously awaited sendWelcomeEmail directly, so a provider error (an
 * unverified sender domain, a rejected recipient, an outage) threw *after* the
 * account row was already committed: the new member got an infinite
 * "Submitting…" spinner, and retrying told them the account couldn't be
 * created — because it already existed. Same shape of bug lurked in member
 * approval, group joins, and announcement fan-out.
 *
 * Delivery-critical mail (magic-link sign-in, verification codes) deliberately
 * does NOT use this: there the send *is* the action, so the caller must see
 * the failure and surface it.
 */
async function sendNotificationEmail(params: { to: string; subject: string; html: string }) {
  try {
    await sendEmail(params);
  } catch (error) {
    console.error(`[email] notification send failed (to=${params.to}, subject="${params.subject}")`, error);
  }
}

export async function sendMagicLinkEmail(email: string, url: string) {
  await sendEmail({
    to: email,
    subject: `Your ${APP_NAME} sign-in link`,
    html: emailTemplates.verifyMagicLink(url),
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  await sendNotificationEmail({ to: email, subject: `Welcome to ${APP_NAME}`, html: emailTemplates.welcome(name) });
}

export async function sendAccountApprovedEmail(email: string, name: string, url: string) {
  await sendNotificationEmail({
    to: email,
    subject: "Your account has been approved",
    html: emailTemplates.accountApproved(name, url),
  });
}

export async function sendGroupRequestReceivedEmail(email: string, groupName: string) {
  await sendNotificationEmail({
    to: email,
    subject: `Request received: ${groupName}`,
    html: emailTemplates.groupRequestReceived(groupName),
  });
}

export async function sendGroupRequestApprovedEmail(email: string, groupName: string, url: string) {
  await sendNotificationEmail({
    to: email,
    subject: `You're in! Welcome to ${groupName}`,
    html: emailTemplates.groupRequestApproved(groupName, url),
  });
}

export async function sendEventReminderEmail(email: string, eventTitle: string, when: string, url: string) {
  await sendNotificationEmail({
    to: email,
    subject: `Reminder: ${eventTitle}`,
    html: emailTemplates.eventReminder(eventTitle, when, url),
  });
}

export async function sendAnnouncementEmail(email: string, title: string, bodyText: string, url: string) {
  await sendNotificationEmail({ to: email, subject: title, html: emailTemplates.announcement(title, bodyText, url) });
}

export async function sendPrayerUpdateEmail(email: string, requestTitle: string, url: string) {
  await sendNotificationEmail({
    to: email,
    subject: "Update on your prayer request",
    html: emailTemplates.prayerUpdate(requestTitle, url),
  });
}

export async function sendVerificationCodeEmail(email: string, code: string, purpose: string) {
  await sendEmail({
    to: email,
    subject: `${code} is your verification code`,
    html: emailTemplates.verificationCode(code, purpose),
  });
}
