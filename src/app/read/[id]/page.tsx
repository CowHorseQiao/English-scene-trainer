import { notFound } from "next/navigation";
import { MaterialReader } from "@/features/materials/material-reader";
import { getMaterialById } from "@/features/materials/queries";

type ReadPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReadPage({ params }: ReadPageProps) {
  const { id } = await params;
  const material = await getMaterialById(id);

  if (!material) {
    notFound();
  }

  return <MaterialReader material={material} />;
}
