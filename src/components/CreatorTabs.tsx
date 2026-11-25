"use client";

import { useState, type ReactNode } from "react";

/* The in-page tab bar on a creator page.

   Each panel is rendered on the server and handed in as a prop, so
   switching tabs is instant — no navigation, no second load. The bar
   sticks under the site header, and the join button travels with it so
   the way to support is always one tap away however far you scroll.

   Only the selected panel is mounted: the others are already-rendered
   markup sitting in memory, not work being redone. */

export type TabKey = string;

export function CreatorTabs({
  tabs,
  action,
}: {
  tabs: { key: TabKey; label: string; count?: number; panel: ReactNode }[];
  action?: ReactNode;
}) {
  const available = tabs.filter((t) => t.panel);
  const [active, setActive] = useState<TabKey>(available[0]?.key ?? "");
  const current = available.find((t) => t.key === active) ?? available[0];

  return (
    <>
      <div className="sticky top-[57px] z-30 -mx-5 border-b border-foreground/[0.07] bg-background/98 px-5 sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className="scroll-x flex flex-1 gap-1"
            role="tablist"
            aria-label="Creator sections"
          >
            {available.map((tab) => {
              const on = tab.key === current?.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(tab.key)}
                  className={`press relative shrink-0 px-3 py-4 text-sm font-bold whitespace-nowrap ${
                    on ? "text-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {typeof tab.count === "number" && tab.count > 0 ? (
                    <span className="ml-1.5 text-xs font-bold text-muted">
                      {tab.count}
                    </span>
                  ) : null}
                  {on ? (
                    <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-brand" />
                  ) : null}
                </button>
              );
            })}
          </div>
          {action ? <div className="shrink-0 py-2">{action}</div> : null}
        </div>
      </div>

      <div className="pt-8">{current?.panel}</div>
    </>
  );
}
