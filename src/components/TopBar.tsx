import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function TopBar({
  title,
  back = "/",
  right,
}: {
  title: string;
  back?: string;
  right?: ReactNode;
}) {
  return (
    <header className="glass-strong sticky top-0 z-30 flex items-center gap-3 px-4 py-3">
      <Link to={back} aria-label="Back" className="text-muted-foreground">
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <h1 className="flex-1 text-base font-semibold">{title}</h1>
      {right}
    </header>
  );
}
