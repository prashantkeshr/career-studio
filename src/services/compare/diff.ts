import type { ResumeContent } from '../../core/models/types';

// Content-level comparison of two resume states (e.g. current vs a saved
// snapshot). Operates on the real structured data, matching list entries by
// their stable ids, so reordering alone is not reported as add/remove.

export interface FieldChange {
  label: string;
  from: string;
  to: string;
}

export interface ListChange {
  section: string;
  added: string[];
  removed: string[];
  modified: string[];
}

export interface ContentDiff {
  fields: FieldChange[];
  lists: ListChange[];
  changed: boolean;
}

interface HasId {
  id: string;
}

function diffList<T extends HasId>(
  section: string,
  from: T[],
  to: T[],
  label: (x: T) => string,
  serialize: (x: T) => string,
): ListChange | null {
  const fromMap = new Map(from.map((x) => [x.id, x]));
  const toMap = new Map(to.map((x) => [x.id, x]));
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];
  for (const [id, x] of toMap) if (!fromMap.has(id)) added.push(label(x));
  for (const [id, x] of fromMap) if (!toMap.has(id)) removed.push(label(x));
  for (const [id, x] of toMap) {
    const prev = fromMap.get(id);
    if (prev && serialize(prev) !== serialize(x)) modified.push(label(x));
  }
  if (!added.length && !removed.length && !modified.length) return null;
  return { section, added, removed, modified };
}

/** Compare `from` (e.g. a snapshot) to `to` (e.g. current). */
export function diffContent(from: ResumeContent, to: ResumeContent): ContentDiff {
  const fields: FieldChange[] = [];
  const scalar: [string, keyof ResumeContent][] = [
    ['Name', 'fullName'], ['Title', 'title'], ['Email', 'email'], ['Phone', 'phone'],
    ['Location', 'location'], ['Website', 'website'], ['Summary', 'summary'],
  ];
  for (const [label, key] of scalar) {
    const a = String(from[key] ?? ''); const b = String(to[key] ?? '');
    if (a !== b) fields.push({ label, from: a, to: b });
  }

  const lists: ListChange[] = [];
  const exp = diffList('Experience', from.experience, to.experience, (e) => [e.role, e.company].filter(Boolean).join(' · ') || 'Entry', (e) => JSON.stringify([e.role, e.company, e.location, e.start, e.end, e.current, e.bullets]));
  const edu = diffList('Education', from.education, to.education, (e) => [e.degree, e.institution].filter(Boolean).join(' · ') || 'Entry', (e) => JSON.stringify([e.degree, e.institution, e.start, e.end, e.details]));
  const prj = diffList('Projects', from.projects, to.projects, (p) => p.name || 'Project', (p) => JSON.stringify([p.name, p.description, p.link, p.tech]));
  const skl = diffList('Skills', from.skills, to.skills, (g) => g.name || 'Group', (g) => JSON.stringify([g.name, g.skills]));
  const crt = diffList('Certifications', from.certifications, to.certifications, (c) => c.name || 'Certification', (c) => JSON.stringify([c.name, c.issuer, c.date]));
  const cst = diffList('Custom sections', from.customSections, to.customSections, (s) => s.title || 'Section', (s) => JSON.stringify(s));
  for (const l of [exp, edu, prj, skl, crt, cst]) if (l) lists.push(l);

  return { fields, lists, changed: fields.length > 0 || lists.length > 0 };
}
