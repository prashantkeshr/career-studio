import type { ResumeContent } from '../../core/models/types';
import { emptyContent, uid } from '../../core/models/factory';

// ---------------------------------------------------------------------------
// DOCX import: text + structure are extracted locally with mammoth. Visual
// formatting is NOT preserved — this is a text-level import with a mandatory
// review step. We map detected headings to known sections; anything we are not
// sure about becomes a custom section rather than being discarded.
// ---------------------------------------------------------------------------

export type SectionKeyGuess =
  | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'custom';

export interface ExtractedSection {
  id: string;
  key: SectionKeyGuess;
  title: string;
  /** One line per paragraph/bullet; bullets are prefixed with "• ". */
  text: string;
}

export interface ExtractedDoc {
  name: string;
  title: string;
  contactLine: string;
  sections: ExtractedSection[];
  warnings: string[];
}

const HEADING_MAP: { re: RegExp; key: SectionKeyGuess }[] = [
  { re: /^(summary|profile|objective|about|professional summary)/i, key: 'summary' },
  { re: /^(experience|employment|work experience|work history|professional experience)/i, key: 'experience' },
  { re: /^(education|academic)/i, key: 'education' },
  { re: /^(skills|technical skills|core skills|competencies)/i, key: 'skills' },
  { re: /^(projects|selected projects|personal projects)/i, key: 'projects' },
  { re: /^(certifications?|licenses?|credentials)/i, key: 'certifications' },
];

function guessKey(heading: string): SectionKeyGuess {
  for (const h of HEADING_MAP) if (h.re.test(heading.trim())) return h.key;
  return 'custom';
}

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;

export async function extractDocx(file: File): Promise<ExtractedDoc> {
  const warnings: string[] = [];
  const buffer = await file.arrayBuffer();
  // Loaded on demand so mammoth is not part of the initial bundle.
  const mammoth = await import('mammoth/mammoth.browser.js');
  const { value: html, messages } = await mammoth.convertToHtml({ arrayBuffer: buffer });
  if (messages.some((m) => m.type === 'warning')) {
    warnings.push('Some elements (images, complex formatting) were simplified or skipped.');
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks = Array.from(doc.body.children);

  let name = '';
  let title = '';
  let contactLine = '';
  const sections: ExtractedSection[] = [];
  let current: ExtractedSection | null = null;
  const preamble: string[] = []; // lines before the first heading

  const pushLine = (text: string, bullet: boolean) => {
    const t = text.replace(/\s+/g, ' ').trim();
    if (!t) return;
    if (current) current.text += (current.text ? '\n' : '') + (bullet ? `• ${t}` : t);
    else preamble.push(t);
  };

  for (const el of blocks) {
    const tag = el.tagName.toLowerCase();
    const textContent = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!textContent && tag !== 'ul' && tag !== 'ol') continue;

    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      // Heading: either the person's name (first heading, no section match) or a section.
      const key = guessKey(textContent);
      if (!name && key === 'custom' && sections.length === 0 && preamble.length === 0) {
        name = textContent;
        continue;
      }
      current = { id: uid('sec'), key, title: textContent, text: '' };
      sections.push(current);
    } else if (tag === 'ul' || tag === 'ol') {
      for (const li of Array.from(el.querySelectorAll('li'))) pushLine(li.textContent ?? '', true);
    } else {
      pushLine(textContent, false);
    }
  }

  // Derive name/title/contact from the preamble if no explicit name heading.
  const contactBits: string[] = [];
  const leftover: string[] = [];
  for (const line of preamble) {
    if (EMAIL_RE.test(line) || PHONE_RE.test(line) || /\b(linkedin|github|http)/i.test(line)) contactBits.push(line);
    else leftover.push(line);
  }
  if (!name && leftover.length) name = leftover.shift() ?? '';
  if (!title && leftover.length) title = leftover.shift() ?? '';
  contactLine = contactBits.join('  |  ');
  // Any remaining leftover preamble becomes an implicit summary.
  if (leftover.length) {
    sections.unshift({ id: uid('sec'), key: 'summary', title: 'Summary', text: leftover.join('\n') });
  }

  if (sections.length === 0) warnings.push('No clear sections were detected — you may need to organise the content manually after import.');

  return { name, title, contactLine, sections, warnings };
}

// --- turn the (reviewed) extraction into structured ResumeContent ----------

function parseContact(line: string): Partial<ResumeContent> {
  const out: Partial<ResumeContent> = {};
  const email = line.match(EMAIL_RE);
  if (email) out.email = email[0];
  const phone = line.replace(email?.[0] ?? '', '').match(PHONE_RE);
  if (phone) out.phone = phone[0].trim();
  const links: ResumeContent['links'] = [];
  for (const m of line.matchAll(/\b((?:https?:\/\/)?(?:www\.)?(?:linkedin|github)\.[^\s|]+)/gi)) {
    links.push({ id: uid('lnk'), label: /linkedin/i.test(m[1]) ? 'LinkedIn' : 'GitHub', url: m[1] });
  }
  if (links.length) out.links = links;
  return out;
}

