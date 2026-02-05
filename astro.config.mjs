import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import AutoImport from "astro-auto-import";
import { defineConfig, fontProviders } from "astro/config";
import remarkCollapse from "remark-collapse";
import remarkToc from "remark-toc";
import sharp from "sharp";
import config from "./src/config/config.json";

let highlighter;
async function getHighlighter() {
  if (!highlighter) {
    const { getHighlighter } = await import("shiki");
    highlighter = await getHighlighter({ theme: "one-dark-pro" });
  }
  return highlighter;
}

// https://astro.build/config
export default defineConfig({
  site: config.site.base_url ? config.site.base_url : "http://zuu.my.id",
  base: config.site.base_path ? config.site.base_path : "/",
  trailingSlash: config.site.trailing_slash ? "always" : "never",

  image: { service: sharp() },
  vite: { plugins: [tailwindcss()] },

  experimental: {
    fonts: [
      {
        name: "Raleway",
        cssVariable: "--font-primary",
        provider: fontProviders.google(),
        weights: [400],
        fallbacks: ["sans-serif"],
      },
      {
        name: "Merriweather Sans",
        cssVariable: "--font-secondary",
        provider: fontProviders.google(),
        weights: [400, 700],
        fallbacks: ["sans-serif"],
      },
    ],
  },

  integrations: [
    react(),
    sitemap(),
    AutoImport({
      imports: [
        "@/shortcodes/Button",
        "@/shortcodes/Accordion",
        "@/shortcodes/Notice",
        "@/shortcodes/Video",
        "@/shortcodes/Youtube",
        "@/shortcodes/Tabs",
        "@/shortcodes/Tab",
      ],
    }),
    mdx(),
  ],
  markdown: {
    remarkPlugins: [
      remarkToc,
      [
        remarkCollapse,
        {
          test: "Table of contents",
        },
      ],
    ],
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
    highlighter: getHighlighter,
    extendDefaultPlugins: true,
  },
});
