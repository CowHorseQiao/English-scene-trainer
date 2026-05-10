import { FavoriteCard } from "./favorite-card";
import type { FavoriteInfo } from "./types";

type FavoriteListProps = {
  favorites: FavoriteInfo[];
};

export function FavoriteList({ favorites }: FavoriteListProps) {
  if (favorites.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <h2 className="text-lg font-semibold">暂无收藏</h2>
        <p className="mt-2 break-words text-sm text-muted-foreground">
          你可以在语料详情页或训练结果页点击“收藏表达”，先收藏单词、短语、句型或好句。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {favorites.map((favorite) => (
        <FavoriteCard key={favorite.id} favorite={favorite} />
      ))}
    </div>
  );
}
