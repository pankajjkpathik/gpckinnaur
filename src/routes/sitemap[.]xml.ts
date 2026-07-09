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
          { path: "/admissions", changefreq: "weekly", priority: "0.9" },
          { path: "/contact", changefreq: "yearly", priority: "0.6" },
          { path: "/anti-ragging", changefreq: "yearly", priority: "0.5" },
          { path: "/mandatory-disclosure", changefreq: "yearly", priority: "0.5" },
          { path: "/aicte-approval", changefreq: "yearly", priority: "0.5" },
          { path: "/hptsb-affiliation", changefreq: "yearly", priority: "0.5" },
          { path: "/rti", changefreq: "yearly", priority: "0.5" },
          { path: "/grievance", changefreq: "yearly", priority: "0.5" },
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
