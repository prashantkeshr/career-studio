import type { BackupPackage, CareerProfile, ProjectEnvelope } from '../../core/models/types';
import { SCHEMA_VERSION } from '../../core/models/types';

// JSON project backup / restore. Pure data in, pure data out — no server.

export function buildBackup(
  profile: CareerProfile | null,
  projects: ProjectEnvelope[],
): BackupPackage {
  return {
    kind: 'career-studio-backup',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: Date.now(),
    profile,
    projects,
  };
}

export interface ParseResult {
  ok: boolean;
  backup?: BackupPackage;
  error?: string;
  warnings: string[];
}

/** Validate an uploaded backup file before anything is written to storage. */
export function parseBackup(text: string): ParseResult {
  const warnings: string[] = [];
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.', warnings };
  }
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'The backup file has an unexpected structure.', warnings };
  }
  const obj = raw as Record<string, unknown>;
  if (obj.kind !== 'career-studio-backup') {
    return { ok: false, error: 'This does not look like a Career Studio backup.', warnings };
  }
  const version = typeof obj.schemaVersion === 'number' ? obj.schemaVersion : 0;
  if (version > SCHEMA_VERSION) {
    warnings.push(
      `This backup was made with a newer version (schema ${version}). Some data may not import correctly.`,
    );
  } else if (version < SCHEMA_VERSION) {
    warnings.push(`This backup uses an older schema (${version}); it will be migrated on import.`);
  }
  const projects = Array.isArray(obj.projects) ? (obj.projects as ProjectEnvelope[]) : [];
  if (!Array.isArray(obj.projects)) warnings.push('No valid project list found; importing an empty set.');

  const backup: BackupPackage = {
    kind: 'career-studio-backup',
    schemaVersion: version,
    exportedAt: typeof obj.exportedAt === 'number' ? obj.exportedAt : Date.now(),
    profile: (obj.profile as CareerProfile) ?? null,
    projects,
  };
  return { ok: true, backup, warnings };
}

export function download(filename: string, text: string, mime = 'application/json'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFilename(base: string, ext: string): string {
  const cleaned = base.trim().replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'career-studio';
  return `${cleaned}.${ext}`;
}
