import type { ImageMetadata } from "astro";
import atrasCover from "@/assets/projects/atras/cover.jpg";

export interface Project {
  /** The last part of the case study URL: /projects/{slug}/ */
  slug: string;
  name: string;
  pageTitle: string;
  /** The line on the home page card. It names the problem, not the product. */
  heading: string;
  cover: ImageMetadata;
  coverAlt: string;
}

export const projects: Project[] = [
  {
    slug: "atras",
    name: "ATRAS",
    pageTitle: "ATRAS | Takafumi Megumi",
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
