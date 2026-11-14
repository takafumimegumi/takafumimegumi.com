import type { ImageMetadata } from "astro";
import atrasCover from "@/assets/projects/atras/cover.jpg";

export interface Project {
  /** The last part of the case study URL: /projects/{slug}/ */
  slug: string;
  name: string;
  pageTitle: string;
  description: string;
  /** A 1200 x 630 image in public/, shown when the case study is shared. */
  shareImage: string;
  /** The line on the home page card. It names the problem, not the product. */
  heading: string;
  cover: ImageMetadata;
  coverAlt: string;
}

export const projects: Project[] = [
  {
    slug: "atras",
    name: "ATRAS",
    pageTitle: "ATRAS: a rent map for Vancouver | Takafumi Megumi",
    description:
      "Case study: a map that shows which Vancouver neighbourhoods fit your budget. Designed and built solo in two months.",
    shareImage: "/og-atras.jpg",
    heading:
      "Helping newcomers to Vancouver find neighbourhoods they can afford",
    cover: atrasCover,
    coverAlt:
      "ATRAS, the Average Rent Map in Vancouver, shown on phone screens",
  },
];

export function projectPath(slug: string): string {
  return `/projects/${slug}/`;
}
