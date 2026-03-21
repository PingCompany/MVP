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
        { label: "Home", link: "/" },
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
          label: "Self-Hosting",
          autogenerate: { directory: "self-hosting" },
        },
        {
          label: "Contributing",
          autogenerate: { directory: "contributing" },
        },
      ],
    }),
  ],
});
