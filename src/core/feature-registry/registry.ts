// ---------------------------------------------------------------------------
// Central feature registry. The SAME status is displayed everywhere in the UI
// (dashboard cards, menus, tooltips) so the product never claims a capability
// it does not actually have. Honesty is a product requirement, not decoration.
// ---------------------------------------------------------------------------

export type FeatureStatus = 'available' | 'partial' | 'coming-soon' | 'unsupported';

export interface Feature {
  id: string;
  name: string;
  status: FeatureStatus;
  note?: string;
}

export const FEATURES: Feature[] = [
  { id: 'resume-editor', name: 'Resume editor', status: 'available' },
  { id: 'live-preview', name: 'Live resume preview', status: 'available' },
  { id: 'templates', name: 'Resume templates', status: 'available', note: '6 distinct templates; architecture supports more.' },
  { id: 'template-customize', name: 'Template customization', status: 'available', note: 'Fonts, colors, spacing, heading style, section order & visibility.' },
  { id: 'career-profile', name: 'Career Profile', status: 'available', note: 'Reusable master content for all documents.' },
  { id: 'autosave', name: 'Autosave (IndexedDB)', status: 'available' },
  { id: 'pdf-export', name: 'PDF export', status: 'available', note: 'Via the browser print engine (Save as PDF); preview matches output.' },
  { id: 'txt-export', name: 'Plain-text export', status: 'available' },
  { id: 'json-backup', name: 'Project backup & restore (JSON)', status: 'available' },
  { id: 'quality-checks', name: 'Resume quality checks', status: 'available', note: 'Deterministic, rule-based checks.' },
  { id: 'resume-versions', name: 'Multiple resume versions', status: 'partial', note: 'Duplicate a resume to tailor it; richer version history is planned.' },
  { id: 'direct-edit', name: 'Direct click-to-edit on preview', status: 'coming-soon' },
  { id: 'docx-export', name: 'DOCX export', status: 'coming-soon' },
  { id: 'docx-import', name: 'DOCX import', status: 'coming-soon' },
  { id: 'pdf-import', name: 'PDF import & reconstruction', status: 'coming-soon' },
  { id: 'pdf-studio', name: 'PDF Studio (annotate / pages)', status: 'coming-soon' },
  { id: 'asset-studio', name: 'Image & asset studio', status: 'coming-soon' },
  { id: 'portfolio', name: 'Portfolio Studio', status: 'coming-soon' },
  { id: 'website', name: 'Website Studio & ZIP export', status: 'coming-soon' },
  { id: 'cover-letter', name: 'Cover letter builder', status: 'coming-soon' },
  { id: 'ocr', name: 'OCR for scanned PDFs', status: 'coming-soon' },
  { id: 'ai-writing', name: 'AI writing assistance', status: 'coming-soon', note: 'Optional, disabled by default; not yet integrated.' },
  { id: 'cloud-publish', name: 'Automatic cloud publishing', status: 'unsupported', note: 'No backend by design; export and self-host instead.' },
];

const byId = new Map(FEATURES.map((f) => [f.id, f]));

export function getFeature(id: string): Feature | undefined {
  return byId.get(id);
}

export const STATUS_LABEL: Record<FeatureStatus, string> = {
  available: 'Available',
  partial: 'Partial',
  'coming-soon': 'Coming soon',
  unsupported: 'Not supported',
};
