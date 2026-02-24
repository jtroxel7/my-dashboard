"use client";

import { useState } from "react";

interface DashboardCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
}

export default function DashboardCard({
  title,
  icon,
  children,
  className = "",
  collapsible = true,
}: DashboardCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={`card p-5 ${collapsible ? "cursor-pointer" : ""} ${className}`}
      onPointerUp={collapsible ? () => setIsOpen((prev) => !prev) : undefined}
      style={collapsible ? { touchAction: "manipulation" } : undefined}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {icon && (
            <span className="flex shrink-0 [&>svg]:h-5 [&>svg]:w-auto">
              {icon}
            </span>
          )}
          {title ? (
            <h2 className="text-sm font-semibold tracking-wide text-foreground/60">
              {title}
            </h2>
          ) : null}
        </div>
        {collapsible ? (
          <button
            type="button"
            onPointerUp={(event) => {
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Collapse card" : "Expand card"}
            className="rounded-md p-1 text-foreground/60 transition hover:bg-foreground/10 hover:text-foreground"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
              aria-hidden="true"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
      </div>
      {isOpen ? <div>{children}</div> : null}
    </div>
  );
}
