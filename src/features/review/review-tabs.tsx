import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DueReviewSession } from "./due-review-session";
import { ReviewList } from "./review-list";
import type { ReviewDashboardData } from "./types";

type ReviewTabsProps = {
  data: ReviewDashboardData;
};

export function ReviewTabs({ data }: ReviewTabsProps) {
  return (
    <Tabs defaultValue="due" className="space-y-4">
      <TabsList className="grid min-h-11 w-full grid-cols-3 items-center gap-1 rounded-2xl p-1">
        <TabsTrigger value="due" className="h-9 min-w-0 rounded-xl px-3 py-0 text-xs sm:gap-2 sm:text-sm">
          <span className="truncate">今日</span>
          <Badge variant="secondary" className="shrink-0 rounded-full">{data.due.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="upcoming" className="h-9 min-w-0 rounded-xl px-3 py-0 text-xs sm:gap-2 sm:text-sm">
          <span className="truncate">明日</span>
          <Badge variant="secondary" className="shrink-0 rounded-full">{data.upcoming.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="all" className="h-9 min-w-0 rounded-xl px-3 py-0 text-xs sm:gap-2 sm:text-sm">
          <span className="truncate">全部</span>
          <Badge variant="secondary" className="shrink-0 rounded-full">{data.all.length}</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="due" className="space-y-4">
        <DueReviewSession items={data.due} />
      </TabsContent>

      <TabsContent value="upcoming" className="space-y-4">
        <ReviewList
          items={data.upcoming}
          emptyTitle="暂无明天需要复习的收藏项。"
          emptyDescription="完成今日复习后，明天的复习计划会出现在这里。"
          mode="readonly"
        />
      </TabsContent>

      <TabsContent value="all" className="space-y-4">
        <ReviewList
          items={data.all}
          emptyTitle="还没有收藏任何表达。"
          emptyDescription="你可以在语料详情页或训练结果页收藏单词、短语、句型和好句。"
          mode="readonly"
          showFilters
          showActions
        />
      </TabsContent>
    </Tabs>
  );
}
