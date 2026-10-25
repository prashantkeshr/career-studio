// ---------------------------------------------------------------------------
// Universal Career Studio — shared data model
//
// Design principle: professional CONTENT is kept separate from document DESIGN.
// A CareerProfile is the master source of truth. Each ResumeProject holds its
// own editable copy of content (so tailoring one resume never mutates another)
// plus a template id and design tokens. Every list entry has a stable id so
// reordering, editing and (future) version comparison stay reliable.
// ---------------------------------------------------------------------------

export const SCHEMA_VERSION = 2;

export type ID = string;

export interface Link {
  id: ID;
  label: string;
  url: string;
}

export interface ExperienceEntry {
  id: ID;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  current: boolean;
  bullets: string[];
}

export interface EducationEntry {
  id: ID;
  degree: string;
  institution: string;
  location: string;
  start: string;
  end: string;
  details: string;
}

export interface SkillGroup {
  id: ID;
  name: string;
  skills: string[];
}

export interface ProjectEntry {
  id: ID;
  name: string;
  description: string;
  link: string;
  tech: string[];
}

export interface CertificationEntry {
  id: ID;
  name: string;
  issuer: string;
  date: string;
}

export interface CustomItem {
  id: ID;
  heading: string;
  subheading: string;
  date: string;
  bullets: string[];
}

export interface CustomSection {
  id: ID;
  title: string;
  items: CustomItem[];
}

/** The editable content shared in shape between the Career Profile and a resume. */
export interface ResumeContent {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  links: Link[];
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillGroup[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  customSections: CustomSection[];
}

/** The master reusable profile. Structurally a superset of ResumeContent. */
export interface CareerProfile extends ResumeContent {
  id: ID;
  objective: string;
  updatedAt: number;
}

// --- Design -------------------------------------------------------------

export type HeadingStyle = 'underline' | 'bar' | 'plain' | 'uppercase';

export interface ResumeDesign {
  accent: string;
  fontFamily: FontKey;
  fontScale: number; // 0.85 – 1.15
  lineHeight: number; // 1.2 – 1.7
  sectionSpacing: number; // px between sections
  headingStyle: HeadingStyle;
  pageSize: 'a4' | 'letter';
}

export type FontKey = 'inter' | 'georgia' | 'times' | 'arial' | 'jetbrains';

// Built-in, reorderable sections. Custom sections are referenced by their id.
export type BuiltInSectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications';

/** A named, restorable snapshot of a resume's content + design at a point in time. */
export interface ResumeSnapshot {
  id: ID;
  name: string;
  createdAt: number;
  content: ResumeContent;
  templateId: string;
  design: ResumeDesign;
  sectionOrder: string[];
  hiddenSections: string[];
}

export interface ResumeData {
  content: ResumeContent;
  templateId: string;
  design: ResumeDesign;
  /** Order of section keys (built-in keys and custom-section ids). */
  sectionOrder: string[];
  /** Section keys/ids that are hidden from the rendered document. */
  hiddenSections: string[];
  /** Named version snapshots (schema v2+). */
  snapshots: ResumeSnapshot[];
}

// --- Project envelope ---------------------------------------------------

export type ProjectType = 'resume' | 'cover-letter' | 'portfolio' | 'website';

export interface ProjectEnvelope<T = unknown> {
  id: ID;
  type: ProjectType;
  schemaVersion: number;
  title: string;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  data: T;
}

export type ResumeProject = ProjectEnvelope<ResumeData> & { type: 'resume' };

/** A full backup package the user can download and restore. */
export interface BackupPackage {
  kind: 'career-studio-backup';
  schemaVersion: number;
  exportedAt: number;
  profile: CareerProfile | null;
  projects: ProjectEnvelope[];
}
