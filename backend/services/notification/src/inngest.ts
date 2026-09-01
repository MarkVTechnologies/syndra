import { getEnv } from "@san/core/env";
import {
  WaitlistConfirmed,
  VerifyEmail,
  Welcome,
  LoginAlert,
  PasswordResetRequested,
  PasswordChanged,
  SyndicatorWelcome,
  NewReferral,
  AmbassadorApproved,
  InvestmentCreated,
  InvestmentConfirmed,
  CommissionAccrued,
  AdminInvestmentAlert,
  PayoutPaid,
  AdminDigest,
  AccountLocked,
  LaunchInvite,
  ReconciliationAlert,
} from "@san/email";
import { inngest } from "./clients";
import { sendEmail } from "./send";

export { inngest };

export const sendWaitlistConfirmed = inngest.createFunction(
  { id: "notification-waitlist-confirmed", retries: 4 },
  { event: "waitlist/registered" },
  async ({ event }) => {
    const env = getEnv();
    const { waitlistId, email, fullName, desiredSlug, position } = event.data;
    const appUrl = env.NEXT_PUBLIC_APP_URL;
    const shareUrl = `${appUrl}/?ref=waitlist-${waitlistId}`;

    await sendEmail({
      to: email,
      template: "waitlist-confirmed",
      subject: `You're #${position} on the SAN ambassador waitlist`,
      element: WaitlistConfirmed({
        fullName,
        position,
        reservedSlug: desiredSlug,
        appUrl,
        shareUrl,
      }),
      idempotencyKey: `waitlist-confirmed:${email}:${waitlistId}`,
      relatedTo: { type: "waitlist", id: waitlistId },
    });

    return { sent: true };
  }
);

export const sendVerifyEmail = inngest.createFunction(
  { id: "notification-verify-email", retries: 4 },
  { event: "user/registered" },
  async ({ event }) => {
    const { userId, email, verifyUrl } = event.data;
    await sendEmail({
      to: email,
      template: "verify-email",
      subject: "Verify your email",
      element: VerifyEmail({ verifyUrl }),
      idempotencyKey: `verify-email:${userId}`,
      relatedTo: { type: "user", id: userId },
    });
    return { sent: true };
  }
);

export const sendWelcome = inngest.createFunction(
  { id: "notification-welcome", retries: 4 },
  { event: "user/verified" },
  async ({ event }) => {
    const { userId, email, role, dashboardUrl } = event.data;
    await sendEmail({
      to: email,
      template: "welcome",
      subject: "Welcome to SAN",
      element: Welcome({ role, dashboardUrl }),
      idempotencyKey: `welcome:${userId}`,
      relatedTo: { type: "user", id: userId },
    });
    return { sent: true };
  }
);

/** MANDATORY on every login — PRD §1.2 non-negotiable #6. */
export const sendLoginAlert = inngest.createFunction(
  { id: "notification-login-alert", retries: 4 },
  { event: "user/login" },
  async ({ event }) => {
    const { userId, email, deviceLabel, ip, geo, timestamp, killSessionUrl } = event.data;
    await sendEmail({
      to: email,
      template: "login-alert",
      subject: "New sign-in to your SAN account",
      element: LoginAlert({ deviceLabel, ip, geo, timestamp, killSessionUrl }),
      // Idempotent per login instant, not per user — every login gets its own alert.
      idempotencyKey: `login-alert:${userId}:${timestamp}`,
      relatedTo: { type: "user", id: userId },
    });
    return { sent: true };
  }
);

export const sendPasswordResetRequested = inngest.createFunction(
  { id: "notification-password-reset-requested", retries: 4 },
  { event: "user/password_reset_requested" },
  async ({ event }) => {
    const { email, resetUrl, requestingIp } = event.data;
    await sendEmail({
      to: email,
      template: "password-reset-requested",
      subject: "Reset your password",
      element: PasswordResetRequested({ resetUrl, requestingIp }),
      idempotencyKey: `password-reset:${email}:${resetUrl}`,
      relatedTo: { type: "user", id: email },
    });
    return { sent: true };
  }
);

export const sendPasswordChanged = inngest.createFunction(
  { id: "notification-password-changed", retries: 4 },
  { event: "user/password_changed" },
  async ({ event }) => {
    const { email, revokeAllUrl, changedAt } = event.data;
    await sendEmail({
      to: email,
      template: "password-changed",
      subject: "Password changed",
      element: PasswordChanged({ revokeAllUrl }),
      idempotencyKey: `password-changed:${email}:${changedAt}`,
      relatedTo: { type: "user", id: email },
    });
    return { sent: true };
  }
);

