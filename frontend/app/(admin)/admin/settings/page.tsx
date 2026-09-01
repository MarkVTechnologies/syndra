import { IntegrationsSettingsForm } from "@/components/admin/integrations-settings-form";
import { PageHeader } from "@/components/layout/page-header";
import { getIntegrationStatusAction } from "@/app/actions/settings";

export default async function AdminSettingsPage() {
  const result = await getIntegrationStatusAction();

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Settings" />
        <p className="text-sm text-danger">{result.error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Runtime credentials for third-party integrations." />
      <IntegrationsSettingsForm status={result.data} />
    </div>
  );
}
