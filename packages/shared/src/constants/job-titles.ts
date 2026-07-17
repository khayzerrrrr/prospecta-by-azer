// Job title presets with a seniority level used for "hierarchy of control"
// data access (see apps/api/src/middleware/rbac.ts's canAccessRecord). Only
// an exact match against one of these presets elevates access — free-typed
// text (even if it looks identical) never does, since level is recomputed
// from this table on every check rather than stored on the user row.
export const JOB_TITLE_LEVELS: Record<string, number> = {
  "Komisaris Utama": 5,
  "Komisaris": 5,
  "Direktur Utama": 4,
  "Direktur": 4,
  "General Manager": 3,
  "Manager": 3,
  "Supervisor": 2,
  "Team Leader": 2,
  "Staff": 1,
};

export const JOB_TITLE_PRESETS = Object.keys(JOB_TITLE_LEVELS);

export function getJobTitleLevel(jobTitle: string | null | undefined): number {
  if (!jobTitle) return 1;
  return JOB_TITLE_LEVELS[jobTitle] ?? 1;
}
