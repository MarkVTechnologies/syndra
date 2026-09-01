export { connectDb, mongoose } from "./client";

export { UserModel, type UserDoc } from "./models/user.model";
export { SessionModel, type SessionDoc } from "./models/session.model";
export {
  VerificationTokenModel,
  type VerificationTokenDoc,
} from "./models/verificationToken.model";
export { WaitlistModel, type WaitlistDoc } from "./models/waitlist.model";
export { EmailLogModel, type EmailLogDoc } from "./models/emailLog.model";
export { AuditLogModel, type AuditLogDoc } from "./models/auditLog.model";
export { AmbassadorModel, type AmbassadorDoc } from "./models/ambassador.model";
export { SyndicatorModel, type SyndicatorDoc } from "./models/syndicator.model";
export { OpportunityModel, type OpportunityDoc } from "./models/opportunity.model";
export { ListingModel, type ListingDoc } from "./models/listing.model";
export { InvestmentModel, type InvestmentDoc } from "./models/investment.model";
export { CommissionModel, type CommissionDoc } from "./models/commission.model";
export { PayoutModel, type PayoutDoc } from "./models/payout.model";
export { EventModel, type EventDoc } from "./models/event.model";
export { SettingsModel, getSettings, setAppLaunched, type SettingsDoc } from "./models/settings.model";
export {
  getResendConfig,
  getCloudinaryConfig,
  getPaystackConfig,
  getTurnstileConfig,
  getIntegrationStatus,
  updateIntegrationSettings,
  invalidateIntegrationCache,
  type ResendConfig,
  type CloudinaryConfig,
  type PaystackConfig,
  type TurnstileConfig,
  type IntegrationStatus,
  type IntegrationFieldStatus,
  type IntegrationUpdateInput,
} from "./integrations";
