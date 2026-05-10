import type { CategoryFlatNode, CategoryTreeNode } from "./types";

export function buildCategoryTree(items: CategoryFlatNode[]): CategoryTreeNode[] {
  const nodeMap = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  for (const item of items) {
    nodeMap.set(item.id, {
      ...item,
      children: [],
    });
  }

  for (const item of items) {
    const node = nodeMap.get(item.id);
    if (!node) continue;

    if (item.parentId && nodeMap.has(item.parentId)) {
      nodeMap.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.createdAt.localeCompare(b.createdAt);
    });

    for (const node of nodes) {
      sortNodes(node.children);
    }
  };

  sortNodes(roots);
  return roots;
}

export function flattenCategoryTree(tree: CategoryTreeNode[]): CategoryFlatNode[] {
  const result: CategoryFlatNode[] = [];

  const walk = (nodes: CategoryTreeNode[]) => {
    for (const node of nodes) {
      const { children, ...flatNode } = node;
      result.push(flatNode);
      walk(children);
    }
  };

  walk(tree);
  return result;
}

export function findCategoryById(
  tree: CategoryTreeNode[],
  id: string | null | undefined,
): CategoryTreeNode | null {
  if (!id) return null;

  for (const node of tree) {
    if (node.id === id) return node;

    const found = findCategoryById(node.children, id);
    if (found) return found;
  }

  return null;
}

export function getFirstCategoryId(tree: CategoryTreeNode[]): string | null {
  return tree[0]?.id ?? null;
}

export function countDescendants(node: CategoryTreeNode): number {
  return node.children.reduce((total, child) => {
    return total + 1 + countDescendants(child);
  }, 0);
}

export function getCategoryPath(
  tree: CategoryTreeNode[],
  id: string | null | undefined,
): CategoryTreeNode[] {
  if (!id) return [];

  const walk = (
    nodes: CategoryTreeNode[],
    targetId: string,
    path: CategoryTreeNode[],
  ): CategoryTreeNode[] | null => {
    for (const node of nodes) {
      const nextPath = [...path, node];
      if (node.id === targetId) return nextPath;

      const childPath = walk(node.children, targetId, nextPath);
      if (childPath) return childPath;
    }

    return null;
  };

  return walk(tree, id, []) ?? [];
}

export function isCategoryDescendant(
  tree: CategoryTreeNode[],
  ancestorId: string,
  possibleDescendantId: string,
): boolean {
  const ancestor = findCategoryById(tree, ancestorId);
  if (!ancestor) return false;

  return Boolean(findCategoryById(ancestor.children, possibleDescendantId));
}
