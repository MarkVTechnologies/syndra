import { redirect } from "next/navigation";
import { auth } from "@/auth";
import * as ambassador from "@san/service-ambassador";
import * as catalog from "@san/service-catalog";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await ambassador.getByUserId(session.user.id);
  if (!profile.ok) redirect("/login");

  const opportunitiesResult = await catalog.listPublished();
  const opportunities = opportunitiesResult.ok ? opportunitiesResult.data : [];

  return (
    <div className="relative flex min-h-[75dvh] items-center justify-center overflow-hidden rounded-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(600px circle at 15% 15%, rgba(192,88,0,0.1), transparent 60%), radial-gradient(520px circle at 85% 85%, rgba(113,54,0,0.08), transparent 60%)",
        }}
      />
      <div aria-hidden className="texture-ledger-contained-dark pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-lg py-10">
        <h1 className="text-center font-display text-2xl font-bold text-foreground">Let&apos;s get you set up</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Four quick steps, under 90 seconds.</p>
        <OnboardingWizard
          slug={profile.data.slug}
          whatsapp={profile.data.whatsapp?.number ?? ""}
          opportunities={opportunities.map((o) => ({
            id: o._id.toString(),
            title: o.title,
            summary: o.summary,
            city: o.location?.city ?? "",
            state: o.location?.state ?? "",
            coverImage: o.media[0]?.url ?? null,
          }))}
        />
      </div>
    </div>
  );
}
