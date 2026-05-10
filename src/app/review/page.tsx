import { getReviewDashboardData } from "@/features/review/queries";
import { ReviewTabs } from "@/features/review/review-tabs";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const data = await getReviewDashboardData();

  return (
    <main className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">复习</h1>
        <p className="text-sm text-muted-foreground">
          今日应复习 <strong>{data.due.length}</strong> 项。
        </p>
      </section>

      <ReviewTabs data={data} />
    </main>
  );
}
