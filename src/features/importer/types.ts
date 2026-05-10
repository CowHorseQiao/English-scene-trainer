import type { ImportBatchInput, ImportMaterialInput, ImportVariantInput } from "./schemas";

export type { ImportBatchInput, ImportMaterialInput, ImportVariantInput };

export type ImportActionResult =
  | {
      ok: true;
      message: string;
      importedCount: number;
      batchId: string;
    }
  | {
      ok: false;
      message: string;
      errors?: string[];
    };

export type CategorySelectOption = {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
};
