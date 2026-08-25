import { AppHeader } from "@/components/app-header";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";

export default function LoadingDeveloper() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <DashboardSkeleton />
    </div>
  );
}
