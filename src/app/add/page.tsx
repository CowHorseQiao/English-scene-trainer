import { db } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCategoriesTree } from "@/features/categories/queries";
import { GenerateForm } from "@/features/ai/generate-form";
import { ImportJsonForm } from "@/features/importer/import-json-form";
import { DailyMaterialsTab } from "@/features/daily-materials/daily-materials-tab";
import type { CategorySelectOption } from "@/features/importer/types";

async function getFlatCategoryOptions(): Promise<CategorySelectOption[]> {
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, parentId: true, name: true },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  function buildPath(categoryId: string) {
    const names: string[] = [];
    const visited = new Set<string>();
    let current = categoryMap.get(categoryId);

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      names.unshift(current.name);
      current = current.parentId ? categoryMap.get(current.parentId) : undefined;
    }

    return names.join(" / ");
  }

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    parentId: category.parentId,
    path: buildPath(category.id),
  }));
}

export default async function AddPage() {
  const [treeCategories, flatCategories] = await Promise.all([
    getCategoriesTree(),
    getFlatCategoryOptions(),
  ]);

  const noCategories = treeCategories.length === 0;

  return (
    <main className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold">添加语料</h1>
        <p className="mt-2 text-muted-foreground">
          AI 生成或粘贴 JSON 导入。
        </p>
      </section>

      <Tabs defaultValue="generate">
        <TabsList className="mb-4 flex h-auto min-h-10 flex-wrap items-center gap-1">
          <TabsTrigger value="generate">AI 生成</TabsTrigger>
          <TabsTrigger value="import">JSON 导入</TabsTrigger>
          <TabsTrigger value="daily">每日语料</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          {noCategories ? (
            <div className="rounded-xl border p-6 text-sm text-muted-foreground">
              还没有分类。请先创建至少一个分类，然后添加语料。
            </div>
          ) : (
            <GenerateForm categories={treeCategories} />
          )}
        </TabsContent>

        <TabsContent value="import">
          {noCategories ? (
            <div className="rounded-xl border p-6 text-sm text-muted-foreground">
              还没有分类。请先创建至少一个分类，然后导入语料。
            </div>
          ) : (
            <ImportJsonForm categories={flatCategories} />
          )}
        </TabsContent>

        <TabsContent value="daily">
          <DailyMaterialsTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}
