import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://pingcompany.github.io",
  base: "/Platform/",
  integrations: [
    starlight({
      title: "PING Docs",
      customCss: ["./src/styles/custom.css"],
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" },
        },
        {
          label: "Product Features",
          autogenerate: { directory: "features" },
        },
        {
          label: "Architecture",
          autogenerate: { directory: "architecture" },
        },
        {
          label: "API Reference",
          autogenerate: { directory: "api" },
        },
        {
          label: "Integrations",
          autogenerate: { directory: "integrations" },
        },
        {
          label: "Developer Guide",
          autogenerate: { directory: "developer-guide" },
        },
      ],
    }),
  ],
});
