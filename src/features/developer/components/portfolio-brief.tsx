import { ExternalContributions } from "@/features/developer/components/external-contributions";
import { OpenSourceInterests } from "@/features/developer/components/open-source-interests";
import { RepositoryHealthSection } from "@/features/developer/components/repository-health-section";
import { WorkProfile } from "@/features/developer/components/work-profile";
import type { DeveloperData } from "@/features/developer/types";

export function PortfolioBrief({ data }: { data: DeveloperData }) {
  return (
    <div className="space-y-10 py-8">
      <WorkProfile data={data} />
      <ExternalContributions data={data} />
      {data.repositories.length ? (
        <RepositoryHealthSection data={data} />
      ) : null}
      <OpenSourceInterests data={data} />
    </div>
  );
}
