import { MaterialFeed } from "@/features/materials/material-feed";
import { getMaterialFeed, getFlatCategoriesForFilter } from "@/features/materials/home-queries";

type HomePageProps = {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    contentType?: string;
    categoryId?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  const sort = params.sort === "updatedAt" ? "updatedAt" : "createdAt";
  const contentType = params.contentType || "";
  const categoryId = params.categoryId || "";
  const page = Math.max(1, Number(params.page) || 1);

  const [data, categories] = await Promise.all([
    getMaterialFeed({ page, sort, contentType, categoryId }),
    getFlatCategoriesForFilter(),
  ]);

  return (
    <main className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold">语料流</h1>
        <p className="mt-1 text-muted-foreground">
          所有语料按时间排序。
        </p>
      </section>

      <MaterialFeed
        data={data}
        categories={categories}
        currentSort={sort}
        currentContentType={contentType}
        currentCategoryId={categoryId}
      />
    </main>
  );
}
