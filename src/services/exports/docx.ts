import type { ResumeData } from '../../core/models/types';
import { SECTION_TITLES, isBuiltIn } from '../../features/resume-studio/sections';

// Real .docx generation, entirely in the browser (no server). The `docx` library
// is loaded on demand (dynamic import) so it never weighs down the initial load.
// Layout is a clean, single-column, ATS-friendly document — it intentionally does
// NOT reproduce a template's exact visual design (see README limitations).

function dateSpan(start: string, end: string, current?: boolean): string {
  const e = current ? 'Present' : end;
  return [start, e].filter(Boolean).join(' – ');
}

export async function resumeToDocxBlob(data: ResumeData): Promise<Blob> {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx');
  const c = data.content;

  const sectionTitle = (title: string) =>
    new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 80 }, children: [new TextRun({ text: title.toUpperCase(), bold: true })] });
  const bullet = (text: string) => new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 20 } });

  const sectionParagraphs = (key: string): InstanceType<typeof Paragraph>[] => {
    const out: InstanceType<typeof Paragraph>[] = [];
    switch (key) {
      case 'summary':
        if (!c.summary.trim()) return [];
        out.push(sectionTitle(SECTION_TITLES.summary), new Paragraph({ text: c.summary.trim() }));
        break;
      case 'experience':
        if (!c.experience.length) return [];
        out.push(sectionTitle(SECTION_TITLES.experience));
        for (const e of c.experience) {
          out.push(new Paragraph({ spacing: { before: 100 }, children: [
            new TextRun({ text: e.role, bold: true }),
            new TextRun({ text: e.company ? ` — ${e.company}` : '' }),
            new TextRun({ text: `\t${dateSpan(e.start, e.end, e.current)}`, italics: true }),
          ] }));
          if (e.location) out.push(new Paragraph({ children: [new TextRun({ text: e.location, italics: true, color: '666666' })] }));
          for (const b of e.bullets.filter((x) => x.trim())) out.push(bullet(b.trim()));
        }
        break;
      case 'education':
        if (!c.education.length) return [];
        out.push(sectionTitle(SECTION_TITLES.education));
        for (const e of c.education) {
          out.push(new Paragraph({ spacing: { before: 80 }, children: [
            new TextRun({ text: e.degree, bold: true }),
            new TextRun({ text: e.institution ? ` — ${e.institution}` : '' }),
            new TextRun({ text: `\t${dateSpan(e.start, e.end)}`, italics: true }),
          ] }));
          if (e.details.trim()) out.push(new Paragraph({ text: e.details.trim() }));
        }
        break;
      case 'skills':
        if (!c.skills.length) return [];
        out.push(sectionTitle(SECTION_TITLES.skills));
        for (const g of c.skills) out.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `${g.name}: `, bold: true }), new TextRun({ text: g.skills.join(', ') })] }));
        break;
      case 'projects':
        if (!c.projects.length) return [];
        out.push(sectionTitle(SECTION_TITLES.projects));
        for (const p of c.projects) {
          out.push(new Paragraph({ spacing: { before: 80 }, children: [
            new TextRun({ text: p.name, bold: true }),
            new TextRun({ text: p.link ? `  (${p.link})` : '', color: '2563EB' }),
          ] }));
          if (p.description.trim()) out.push(new Paragraph({ text: p.description.trim() }));
          if (p.tech.length) out.push(new Paragraph({ children: [new TextRun({ text: p.tech.join(' · '), italics: true, color: '666666' })] }));
        }
        break;
      case 'certifications':
        if (!c.certifications.length) return [];
        out.push(sectionTitle(SECTION_TITLES.certifications));
        for (const ct of c.certifications) {
          out.push(new Paragraph({ children: [
            new TextRun({ text: ct.name, bold: true }),
            new TextRun({ text: ct.issuer ? ` — ${ct.issuer}` : '' }),
            new TextRun({ text: ct.date ? `\t${ct.date}` : '', italics: true }),
          ] }));
        }
        break;
      default: {
        if (isBuiltIn(key)) return [];
        const cs = c.customSections.find((s) => s.id === key);
        if (!cs || !cs.items.length) return [];
        out.push(sectionTitle(cs.title));
        for (const it of cs.items) {
          out.push(new Paragraph({ spacing: { before: 80 }, children: [
            new TextRun({ text: it.heading, bold: true }),
            new TextRun({ text: it.subheading ? ` — ${it.subheading}` : '' }),
            new TextRun({ text: it.date ? `\t${it.date}` : '', italics: true }),
          ] }));
          for (const b of it.bullets.filter((x) => x.trim())) out.push(bullet(b.trim()));
        }
      }
    }
    return out;
  };

  const header: InstanceType<typeof Paragraph>[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: c.fullName || 'Your Name', bold: true })] }),
  ];
  if (c.title) header.push(new Paragraph({ children: [new TextRun({ text: c.title, color: '444444' })] }));
  const contact = [c.email, c.phone, c.location, c.website].filter(Boolean).join('  |  ');
  const links = c.links.filter((l) => l.url).map((l) => `${l.label}: ${l.url}`).join('  |  ');
  if (contact) header.push(new Paragraph({ children: [new TextRun({ text: contact, size: 18 })] }));
  if (links) header.push(new Paragraph({ children: [new TextRun({ text: links, size: 18, color: '2563EB' })] }));

  const visible = data.sectionOrder.filter((k) => !data.hiddenSections.includes(k));
  const body = visible.flatMap((k) => sectionParagraphs(k));

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [{ properties: {}, children: [...header, ...body] }],
  });
  return Packer.toBlob(doc);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
