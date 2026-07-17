// One-off script — run manually (`bun run src/scripts/backfill-industry.ts`
// from packages/db), NOT part of the automatic migration path. For each
// existing company, backfills the new `companies.industry` column from
// whatever `pack_settings` industry-pack rows happened to exist under the
// old marketplace-toggle system (removed — see Stage "1d" of the plan).
// Review the printed output before considering this final.
import { db } from "../index";
import * as s from "../schema/index";
import { eq, and } from "drizzle-orm";

async function backfill() {
  const allCompanies = await db.select().from(s.companies);
  console.log(`Checking ${allCompanies.length} companies...`);

  for (const company of allCompanies) {
    if (company.industry) {
      console.log(`- ${company.name}: already has industry "${company.industry}", skipping`);
      continue;
    }

    const enabledIndustryPacks = await db.select().from(s.packSettings)
      .where(and(
        eq(s.packSettings.companyId, company.id),
        eq(s.packSettings.packType, "industry"),
        eq(s.packSettings.enabled, true),
      ));

    if (enabledIndustryPacks.length === 0) {
      console.log(`- ${company.name}: no enabled industry pack found, leaving industry = null`);
      continue;
    }

    // If more than one was somehow enabled (the old marketplace's .find()
    // bug meant only one was ever effectively used client-side, but the
    // data model allowed multiple), pick whichever was activated first.
    const chosen = enabledIndustryPacks.sort((a, b) => {
      const aTime = a.activatedAt ? new Date(a.activatedAt).getTime() : 0;
      const bTime = b.activatedAt ? new Date(b.activatedAt).getTime() : 0;
      return aTime - bTime;
    })[0]!;

    await db.update(s.companies).set({ industry: chosen.packId, updatedAt: new Date() }).where(eq(s.companies.id, company.id));
    console.log(`- ${company.name}: backfilled industry = "${chosen.packId}"${enabledIndustryPacks.length > 1 ? ` (had ${enabledIndustryPacks.length} enabled, picked earliest)` : ""}`);
  }

  console.log("Backfill complete.");
}

if (import.meta.main) {
  backfill().catch(console.error).finally(() => process.exit(0));
}

export { backfill };
