export { renderEmail } from "./renderer";
export { default as WaitlistConfirmed, type WaitlistConfirmedProps } from "./templates/waitlist-confirmed";
export { default as VerifyEmail, type VerifyEmailProps } from "./templates/verify-email";
export { default as Welcome, type WelcomeProps } from "./templates/welcome";
export { default as LoginAlert, type LoginAlertProps } from "./templates/login-alert";
export {
  default as PasswordResetRequested,
  type PasswordResetRequestedProps,
} from "./templates/password-reset-requested";
export { default as PasswordChanged, type PasswordChangedProps } from "./templates/password-changed";
export { default as SyndicatorWelcome, type SyndicatorWelcomeProps } from "./templates/syndicator-welcome";
export { default as NewReferral, type NewReferralProps } from "./templates/new-referral";
export { default as AmbassadorApproved, type AmbassadorApprovedProps } from "./templates/ambassador-approved";
export { default as InvestmentCreated, type InvestmentCreatedProps } from "./templates/investment-created";
export { default as InvestmentConfirmed, type InvestmentConfirmedProps } from "./templates/investment-confirmed";
export { default as CommissionAccrued, type CommissionAccruedProps } from "./templates/commission-accrued";
export {
  default as AdminInvestmentAlert,
  type AdminInvestmentAlertProps,
} from "./templates/admin-investment-alert";
export { default as PayoutPaid, type PayoutPaidProps } from "./templates/payout-paid";
export { default as AdminDigest, type AdminDigestProps } from "./templates/admin-digest";
export { default as AccountLocked, type AccountLockedProps } from "./templates/account-locked";
export { default as LaunchInvite, type LaunchInviteProps } from "./templates/launch-invite";
export {
  default as ReconciliationAlert,
  type ReconciliationAlertProps,
  type ReconciliationDriftRow,
} from "./templates/reconciliation-alert";
export { EmailLayout, emailColors } from "./templates/layout";
