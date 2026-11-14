export interface Project {
  /** The last part of the case study URL: /projects/{slug}/ */
  slug: string;
  name: string;
  pageTitle: string;
}

export const projects: Project[] = [
  { slug: "atras", name: "ATRAS", pageTitle: "ATRAS | Takafumi Megumi" },
];

export function projectPath(slug: string): string {
  return `/projects/${slug}/`;
}
