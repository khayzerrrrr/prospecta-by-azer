import { Elysia } from "elysia";
import { db, pipelineStages, deals } from "@visitflow/db";
import { eq } from "drizzle-orm";
import { getAuthUser } from "../middleware/auth";

export const pipelineRoutes = new Elysia({ prefix: "/pipeline" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new Error("Unauthorized");
    return { user };
  })
  .get("/stages", async () => {
    const stages = db.select().from(pipelineStages).all();
    return { success: true, data: stages };
  })
  .get("/deals", async ({ query }) => {
    const stageId = (query as any).stageId;
    let q = db.select().from(deals).$dynamic();
    if (stageId) q = q.where(eq(deals.stageId, stageId));
    return { success: true, data: q.all() };
  })
  .post("/deals", async ({ body, user }) => {
    const id = crypto.randomUUID();
    db.insert(deals).values({ id, ...(body as any), userId: user.id }).run();
    return { success: true, data: db.select().from(deals).where(eq(deals.id, id)).get() };
  })
  .patch("/deals/:id", async ({ params, body }) => {
    db.update(deals).set({ ...(body as any), updatedAt: new Date() }).where(eq(deals.id, params.id)).run();
    return { success: true, data: db.select().from(deals).where(eq(deals.id, params.id)).get() };
  });
