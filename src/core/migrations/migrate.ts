import type { ProjectEnvelope, ResumeData } from '../models/types';
import { SCHEMA_VERSION } from '../models/types';

// ---------------------------------------------------------------------------
// Forward migrations for saved projects. Each step upgrades by exactly one
// version. Unknown fields are preserved (never silently dropped). A project is
// only opened after it has been migrated and validated.
// ---------------------------------------------------------------------------

export interface MigrationResult {
  project: ProjectEnvelope;
  migrated: boolean;
  warnings: string[];
}

function migrateResumeV1toV2(data: Record<string, unknown>): ResumeData {
  // v2 introduced version snapshots.
  return {
    ...(data as unknown as ResumeData),
    snapshots: Array.isArray((data as { snapshots?: unknown }).snapshots)
      ? ((data as { snapshots: ResumeData['snapshots'] }).snapshots)
      : [],
  };
}

export function migrateProject(input: ProjectEnvelope): MigrationResult {
  const warnings: string[] = [];
  let project = { ...input };
  let version = typeof project.schemaVersion === 'number' ? project.schemaVersion : 1;

  if (version > SCHEMA_VERSION) {
    warnings.push(
      `Project "${project.title}" was created with a newer version (schema ${version}). It will be opened read-with-caution; some fields may be ignored.`,
    );
    return { project, migrated: false, warnings };
  }

  const before = version;

  if (project.type === 'resume') {
    if (version < 2) {
      project = { ...project, data: migrateResumeV1toV2(project.data as Record<string, unknown>) };
      version = 2;
    }
  }

  project = { ...project, schemaVersion: SCHEMA_VERSION };
  return { project, migrated: version !== before, warnings };
}
