export type CategoryFlatNode = {
  id: string;
  parentId: string | null;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  childrenCount: number;
  materialsCount: number;
};

export type CategoryTreeNode = CategoryFlatNode & {
  children: CategoryTreeNode[];
};

export type CategoryActionResult = {
  ok: boolean;
  message: string;
  categoryId?: string;
};

export type CreateCategoryInput = {
  name: string;
  description?: string;
  parentId?: string | null;
};

export type UpdateCategoryInput = {
  name: string;
  description?: string;
};

export type MoveCategoryInput = {
  id: string;
  parentId?: string | null;
};
