import { sendEmail } from "@/lib/email/resend";
import { emailTemplates } from "@/lib/email/templates";
import { APP_NAME } from "@/lib/constants";

export async function sendMagicLinkEmail(email: string, url: string) {
  await sendEmail({
    to: email,
    subject: `Your ${APP_NAME} sign-in link`,
    html: emailTemplates.verifyMagicLink(url),
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  await sendEmail({ to: email, subject: `Welcome to ${APP_NAME}`, html: emailTemplates.welcome(name) });
}

export async function sendAccountApprovedEmail(email: string, name: string, url: string) {
  await sendEmail({
    to: email,
    subject: "Your account has been approved",
    html: emailTemplates.accountApproved(name, url),
  });
}

export async function sendGroupRequestReceivedEmail(email: string, groupName: string) {
  await sendEmail({
    to: email,
    subject: `Request received: ${groupName}`,
    html: emailTemplates.groupRequestReceived(groupName),
  });
}

export async function sendGroupRequestApprovedEmail(email: string, groupName: string, url: string) {
  await sendEmail({
    to: email,
    subject: `You're in! Welcome to ${groupName}`,
    html: emailTemplates.groupRequestApproved(groupName, url),
  });
}

export async function sendEventReminderEmail(email: string, eventTitle: string, when: string, url: string) {
  await sendEmail({
    to: email,
    subject: `Reminder: ${eventTitle}`,
    html: emailTemplates.eventReminder(eventTitle, when, url),
  });
}

export async function sendAnnouncementEmail(email: string, title: string, bodyText: string, url: string) {
  await sendEmail({ to: email, subject: title, html: emailTemplates.announcement(title, bodyText, url) });
}

export async function sendPrayerUpdateEmail(email: string, requestTitle: string, url: string) {
  await sendEmail({
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
