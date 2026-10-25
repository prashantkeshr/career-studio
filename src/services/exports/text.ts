import type { ResumeData } from '../../core/models/types';
import { SECTION_TITLES } from '../../features/resume-studio/sections';

// Plain-text export. ATS-friendly, no layout — just readable content.

export function resumeToText(data: ResumeData): string {
  const c = data.content;
  const lines: string[] = [];
  const rule = () => lines.push('='.repeat(60));

  if (c.fullName) lines.push(c.fullName.toUpperCase());
  if (c.title) lines.push(c.title);
  const contact = [c.email, c.phone, c.location, c.website].filter(Boolean).join('  |  ');
  if (contact) lines.push(contact);
  const links = c.links.filter((l) => l.url).map((l) => `${l.label}: ${l.url}`).join('  |  ');
  if (links) lines.push(links);
  lines.push('');

  const visible = data.sectionOrder.filter((s) => !data.hiddenSections.includes(s));

  for (const key of visible) {
    switch (key) {
      case 'summary':
        if (c.summary.trim()) {
          rule();
          lines.push(SECTION_TITLES.summary.toUpperCase());
          rule();
          lines.push(c.summary.trim(), '');
        }
        break;
      case 'experience':
        if (c.experience.length) {
          rule();
          lines.push(SECTION_TITLES.experience.toUpperCase());
          rule();
          for (const e of c.experience) {
            const span = e.current ? `${e.start} – Present` : [e.start, e.end].filter(Boolean).join(' – ');
            lines.push(`${e.role} — ${e.company}${e.location ? `, ${e.location}` : ''}${span ? `  (${span})` : ''}`);
            for (const b of e.bullets.filter((x) => x.trim())) lines.push(`  • ${b.trim()}`);
            lines.push('');
          }
        }
        break;
      case 'education':
        if (c.education.length) {
          rule();
          lines.push(SECTION_TITLES.education.toUpperCase());
          rule();
          for (const e of c.education) {
            const span = [e.start, e.end].filter(Boolean).join(' – ');
            lines.push(`${e.degree} — ${e.institution}${span ? `  (${span})` : ''}`);
            if (e.details.trim()) lines.push(`  ${e.details.trim()}`);
            lines.push('');
          }
        }
        break;
      case 'skills':
        if (c.skills.length) {
          rule();
          lines.push(SECTION_TITLES.skills.toUpperCase());
          rule();
          for (const g of c.skills) lines.push(`${g.name}: ${g.skills.join(', ')}`);
          lines.push('');
        }
        break;
      case 'projects':
        if (c.projects.length) {
          rule();
          lines.push(SECTION_TITLES.projects.toUpperCase());
          rule();
          for (const p of c.projects) {
            lines.push(`${p.name}${p.link ? `  (${p.link})` : ''}`);
            if (p.description.trim()) lines.push(`  ${p.description.trim()}`);
            if (p.tech.length) lines.push(`  Tech: ${p.tech.join(', ')}`);
            lines.push('');
          }
        }
        break;
      case 'certifications':
        if (c.certifications.length) {
          rule();
          lines.push(SECTION_TITLES.certifications.toUpperCase());
          rule();
          for (const ct of c.certifications) {
            lines.push(`${ct.name}${ct.issuer ? ` — ${ct.issuer}` : ''}${ct.date ? `  (${ct.date})` : ''}`);
          }
          lines.push('');
        }
        break;
      default: {
        const cs = c.customSections.find((s) => s.id === key);
        if (cs && cs.items.length) {
          rule();
          lines.push(cs.title.toUpperCase());
          rule();
          for (const it of cs.items) {
            lines.push([it.heading, it.subheading, it.date].filter(Boolean).join(' — '));
            for (const b of it.bullets.filter((x) => x.trim())) lines.push(`  • ${b.trim()}`);
            lines.push('');
          }
        }
      }
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
