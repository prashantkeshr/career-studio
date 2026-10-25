import type {
  CareerProfile,
  ResumeContent,
  ResumeData,
  ResumeDesign,
  ResumeProject,
} from './types';
import { SCHEMA_VERSION } from './types';

/** Stable, collision-resistant id. Uses crypto.randomUUID when available. */
export function uid(prefix = 'id'): string {
  const g = globalThis.crypto;
  if (g && typeof g.randomUUID === 'function') return `${prefix}_${g.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyContent(): ResumeContent {
  return {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    links: [],
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    customSections: [],
  };
}

export function emptyProfile(): CareerProfile {
  return {
    ...emptyContent(),
    id: 'primary',
    objective: '',
    updatedAt: Date.now(),
  };
}

export function defaultDesign(): ResumeDesign {
  return {
    accent: '#2563eb',
    fontFamily: 'inter',
    fontScale: 1,
    lineHeight: 1.45,
    sectionSpacing: 20,
    headingStyle: 'bar',
    pageSize: 'a4',
  };
}

export const DEFAULT_SECTION_ORDER: string[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
];

/** Build resume content from a profile (a snapshot the resume then owns). */
export function contentFromProfile(profile: CareerProfile): ResumeContent {
  const {
    fullName,
    title,
    email,
    phone,
    location,
    website,
    links,
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
    customSections,
  } = profile;
  // Deep clone so the resume cannot mutate the profile (or vice versa).
  return structuredClone({
    fullName,
    title,
    email,
    phone,
    location,
    website,
    links,
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
    customSections,
  });
}

export function newResumeProject(opts: {
  title: string;
  templateId: string;
  content?: ResumeContent;
}): ResumeProject {
  const now = Date.now();
  const data: ResumeData = {
    content: opts.content ?? emptyContent(),
    templateId: opts.templateId,
    design: defaultDesign(),
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    hiddenSections: [],
    snapshots: [],
  };
  return {
    id: uid('prj'),
    type: 'resume',
    schemaVersion: SCHEMA_VERSION,
    title: opts.title || 'Untitled resume',
    createdAt: now,
    updatedAt: now,
    archived: false,
    data,
  };
}
