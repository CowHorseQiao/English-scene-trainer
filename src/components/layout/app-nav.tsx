import Link from "next/link";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/library", label: "场景库" },
  { href: "/import", label: "导入" },
  { href: "/train", label: "训练" },
  { href: "/review", label: "复习" },
  { href: "/settings", label: "设置" },
];

export function AppNav() {
  return (
    <header className="border-b max-sm:hidden">
      <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 font-semibold">
          English Scene Trainer
        </Link>

        <div className="flex gap-3 overflow-x-auto text-sm text-muted-foreground">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 whitespace-nowrap hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}