import type { FontKey, HeadingStyle, ResumeData, ResumeDesign } from '../../core/models/types';
import { TEMPLATES, getTemplate } from './templates/registry';
import { SECTION_TITLES, isBuiltIn } from './sections';
import { defaultDesign } from '../../core/models/factory';
import { Icon } from '../../components/ui/Icon';
import { useStore } from '../../state/store';

type PatchData = (fn: (d: ResumeData) => ResumeData) => void;

const ACCENTS = ['#2563eb', '#0d9488', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#1f2937', '#334155'];
const FONTS: { key: FontKey; label: string }[] = [
  { key: 'inter', label: 'Inter (sans)' },
  { key: 'arial', label: 'Arial (sans)' },
  { key: 'georgia', label: 'Georgia (serif)' },
  { key: 'times', label: 'Times (serif)' },
  { key: 'jetbrains', label: 'JetBrains Mono' },
];
const HEADINGS: { key: HeadingStyle; label: string }[] = [
  { key: 'bar', label: 'Bar' },
  { key: 'underline', label: 'Underline' },
  { key: 'plain', label: 'Plain' },
  { key: 'uppercase', label: 'Spaced' },
];

const PRESETS: { name: string; design: Partial<ResumeDesign> }[] = [
  { name: 'Professional', design: { accent: '#2563eb', fontFamily: 'inter', headingStyle: 'bar' } },
  { name: 'Minimal', design: { accent: '#111827', fontFamily: 'inter', headingStyle: 'uppercase' } },
  { name: 'Classic', design: { accent: '#1f2937', fontFamily: 'georgia', headingStyle: 'underline' } },
  { name: 'Academic', design: { accent: '#334155', fontFamily: 'times', headingStyle: 'plain' } },
  { name: 'Bold', design: { accent: '#7c3aed', fontFamily: 'georgia', headingStyle: 'bar' } },
];

function Range({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div className="field">
      <div className="range-label"><span>{label}</span><span>{format(value)}</span></div>
      <input className="range" type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function DesignPanel({ data, patchData }: { data: ResumeData; patchData: PatchData }) {
  const { mode } = useStore();
  const d = data.design;
  const setDesign = (patch: Partial<ResumeDesign>) => patchData((prev) => ({ ...prev, design: { ...prev.design, ...patch } }));

  const sectionLabel = (key: string) =>
    isBuiltIn(key) ? SECTION_TITLES[key] : data.content.customSections.find((s) => s.id === key)?.title ?? 'Section';

  const toggleHidden = (key: string) =>
    patchData((prev) => ({
      ...prev,
      hiddenSections: prev.hiddenSections.includes(key)
        ? prev.hiddenSections.filter((k) => k !== key)
        : [...prev.hiddenSections, key],
    }));

  const moveSection = (index: number, dir: -1 | 1) =>
    patchData((prev) => {
      const next = index + dir;
      if (next < 0 || next >= prev.sectionOrder.length) return prev;
      const order = prev.sectionOrder.slice();
      [order[index], order[next]] = [order[next], order[index]];
      return { ...prev, sectionOrder: order };
    });

  return (
    <div className="panel-pad">
      {/* Template */}
      <h4 style={{ marginBottom: 8 }}>Template</h4>
      <div className="tpl-pick">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            className={`tpl-opt ${t.id === data.templateId ? 'active' : ''}`}
            onClick={() => patchData((prev) => ({ ...prev, templateId: t.id }))}
            title={t.description}
          >
            <div className="tpl-thumb" style={{ background: t.thumb }} />
            <strong>{t.name}</strong>
            <span>{t.category}</span>
          </button>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
        Switching templates keeps all your content — only the design changes.
      </p>

      {/* Presets */}
      <h4 style={{ margin: '18px 0 8px' }}>Quick styles</h4>
      <div className="row-wrap">
        {PRESETS.map((p) => (
          <button key={p.name} className="btn btn-sm" onClick={() => setDesign(p.design)}>{p.name}</button>
        ))}
        <button className="btn btn-sm btn-ghost" onClick={() => { const def = getTemplate(data.templateId).defaults; setDesign({ ...defaultDesign(), accent: def.accent, fontFamily: def.font, headingStyle: def.heading }); }}>
          Reset
        </button>
      </div>

      {/* Accent color */}
      <h4 style={{ margin: '18px 0 8px' }}>Accent colour</h4>
      <div className="swatches">
        {ACCENTS.map((a) => (
          <button key={a} className={`swatch ${a === d.accent ? 'active' : ''}`} style={{ background: a }} aria-label={`Accent ${a}`} onClick={() => setDesign({ accent: a })} />
        ))}
        <input type="color" aria-label="Custom accent colour" value={d.accent} onChange={(e) => setDesign({ accent: e.target.value })} style={{ width: 28, height: 28, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }} />
      </div>

      {/* Font */}
      <div className="field" style={{ marginTop: 16 }}>
        <label>Font</label>
        <select className="select" value={d.fontFamily} onChange={(e) => setDesign({ fontFamily: e.target.value as FontKey })}>
          {FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
      </div>

      {/* Heading style */}
      <div className="field">
        <label>Heading style</label>
        <div className="seg" role="group" aria-label="Heading style">
          {HEADINGS.map((h) => (
            <button key={h.key} className={h.key === d.headingStyle ? 'active' : ''} onClick={() => setDesign({ headingStyle: h.key })}>{h.label}</button>
          ))}
        </div>
      </div>

      {/* Advanced typography (advanced mode only) */}
      {mode === 'advanced' && (
        <>
          <h4 style={{ margin: '18px 0 8px' }}>Advanced</h4>
          <Range label="Text size" value={d.fontScale} min={0.85} max={1.15} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => setDesign({ fontScale: v })} />
          <Range label="Line height" value={d.lineHeight} min={1.2} max={1.7} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => setDesign({ lineHeight: v })} />
          <Range label="Section spacing" value={d.sectionSpacing} min={10} max={36} step={1} format={(v) => `${v}px`} onChange={(v) => setDesign({ sectionSpacing: v })} />
          <div className="field">
            <label>Page size</label>
            <div className="seg" role="group" aria-label="Page size">
              <button className={d.pageSize === 'a4' ? 'active' : ''} onClick={() => setDesign({ pageSize: 'a4' })}>A4</button>
              <button className={d.pageSize === 'letter' ? 'active' : ''} onClick={() => setDesign({ pageSize: 'letter' })}>Letter</button>
            </div>
          </div>
        </>
      )}

      {/* Sections */}
      <h4 style={{ margin: '18px 0 8px' }}>Sections</h4>
      <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>Reorder or hide sections. Hidden sections keep their content.</p>
      <div className="stack" style={{ gap: 6 }}>
        {data.sectionOrder.map((key, i) => {
          const hidden = data.hiddenSections.includes(key);
          return (
            <div key={key} className="row" style={{ gap: 4, opacity: hidden ? 0.55 : 1 }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{sectionLabel(key)}</span>
              <button className="btn btn-sm btn-ghost btn-icon" aria-label="Move up" disabled={i === 0} onClick={() => moveSection(i, -1)}><Icon name="chevron-up" size={15} /></button>
              <button className="btn btn-sm btn-ghost btn-icon" aria-label="Move down" disabled={i === data.sectionOrder.length - 1} onClick={() => moveSection(i, 1)}><Icon name="chevron-down" size={15} /></button>
              <button className="btn btn-sm btn-ghost btn-icon" aria-label={hidden ? 'Show section' : 'Hide section'} onClick={() => toggleHidden(key)}><Icon name={hidden ? 'eye-off' : 'eye'} size={15} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
