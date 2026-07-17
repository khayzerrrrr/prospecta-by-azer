import { db, companies } from "@visitflow/db";
import { eq, and } from "drizzle-orm";
import { NotFoundError } from "../utils/errors";

const DEFAULT_COMPANY_SLUG = "default";

// TENANT_BASE_DOMAIN is unset until a custom domain with wildcard DNS is
// configured (see Stage 2 plan). Until then every request — localhost,
// the raw onrender.com/vercel.app URLs — resolves to the single "default"
// company, so today's app keeps working exactly as single-tenant. Once the
// env var is set, subdomains of that base domain resolve to real tenants.
const TENANT_BASE_DOMAIN = process.env.TENANT_BASE_DOMAIN;

export function extractCompanySlug(request: Request): string {
  const override = request.headers.get("x-company-slug");
  if (override) return override;

  const host = (request.headers.get("host") || "").split(":")[0];

  if (TENANT_BASE_DOMAIN && host.endsWith(`.${TENANT_BASE_DOMAIN}`)) {
    const sub = host.slice(0, -(TENANT_BASE_DOMAIN.length + 1));
    if (sub && !sub.includes(".") && !["www", "api"].includes(sub)) return sub;
  }

  return DEFAULT_COMPANY_SLUG;
}

export async function resolveTenant({ request }: { request: Request }) {
  const slug = extractCompanySlug(request);
  const [company] = await db.select().from(companies)
    .where(and(eq(companies.slug, slug), eq(companies.isActive, true)))
    .limit(1);
  if (!company) throw new NotFoundError(`Unknown or inactive company: ${slug}`);
  return { company };
}