export const sendSyndicatorWelcome = inngest.createFunction(
  { id: "notification-syndicator-welcome", retries: 4 },
  { event: "syndicator/onboarded" },
  async ({ event }) => {
    const { syndicatorId, email, dashboardUrl, ambassador } = event.data;
    await sendEmail({
      to: email,
      template: "syndicator-welcome",
      subject: "Welcome to SAN",
      element: SyndicatorWelcome({ dashboardUrl, ambassador }),
      idempotencyKey: `syndicator-welcome:${syndicatorId}`,
      relatedTo: { type: "syndicator", id: syndicatorId },
    });
    return { sent: true };
  }
);

export const sendNewReferral = inngest.createFunction(
  { id: "notification-new-referral", retries: 4 },
  { event: "syndicator/referred" },
  async ({ event }) => {
    const { ambassadorEmail, syndicatorFirstName, referralCount, dashboardUrl } = event.data;
    await sendEmail({
      to: ambassadorEmail,
      template: "new-referral",
      subject: "New referral",
      element: NewReferral({ syndicatorFirstName, referralCount, dashboardUrl }),
      idempotencyKey: `new-referral:${ambassadorEmail}:${syndicatorFirstName}:${referralCount}`,
      relatedTo: { type: "ambassador", id: ambassadorEmail },
    });
    return { sent: true };
  }
);

export const sendAmbassadorApproved = inngest.createFunction(
  { id: "notification-ambassador-approved", retries: 4 },
  { event: "ambassador/approved" },
  async ({ event }) => {
    const { ambassadorEmail, fullName, slug, micrositeUrl } = event.data;
    await sendEmail({
      to: ambassadorEmail,
      template: "ambassador-approved",
      subject: "You're live on SAN",
      element: AmbassadorApproved({ fullName, micrositeUrl }),
      idempotencyKey: `ambassador-approved:${slug}`,
      relatedTo: { type: "ambassador", id: slug },
    });
    return { sent: true };
  }
);

export const sendInvestmentCreated = inngest.createFunction(
  { id: "notification-investment-created", retries: 4 },
  { event: "investment/created" },
  async ({ event }) => {
    const { investmentId, syndicatorEmail, opportunityTitle, units, amountMinor, reservedUntil, summaryUrl } =
      event.data;
    await sendEmail({
      to: syndicatorEmail,
      template: "investment-created",
      subject: "Complete your investment",
      element: InvestmentCreated({ opportunityTitle, units, amountMinor, reservedUntil, summaryUrl }),
      idempotencyKey: `investment-created:${investmentId}`,
      relatedTo: { type: "investment", id: investmentId },
    });
    return { sent: true };
  }
);

export const sendInvestmentConfirmed = inngest.createFunction(
  { id: "notification-investment-confirmed", retries: 4 },
  { event: "investment/confirmed" },
  async ({ event }) => {
    const { investmentId, syndicatorEmail, units, amountMinor, opportunityTitle, roiPercent, documentUrls, statementUrl } =
      event.data;
    await sendEmail({
      to: syndicatorEmail,
      template: "investment-confirmed",
      subject: "Investment confirmed",
      element: InvestmentConfirmed({ opportunityTitle, units, amountMinor, roiPercent, documentUrls, statementUrl }),
      idempotencyKey: `investment-confirmed:${investmentId}`,
      relatedTo: { type: "investment", id: investmentId },
    });
    return { sent: true };
  }
);

export const sendCommissionAccrued = inngest.createFunction(
  { id: "notification-commission-accrued", retries: 4 },
  { event: "commission/accrued" },
  async ({ event }) => {
    const { ambassadorEmail, opportunityTitle, syndicatorFirstName, amountMinor, maturesInDays, dashboardUrl } =
      event.data;
    await sendEmail({
      to: ambassadorEmail,
      template: "commission-accrued",
      subject: "Commission earned",
      element: CommissionAccrued({ opportunityTitle, syndicatorFirstName, amountMinor, maturesInDays, dashboardUrl }),
      idempotencyKey: `commission-accrued:${ambassadorEmail}:${opportunityTitle}:${syndicatorFirstName}:${amountMinor}`,
      relatedTo: { type: "ambassador", id: ambassadorEmail },
    });
    return { sent: true };
  }
);

