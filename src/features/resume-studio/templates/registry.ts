import type { FontKey, HeadingStyle } from '../../../core/models/types';

export type TemplateLayout = 'single' | 'sidebar';

export interface TemplateDef {
  id: string;
  name: string;
  category: string;
  description: string;
  layout: TemplateLayout;
  /** Sensible starting design for this template (user can override everything). */
  defaults: {
    font: FontKey;
    heading: HeadingStyle;
    accent: string;
  };
  /** Thumbnail background used in the picker (pure CSS, no image assets). */
  thumb: string;
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'classic',
    name: 'Classic Professional',
    category: 'Professional',
    description: 'Centered serif header, timeless and ATS-friendly.',
    layout: 'single',
    defaults: { font: 'georgia', heading: 'underline', accent: '#1f2937' },
    thumb: 'linear-gradient(#fff 0 32%, #e5e7eb 32% 34%, #fff 34%)',
  },
  {
    id: 'modern',
    name: 'Modern Corporate',
    category: 'Professional',
    description: 'Clean sans-serif with an accent bar on headings.',
    layout: 'single',
    defaults: { font: 'inter', heading: 'bar', accent: '#2563eb' },
    thumb: 'linear-gradient(90deg, #2563eb 0 5px, #fff 5px)',
  },
  {
    id: 'minimal',
    name: 'Minimalist',
    category: 'Professional',
    description: 'Light weight, generous whitespace, understated.',
    layout: 'single',
    defaults: { font: 'inter', heading: 'uppercase', accent: '#111827' },
    thumb: 'linear-gradient(#fff, #fafafa)',
  },
  {
    id: 'executive',
    name: 'Executive',
    category: 'Professional',
    description: 'Bold name, strong accent rule, leadership-focused.',
    layout: 'single',
    defaults: { font: 'georgia', heading: 'bar', accent: '#7c3aed' },
    thumb: 'linear-gradient(#fff 0 26%, #7c3aed 26% 29%, #fff 29%)',
  },
  {
    id: 'academic',
    name: 'Academic CV',
    category: 'Academic',
    description: 'Small-caps headings, dense, good for long CVs.',
    layout: 'single',
    defaults: { font: 'times', heading: 'plain', accent: '#334155' },
    thumb: 'linear-gradient(#fff 0 20%, #cbd5e1 20% 21%, #fff 21%)',
  },
  {
    id: 'technical',
    name: 'Technical (two-column)',
    category: 'Technical',
    description: 'Left sidebar for contact & skills, main column for experience.',
    layout: 'sidebar',
    defaults: { font: 'inter', heading: 'plain', accent: '#0d9488' },
    thumb: 'linear-gradient(90deg, #ccfbf1 0 34%, #fff 34%)',
  },
];

const byId = new Map(TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string): TemplateDef {
  return byId.get(id) ?? TEMPLATES[1];
}