const DATE_RE = /((?:19|20)\d{2}|present|current)/i;

// A non-bullet line only starts a NEW entry when it looks like a header — it
// contains a date/year or a role–company separator. Otherwise it is treated as
// a continuation (bullet) of the current entry. This keeps plain description
// lines from being split into phantom entries.
function looksLikeHeader(line: string): boolean {
  return /((?:19|20)\d{2}|present|current)/i.test(line) || /\s[—|]\s|\s-\s/.test(line);
}

function splitEntries(text: string): { header: string; bullets: string[]; paras: string[] }[] {
  const entries: { header: string; bullets: string[]; paras: string[] }[] = [];
  let cur: { header: string; bullets: string[]; paras: string[] } | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const isBullet = /^[•\-*]/.test(line);
    const clean = line.replace(/^[•\-*]\s*/, '');
    if (isBullet && cur) {
      cur.bullets.push(clean);
    } else if (!cur || looksLikeHeader(clean)) {
      cur = { header: clean, bullets: [], paras: [] };
      entries.push(cur);
    } else {
      cur.bullets.push(clean);
    }
  }
  return entries;
}

function parseHeader(header: string): { a: string; b: string; dates: string } {
  const dateMatches = [...header.matchAll(new RegExp(DATE_RE, 'gi'))].map((m) => m[0]);
  const dates = dateMatches.length ? dateMatches.slice(0, 2).join(' – ') : '';
  let rest = header.replace(/\(([^)]*)\)\s*$/, '').trim();
  for (const d of dateMatches) rest = rest.replace(d, '');
  rest = rest.replace(/[,|–-]\s*$/, '').trim();
  const parts = rest.split(/\s+[—|]\s+|\s+-\s+|,\s+/).map((s) => s.trim()).filter(Boolean);
  return { a: parts[0] ?? rest, b: parts[1] ?? '', dates };
}

export function buildContentFromExtraction(doc: ExtractedDoc): ResumeContent {
  const c = emptyContent();
  c.fullName = doc.name.trim();
  c.title = doc.title.trim();
  Object.assign(c, parseContact(doc.contactLine));

  for (const sec of doc.sections) {
    const text = sec.text.trim();
    if (!text && sec.key !== 'skills') continue;
    switch (sec.key) {
      case 'summary':
        c.summary = (c.summary ? c.summary + '\n' : '') + text.replace(/^•\s*/gm, '');
        break;
      case 'experience':
        for (const e of splitEntries(text)) {
          const { a, b, dates } = parseHeader(e.header);
          c.experience.push({
            id: uid('exp'), role: a, company: b, location: '',
            start: dates.split(' – ')[0] ?? '', end: dates.split(' – ')[1] ?? '',
            current: /present|current/i.test(dates), bullets: e.bullets.length ? e.bullets : [''],
          });
        }
        break;
      case 'education':
        for (const e of splitEntries(text)) {
          const { a, b, dates } = parseHeader(e.header);
          c.education.push({
            id: uid('edu'), degree: a, institution: b, location: '',
            start: dates.split(' – ')[0] ?? '', end: dates.split(' – ')[1] ?? '',
            details: e.bullets.join(' '),
          });
        }
        break;
      case 'skills': {
        for (const line of text.split('\n').map((l) => l.replace(/^•\s*/, '').trim()).filter(Boolean)) {
          const colon = line.indexOf(':');
          if (colon > -1) c.skills.push({ id: uid('skl'), name: line.slice(0, colon).trim(), skills: line.slice(colon + 1).split(/[,;]/).map((s) => s.trim()).filter(Boolean) });
          else c.skills.push({ id: uid('skl'), name: 'Skills', skills: line.split(/[,;]/).map((s) => s.trim()).filter(Boolean) });
        }
        break;
      }
      case 'projects':
        for (const e of splitEntries(text)) {
          c.projects.push({ id: uid('prj'), name: e.header, description: e.bullets.join(' '), link: '', tech: [] });
        }
        break;
      case 'certifications':
        for (const e of splitEntries(text)) {
          const { a, b, dates } = parseHeader(e.header);
          c.certifications.push({ id: uid('crt'), name: a, issuer: b, date: dates });
        }
        break;
      default:
        c.customSections.push({
          id: uid('cst'), title: sec.title,
          items: splitEntries(text).map((e) => ({ id: uid('itm'), heading: e.header, subheading: '', date: '', bullets: e.bullets.length ? e.bullets : [''] })),
        });
    }
  }
  return c;
}
