import { OpportunityBuilder } from "@/components/admin/opportunity-builder";
import { PageHeader } from "@/components/layout/page-header";

export default function NewOpportunityPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New opportunity" description="Fill in each step. You can save as a draft and come back." />
      <OpportunityBuilder />
    </div>
  );
}
