import type { CoverLetterData } from '../../core/models/types';

// Plain-text and DOCX export for cover letters. DOCX uses the `docx` library,
// loaded on demand (shared pattern with the resume exporter).

export function coverLetterToText(d: CoverLetterData): string {
  const s = d.sender;
  const r = d.recipient;
  const lines: string[] = [];
  const senderBlock = [s.name, s.title, [s.email, s.phone].filter(Boolean).join(' · '), [s.location, s.website].filter(Boolean).join(' · ')].filter(Boolean);
  lines.push(...senderBlock, '');
  if (d.date) lines.push(d.date, '');
  const recipBlock = [r.name, r.title, r.company, r.address].filter(Boolean);
  if (recipBlock.length) lines.push(...recipBlock, '');
  if (d.subject) lines.push(d.subject, '');
  if (d.salutation) lines.push(d.salutation, '');
  for (const para of d.body) lines.push(para, '');
  lines.push(d.closing, '', d.signature);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

export async function coverLetterToDocxBlob(d: CoverLetterData): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');
  const s = d.sender;
  const r = d.recipient;
  const P = (text: string, opts: { bold?: boolean; after?: number } = {}) =>
    new Paragraph({ spacing: { after: opts.after ?? 120 }, children: [new TextRun({ text, bold: opts.bold })] });

  const children: InstanceType<typeof Paragraph>[] = [];
  if (s.name) children.push(P(s.name, { bold: true, after: 20 }));
  const senderMeta = [s.title, [s.email, s.phone].filter(Boolean).join(' · '), [s.location, s.website].filter(Boolean).join(' · ')].filter(Boolean);
  senderMeta.forEach((m) => children.push(P(m, { after: 20 })));
  children.push(P('', { after: 120 }));
  if (d.date) children.push(P(d.date));
  [r.name, r.title, r.company, r.address].filter(Boolean).forEach((m) => children.push(P(m, { after: 20 })));
  if (r.name || r.company) children.push(P('', { after: 120 }));
  if (d.subject) children.push(P(d.subject, { bold: true }));
  if (d.salutation) children.push(P(d.salutation));
  d.body.forEach((para) => children.push(P(para)));
  children.push(P(d.closing, { after: 200 }));
  children.push(P(d.signature, { bold: true }));

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Georgia', size: 22 } } } },
    sections: [{ children }],
  });
  return Packer.toBlob(doc);
}
