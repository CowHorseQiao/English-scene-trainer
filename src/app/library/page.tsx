import { CategoryTree } from "@/features/categories/category-tree";
import { getCategoriesTree } from "@/features/categories/queries";

type LibraryPageProps = {
  searchParams: Promise<{ categoryId?: string }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { categoryId } = await searchParams;
  const categories = await getCategoriesTree();

  return (
    <main className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold">场景库</h1>
        <p className="mt-2 text-muted-foreground">
          按场景分类管理语料。
        </p>
      </section>

      <CategoryTree categories={categories} initialCategoryId={categoryId} />
    </main>
  );
}
