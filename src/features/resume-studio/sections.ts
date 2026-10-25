import type { BuiltInSectionKey } from '../../core/models/types';

export const SECTION_TITLES: Record<BuiltInSectionKey, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
};

export const BUILTIN_SECTIONS: BuiltInSectionKey[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
];

export function isBuiltIn(key: string): key is BuiltInSectionKey {
  return (BUILTIN_SECTIONS as string[]).includes(key);
}
