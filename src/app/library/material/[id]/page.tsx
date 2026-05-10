import { notFound } from "next/navigation";
import { getCategoriesTree } from "@/features/categories/queries";
import { MaterialDetail } from "@/features/materials/material-detail";
import { getMaterialById } from "@/features/materials/queries";

type MaterialDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MaterialDetailPage({ params }: MaterialDetailPageProps) {
  const { id } = await params;
  const [material, categories] = await Promise.all([
    getMaterialById(id),
    getCategoriesTree(),
  ]);

  if (!material) notFound();

  return <MaterialDetail material={material} categories={categories} />;
}
