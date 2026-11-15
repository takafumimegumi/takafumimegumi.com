// wrangler types writes these names into worker-configuration.d.ts without importing them.
// Without these lines the bindings on `env` silently become `any`.
type SendEmail = import("@cloudflare/workers-types").SendEmail;
type Fetcher = import("@cloudflare/workers-types").Fetcher;
type RateLimit = import("@cloudflare/workers-types").RateLimit;

// The package's importable types do not include this module.
declare module "cloudflare:workers" {
  export const env: Cloudflare.Env;
}