export const sendAdminInvestmentAlert = inngest.createFunction(
  { id: "notification-admin-investment-alert", retries: 4 },
  { event: "admin/investment_alert" },
  async ({ event }) => {
    const { adminEmail, opportunityTitle, amountMinor, units, adminUrl } = event.data;
    await sendEmail({
      to: adminEmail,
      template: "admin-investment-alert",
      subject: "New investment confirmed",
      element: AdminInvestmentAlert({ opportunityTitle, amountMinor, units, adminUrl }),
      idempotencyKey: `admin-investment-alert:${adminEmail}:${opportunityTitle}:${amountMinor}:${units}`,
      relatedTo: { type: "admin", id: adminEmail },
    });
    return { sent: true };
  }
);

export const sendPayoutPaid = inngest.createFunction(
  { id: "notification-payout-paid", retries: 4 },
  { event: "payout/paid" },
  async ({ event }) => {
    const { ambassadorEmail, amountMinor, method, reference, commissionCount, dashboardUrl } = event.data;
    await sendEmail({
      to: ambassadorEmail,
      template: "payout-paid",
      subject: "Payout sent",
      element: PayoutPaid({ amountMinor, method, reference, commissionCount, dashboardUrl }),
      idempotencyKey: `payout-paid:${reference}`,
      relatedTo: { type: "ambassador", id: ambassadorEmail },
    });
    return { sent: true };
  }
);

export const sendAdminDigest = inngest.createFunction(
  { id: "notification-admin-digest", retries: 4 },
  { event: "admin/digest" },
  async ({ event }) => {
    const { adminEmail, date, signups24h, referrals24h, investmentVolumeMinor, commissionsAccruedMinor, adminUrl } =
      event.data;
    await sendEmail({
      to: adminEmail,
      template: "admin-digest",
      subject: `Daily digest — ${date}`,
      element: AdminDigest({ date, signups24h, referrals24h, investmentVolumeMinor, commissionsAccruedMinor, adminUrl }),
      idempotencyKey: `admin-digest:${adminEmail}:${date}`,
      relatedTo: { type: "admin", id: adminEmail },
    });
    return { sent: true };
  }
);

export const sendAccountLocked = inngest.createFunction(
  { id: "notification-account-locked", retries: 4 },
  { event: "user/login_locked" },
  async ({ event }) => {
    const { email, ip, unlocksInMinutes } = event.data;
    await sendEmail({
      to: email,
      template: "account-locked",
      subject: "Your SAN account was temporarily locked",
      element: AccountLocked({ ip, unlocksInMinutes }),
      idempotencyKey: `account-locked:${email}:${ip}:${new Date().toISOString().slice(0, 13)}`, // dedupes retries within the same hour
      relatedTo: { type: "user", id: email },
    });
    return { sent: true };
  }
);

export const sendLaunchInvite = inngest.createFunction(
  { id: "notification-launch-invite", retries: 4 },
  { event: "waitlist/launch_invite" },
  async ({ event }) => {
    const { waitlistId, email, fullName, reservedSlug, loginUrl } = event.data;
    await sendEmail({
      to: email,
      template: "launch-invite",
      subject: "We're live — your SAN page is ready",
      element: LaunchInvite({ fullName, reservedSlug, loginUrl }),
      idempotencyKey: `launch-invite:${waitlistId}`,
      relatedTo: { type: "waitlist", id: waitlistId },
    });
    return { sent: true };
  }
);

export const sendReconciliationDrift = inngest.createFunction(
  { id: "notification-reconciliation-drift", retries: 4 },
  { event: "commission/reconciliation_drift" },
  async ({ event }) => {
    const { adminEmail, date, drifts, adminUrl } = event.data;
    await sendEmail({
      to: adminEmail,
      template: "reconciliation-alert",
      subject: `Ledger reconciliation drift detected — ${date}`,
      element: ReconciliationAlert({ date, drifts, adminUrl }),
      idempotencyKey: `reconciliation-drift:${adminEmail}:${date}`,
      relatedTo: { type: "admin", id: adminEmail },
    });
    return { sent: true };
  }
);

export const notificationFunctions = [
  sendWaitlistConfirmed,
  sendVerifyEmail,
  sendWelcome,
  sendLoginAlert,
  sendPasswordResetRequested,
  sendPasswordChanged,
  sendSyndicatorWelcome,
  sendNewReferral,
  sendAmbassadorApproved,
  sendInvestmentCreated,
  sendInvestmentConfirmed,
  sendCommissionAccrued,
  sendAdminInvestmentAlert,
  sendPayoutPaid,
  sendAdminDigest,
  sendAccountLocked,
  sendLaunchInvite,
  sendReconciliationDrift,
];
