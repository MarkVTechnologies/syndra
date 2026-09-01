import { redirect } from "next/navigation";
import { auth } from "@/auth";
import * as ambassador from "@san/service-ambassador";
import { MicrositeLinkCard } from "@/components/ambassador/microsite-link-card";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { MicrositeEditorForm } from "./editor-form";
import { SlugChangeForm } from "./slug-change-form";

export default async function MicrositeSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await ambassador.getByUserId(session.user.id);
  if (!profile.ok) redirect("/dashboard/onboarding");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Your microsite" description="This is what investors see when they visit your page." />

      <MicrositeLinkCard slug={profile.data.slug} />

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        <MicrositeEditorForm
          headline={profile.data.headline}
          bio={profile.data.bio}
          whatsapp={profile.data.whatsapp?.number ?? ""}
        />
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">Page name</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Changes are limited to once every 30 days. Your old link keeps working for 90 days.
        </p>
        <SlugChangeForm currentSlug={profile.data.slug} />
      </Card>
    </div>
  );
}
