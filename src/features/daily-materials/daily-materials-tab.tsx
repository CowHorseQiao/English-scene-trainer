import { DailyMaterialsBatchCard } from "./daily-materials-batch-card";
import { DailyMaterialsDraftList } from "./daily-materials-draft-list";
import { DailyMaterialsSettingsForm } from "./daily-materials-settings-form";
import { getDailyMaterialsDashboard } from "./queries";

export async function DailyMaterialsTab() {
  const dashboard = await getDailyMaterialsDashboard();

  return (
    <div className="space-y-4">
      <DailyMaterialsSettingsForm
        setting={dashboard.setting}
        pendingDraftCount={dashboard.pendingDraftCount}
      />
      <DailyMaterialsBatchCard
        pendingDraftCount={dashboard.pendingDraftCount}
        latestBatch={dashboard.latestBatch}
      />
      <DailyMaterialsDraftList drafts={dashboard.pendingDrafts} />
    </div>
  );
}
