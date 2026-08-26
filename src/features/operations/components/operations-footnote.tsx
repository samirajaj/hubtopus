import { CircleAlert, ListChecks } from "lucide-react";

import { isExpectedNotificationLimitation } from "@/features/operations/components/coverage-notice";
import type { RepositoryOperationsData } from "@/features/operations/types";

export function OperationsFootnote({
  data,
}: {
  data: RepositoryOperationsData;
}) {
  return (
    <div className="text-muted-foreground mt-8 space-y-2 border-t pt-5 text-xs leading-5">
      <p className="flex items-start gap-2">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        High priority means a requested review, latest workflow failure, pull
        request conflict, failed check, requested changes, security or review
        notification, or an assigned issue with no update for 30 days.
      </p>
      <p className="flex items-start gap-2">
        <ListChecks className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        This live snapshot uses the current encrypted cookie session and does
        not persist operation history. Workflow checks cover up to{" "}
        {data.workflowInspectionLimit} recently updated maintainable source
        repositories, and pull request intelligence covers up to{" "}
        {data.pullRequestInspectionLimit} priority pull requests per request.
      </p>
      {isExpectedNotificationLimitation(data) ? (
        <p>
          Personal GitHub notifications are not available through GitHub App
          sessions. Other operation sources are unaffected.
        </p>
      ) : null}
    </div>
  );
}
