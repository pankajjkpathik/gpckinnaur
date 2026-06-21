import type { ReactNode } from "react";
import { UtilityBar } from "./UtilityBar";
import { InstitutionalHeader } from "./InstitutionalHeader";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <UtilityBar />
      <InstitutionalHeader />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="bg-secondary/60 border-b">
      <div className="container mx-auto px-4 py-2 text-xs text-muted-foreground">
        {items.map((it, i) => (
          <span key={i}>
            {i > 0 && <span className="mx-2">→</span>}
            <span className={i === items.length - 1 ? "text-foreground font-medium" : ""}>
              {it.label}
            </span>
          </span>
        ))}
      </div>
    </nav>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-gradient-to-r from-[color:var(--navy)] to-[color:var(--navy-dark)] text-white">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-white/80">{subtitle}</p>}
      </div>
    </div>
  );
}
