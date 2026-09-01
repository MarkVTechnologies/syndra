import { Text, Button } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";

export interface NewReferralProps {
  syndicatorFirstName: string;
  referralCount: number;
  dashboardUrl: string;
}

export default function NewReferral({ syndicatorFirstName, referralCount, dashboardUrl }: NewReferralProps) {
  return (
    <EmailLayout preview={`${syndicatorFirstName} just joined through your microsite`}>
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        New referral
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        <strong style={{ color: emailColors.obsidian900 }}>{syndicatorFirstName}</strong>{" "}
        just signed up through your microsite. You now have{" "}
        <strong style={{ color: emailColors.brass500 }}>{referralCount}</strong> total
        referrals.
      </Text>
      <Button
        href={dashboardUrl}
        style={{
          backgroundColor: emailColors.emerald600,
          color: "#FFFFFF",
          fontSize: 15,
          fontWeight: 600,
          padding: "12px 24px",
          borderRadius: 10,
          textDecoration: "none",
          display: "inline-block",
          marginTop: 8,
        }}
      >
        View your dashboard
      </Button>
    </EmailLayout>
  );
}
