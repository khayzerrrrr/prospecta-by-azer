import type { UserSession } from "@visitflow/shared";
import { canAccessRecord, type OwnedRecord } from "./rbac";
import { NotFoundError, ForbiddenError } from "../utils/errors";

export function ownershipGuard<T extends OwnedRecord>(
  loader: (id: string) => T | undefined | null | Promise<T | undefined | null>,
) {
  return async ({ params, user }: { params: { id: string }; user: UserSession }) => {
    const record = await loader(params.id);
    if (!record) throw new NotFoundError();
    if (!canAccessRecord(user, record)) throw new ForbiddenError("Not your record");
  };
}
