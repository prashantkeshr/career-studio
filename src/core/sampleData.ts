import type { CareerProfile, ResumeProject } from './models/types';
import { contentFromProfile, defaultDesign, DEFAULT_SECTION_ORDER, uid } from './models/factory';
import { SCHEMA_VERSION } from './models/types';

// NOTE: This is clearly-labelled DEMO content. It is only loaded when the user
// explicitly chooses "Load sample data" and is never confused with real work.

export function sampleProfile(): CareerProfile {
  return {
    id: 'primary',
    updatedAt: Date.now(),
    fullName: 'Avery Sample',
    title: 'Senior Software Engineer',
    email: 'avery.sample@example.com',
    phone: '+1 (555) 014-2200',
    location: 'Austin, TX',
    website: 'averysample.dev',
    objective: '',
    links: [
      { id: uid('lnk'), label: 'GitHub', url: 'github.com/averysample' },
      { id: uid('lnk'), label: 'LinkedIn', url: 'linkedin.com/in/averysample' },
    ],
    summary:
      'Software engineer with 8+ years building reliable web platforms. Focused on front-end architecture, performance, and developer experience. Comfortable owning features end to end and mentoring teams.',
    experience: [
      {
        id: uid('exp'),
        role: 'Senior Software Engineer',
        company: 'Northwind Labs',
        location: 'Remote',
        start: '2021',
        end: '',
        current: true,
        bullets: [
          'Led the rebuild of the customer dashboard, cutting initial load time from 4.1s to 1.3s.',
          'Introduced a shared component library adopted by 5 product teams.',
          'Mentored 4 engineers; established the team’s code-review and testing standards.',
        ],
      },
      {
        id: uid('exp'),
        role: 'Software Engineer',
        company: 'Brightwave',
        location: 'Austin, TX',
        start: '2017',
        end: '2021',
        current: false,
        bullets: [
          'Built a self-serve reporting module used by 12,000 monthly active users.',
          'Reduced API error rate from 2.4% to 0.3% by adding structured retries and monitoring.',
        ],
      },
    ],
    education: [
      {
        id: uid('edu'),
        degree: 'B.S. Computer Science',
        institution: 'University of Texas at Austin',
        location: 'Austin, TX',
        start: '2013',
        end: '2017',
        details: 'Graduated with honors. Focus on distributed systems.',
      },
    ],
    skills: [
      { id: uid('skl'), name: 'Languages', skills: ['TypeScript', 'JavaScript', 'Python', 'Go'] },
      { id: uid('skl'), name: 'Frontend', skills: ['React', 'Vite', 'CSS', 'Accessibility'] },
      { id: uid('skl'), name: 'Tooling', skills: ['Git', 'Docker', 'CI/CD', 'Playwright'] },
    ],
    projects: [
      {
        id: uid('prj'),
        name: 'OpenMetrics Dashboard',
        description: 'An open-source, zero-config dashboard for self-hosted metrics.',
        link: 'github.com/averysample/openmetrics',
        tech: ['React', 'TypeScript', 'D3'],
      },
    ],
    certifications: [
      { id: uid('crt'), name: 'AWS Certified Developer – Associate', issuer: 'Amazon Web Services', date: '2022' },
    ],
    customSections: [],
  };
}

export function sampleResume(profile: CareerProfile): ResumeProject {
  const now = Date.now();
  return {
    id: uid('prj'),
    type: 'resume',
    schemaVersion: SCHEMA_VERSION,
    title: 'Avery Sample — Software Engineer (Sample)',
    createdAt: now,
    updatedAt: now,
    archived: false,
    data: {
      content: contentFromProfile(profile),
      templateId: 'modern',
      design: defaultDesign(),
      sectionOrder: [...DEFAULT_SECTION_ORDER],
      hiddenSections: [],
    },
  };
}
