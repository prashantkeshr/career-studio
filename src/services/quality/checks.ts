import type { ResumeData } from '../../core/models/types';

// Deterministic, rule-based resume checks. No AI, nothing sent anywhere.
// Each finding explains what was found and what to do about it.

export type Severity = 'error' | 'warning' | 'info';

export interface Finding {
  id: string;
  severity: Severity;
  message: string;
  hint?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_LIKE_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i;

export function runResumeChecks(data: ResumeData): Finding[] {
  const c = data.content;
  const out: Finding[] = [];

  // --- Essential contact details ---
  if (!c.fullName.trim()) {
    out.push({ id: 'name', severity: 'error', message: 'Your name is missing.', hint: 'Add your full name in the Details section.' });
  }
  if (!c.email.trim()) {
    out.push({ id: 'email', severity: 'warning', message: 'No email address.', hint: 'Most employers expect an email contact.' });
  } else if (!EMAIL_RE.test(c.email.trim())) {
    out.push({ id: 'email-format', severity: 'warning', message: 'Email address looks malformed.', hint: `“${c.email}” is not a standard email.` });
  }
  if (!c.phone.trim() && !c.location.trim()) {
    out.push({ id: 'contact', severity: 'info', message: 'No phone or location given.', hint: 'Consider adding at least one so recruiters can reach you.' });
  }

  // --- Summary ---
  if (!c.summary.trim()) {
    out.push({ id: 'summary', severity: 'info', message: 'No professional summary.', hint: 'A 2–3 line summary helps readers quickly understand your fit.' });
  } else if (c.summary.trim().length > 600) {
    out.push({ id: 'summary-long', severity: 'info', message: 'Summary is quite long.', hint: 'Aim for 2–4 concise sentences.' });
  }

  // --- Experience ---
  const visibleExp = !data.hiddenSections.includes('experience');
  if (visibleExp && c.experience.length === 0) {
    out.push({ id: 'experience', severity: 'warning', message: 'No experience entries.', hint: 'Add roles, internships, or relevant projects.' });
  }
  c.experience.forEach((e, i) => {
    const label = e.role || e.company || `Entry ${i + 1}`;
    if (!e.role.trim() || !e.company.trim()) {
      out.push({ id: `exp-incomplete-${e.id}`, severity: 'warning', message: `Experience “${label}” is missing a role or company.` });
    }
    const emptyBullets = e.bullets.filter((b) => !b.trim()).length;
    if (emptyBullets > 0) {
      out.push({ id: `exp-empty-bullet-${e.id}`, severity: 'info', message: `“${label}” has ${emptyBullets} empty bullet point(s).`, hint: 'Remove blank bullets or fill them in.' });
    }
    if (e.bullets.every((b) => !b.trim())) {
      out.push({ id: `exp-no-bullets-${e.id}`, severity: 'info', message: `“${label}” has no description.`, hint: 'Add 2–4 achievement-focused bullets.' });
    }
  });

  // --- Dates consistency (year presence) ---
  const yearRe = /\b(19|20)\d{2}\b/;
  const datedCount = c.experience.filter((e) => e.start || e.end || e.current).length;
  const withYear = c.experience.filter((e) => yearRe.test(e.start) || yearRe.test(e.end)).length;
  if (datedCount > 0 && withYear < datedCount) {
    out.push({ id: 'dates', severity: 'info', message: 'Some experience dates have no 4-digit year.', hint: 'Consistent dates (e.g. “2021 – 2024”) read more clearly.' });
  }

  // --- Links well-formed ---
  for (const l of c.links) {
    if (l.url.trim() && !URL_LIKE_RE.test(l.url.trim())) {
      out.push({ id: `link-${l.id}`, severity: 'info', message: `Link “${l.label || l.url}” may be malformed.` });
    }
  }
  if (c.website.trim() && !URL_LIKE_RE.test(c.website.trim())) {
    out.push({ id: 'website', severity: 'info', message: 'Website address may be malformed.' });
  }

  // --- Skills / education presence (informational, never mandatory) ---
  if (!data.hiddenSections.includes('skills') && c.skills.length === 0) {
    out.push({ id: 'skills', severity: 'info', message: 'No skills listed.', hint: 'Skill groups help both readers and applicant-tracking systems.' });
  }

  if (out.length === 0) {
    out.push({ id: 'ok', severity: 'info', message: 'No issues found by the basic checks.', hint: 'These checks are a guide, not a guarantee of any outcome.' });
  }
  return out;
}
