import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://gpckinnaur.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.8" },
          { path: "/admissions", changefreq: "weekly", priority: "0.9" },
          { path: "/departments/1", changefreq: "monthly", priority: "0.8" },
          { path: "/departments/2", changefreq: "monthly", priority: "0.8" },
          { path: "/staff/faculty", changefreq: "monthly", priority: "0.6" },
          { path: "/staff/admin", changefreq: "monthly", priority: "0.5" },
          { path: "/staff/non-teaching", changefreq: "monthly", priority: "0.5" },
          { path: "/staff/committees", changefreq: "monthly", priority: "0.5" },
          { path: "/alumni", changefreq: "monthly", priority: "0.6" },
          { path: "/alumni/register", changefreq: "yearly", priority: "0.4" },
          { path: "/anti-ragging", changefreq: "yearly", priority: "0.5" },
          { path: "/contact", changefreq: "yearly", priority: "0.6" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
