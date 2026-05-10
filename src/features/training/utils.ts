import type {
  ClozeQuestion,
  TrainingCategoryOption,
  TrainingMode,
} from "./types";

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "of",
  "to",
  "in",
  "on",
  "for",
  "and",
  "or",
  "but",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "it",
  "this",
  "that",
  "with",
  "as",
  "by",
  "from",
]);

type CategoryRow = {
  id: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  createdAt: Date;
};

export function buildCategoryOptions(
  categories: CategoryRow[],
): TrainingCategoryOption[] {
  const childrenMap = new Map<string | null, CategoryRow[]>();

  for (const category of categories) {
    const key = category.parentId ?? null;
    const list = childrenMap.get(key) ?? [];
    list.push(category);
    childrenMap.set(key, list);
  }

  for (const list of childrenMap.values()) {
    list.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  const result: TrainingCategoryOption[] = [];

  function walk(parentId: string | null, parentPath: string, depth: number) {
    const children = childrenMap.get(parentId) ?? [];

    for (const child of children) {
      const path = parentPath ? `${parentPath} / ${child.name}` : child.name;
      result.push({
        id: child.id,
        name: child.name,
        parentId: child.parentId,
        path,
        depth,
      });
      walk(child.id, path, depth + 1);
    }
  }

  walk(null, "", 0);
  return result;
}

export function collectDescendantCategoryIds(
  categories: { id: string; parentId: string | null }[],
  rootId: string,
): string[] {
  const childrenMap = new Map<string | null, string[]>();

  for (const category of categories) {
    const key = category.parentId ?? null;
    const list = childrenMap.get(key) ?? [];
    list.push(category.id);
    childrenMap.set(key, list);
  }

  const result = [rootId];
  const stack = [rootId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) continue;

    const children = childrenMap.get(currentId) ?? [];
    for (const childId of children) {
      result.push(childId);
      stack.push(childId);
    }
  }

  return result;
}

export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function splitToken(token: string) {
  const match = token.match(/^([^A-Za-z]*)([A-Za-z][A-Za-z'-]*)([^A-Za-z]*)$/);
  if (!match) return null;

  return {
    prefix: match[1] ?? "",
    core: match[2] ?? "",
    suffix: match[3] ?? "",
  };
}

export function createClozeQuestion(sentence: string): ClozeQuestion {
  const tokens = sentence.split(/(\s+)/);
  const wordTokenIndexes = tokens
    .map((token, index) => ({ token, index, parsed: splitToken(token) }))
    .filter((item) => {
      if (!item.parsed) return false;
      const core = item.parsed.core.toLowerCase();
      return core.length >= 4 && !STOP_WORDS.has(core);
    });

  const totalWordCount = tokens.filter((token) => splitToken(token)).length;
  const maxByRatio = Math.max(1, Math.floor(totalWordCount * 0.3));
  const maxBlankCount = Math.min(3, maxByRatio, wordTokenIndexes.length);
  const blankCount = maxBlankCount > 0 ? Math.floor(Math.random() * maxBlankCount) + 1 : 0;

  const selected = shuffleArray(wordTokenIndexes).slice(0, blankCount);
  const selectedIndexes = new Set(selected.map((item) => item.index));
  const blanks = selected
    .map((item) => ({
      tokenIndex: item.index,
      answer: item.parsed?.core ?? item.token,
    }))
    .sort((a, b) => a.tokenIndex - b.tokenIndex);

  const blankNumberMap = new Map<number, number>();
  blanks.forEach((blank, index) => {
    blankNumberMap.set(blank.tokenIndex, index + 1);
  });

  const sentenceWithBlanks = tokens
    .map((token, index) => {
      if (!selectedIndexes.has(index)) return token;
      const parsed = splitToken(token);
      const blankNumber = blankNumberMap.get(index) ?? "";
      return `${parsed?.prefix ?? ""}____${blankNumber}____${parsed?.suffix ?? ""}`;
    })
    .join("");

  return {
    sentenceWithBlanks: sentenceWithBlanks || sentence,
    blanks,
  };
}

export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:"'()\[\]{}]/g, "")
    .replace(/\s+/g, " ");
}

export function isClozeAnswerCorrect(expected: string, actual: string): boolean {
  return normalizeAnswer(expected) === normalizeAnswer(actual);
}

export function getTrainingModeLabel(mode: TrainingMode) {
  return mode === "cloze" ? "挖空补全" : "中译英";
}
