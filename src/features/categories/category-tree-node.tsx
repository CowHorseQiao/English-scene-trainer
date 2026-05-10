"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteCategory } from "./actions";
import { CategoryFormDialog } from "./category-form-dialog";
import type { CategoryTreeNode } from "./types";

type CategoryTreeNodeProps = {
  node: CategoryTreeNode;
  depth?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function CategoryTreeNodeView({
  node,
  depth = 0,
  selectedId,
  onSelect,
}: CategoryTreeNodeProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;
  const canDelete = node.childrenCount === 0 && node.materialsCount === 0;

  async function handleDelete() {
    setError(null);

    if (!canDelete) {
      setError("该分类下还有子分类或语料，不能直接删除。");
      return;
    }

    const confirmed = window.confirm(`确定删除分类「${node.name}」吗？`);
    if (!confirmed) return;

    const result = await deleteCategory(node.id);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm",
          isSelected ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          type="button"
          className="flex h-5 w-5 items-center justify-center text-xs"
          onClick={(event) => {
            event.stopPropagation();
            if (hasChildren) setExpanded((value) => !value);
          }}
          aria-label={expanded ? "折叠分类" : "展开分类"}
        >
          {hasChildren ? (expanded ? "▾" : "▸") : "·"}
        </button>

        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left"
          onClick={() => onSelect(node.id)}
          title={node.name}
        >
          {node.name}
        </button>

        <div className="hidden items-center gap-1 group-hover:flex">
          <CategoryFormDialog
            mode="create"
            parentId={node.id}
            trigger={
              <Button size="sm" variant="ghost" className="h-7 px-2">
                子类
              </Button>
            }
          />

          <CategoryFormDialog
            mode="edit"
            category={node}
            trigger={
              <Button size="sm" variant="ghost" className="h-7 px-2">
                改名
              </Button>
            }
          />

          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={!canDelete}
            title={canDelete ? "删除分类" : "非空分类不能删除"}
          >
            删除
          </Button>
        </div>
      </div>

      {error ? (
        <p className="px-2 py-1 text-xs text-destructive" style={{ marginLeft: `${depth * 16 + 28}px` }}>
          {error}
        </p>
      ) : null}

      {expanded && hasChildren ? (
        <div>
          {node.children.map((child) => (
            <CategoryTreeNodeView
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
