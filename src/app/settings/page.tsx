export default function SettingsPage() {
  return (
    <main className="space-y-4">
      <section>
        <h1 className="text-2xl font-semibold">设置</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          当前版本主要通过环境变量配置 AI、朗读和数据库。
        </p>
      </section>

      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        可视化设置页暂未开放。部署前请检查 `.env` 和 `.env.example` 中的配置项。
      </div>
    </main>
  );
}
