import type { ReactNode } from "react";
import type { AppRoute } from "../../app/routes";

interface AppShellProps {
  route: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  children: ReactNode;
}

export function AppShell({ route, onRouteChange, children }: AppShellProps) {
  const navItems: Array<[AppRoute, string]> = [
    ["dashboard", "대시보드"],
    ["jobComparison", "이직 비교"],
    ["resignation", "퇴사일 계산"],
  ];

  return (
    <div className="min-h-screen bg-paper">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-sea"
        href="#main-content"
      >
        본문으로 이동
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">
              Career Decision Calculator
            </p>
            <h1 className="text-2xl font-bold text-ink">이직 손익계산기</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map(([itemRoute, label]) => (
              <button
                key={itemRoute}
                className={`h-9 rounded-md px-3 text-sm font-semibold ${
                  route === itemRoute ? "bg-sea text-white" : "bg-slate-100 text-slate-700"
                }`}
                type="button"
                aria-current={route === itemRoute ? "page" : undefined}
                onClick={() => onRouteChange(itemRoute)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
