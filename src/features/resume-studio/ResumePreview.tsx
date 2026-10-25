import type { CSSProperties } from 'react';
import type {
  FontKey,
  ResumeContent,
  ResumeData,
} from '../../core/models/types';
import { getTemplate } from './templates/registry';
import { SECTION_TITLES } from './sections';

const FONT_STACK: Record<FontKey, string> = {
  inter: "'Inter', system-ui, sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  times: "'Times New Roman', Times, serif",
  arial: 'Arial, Helvetica, sans-serif',
  jetbrains: "'JetBrains Mono', ui-monospace, 'Courier New', monospace",
};

const PAGE_DIMS = {
  a4: { w: 794, h: 1123 },
  letter: { w: 816, h: 1056 },
};

function dateSpan(start: string, end: string, current?: boolean): string {
  const e = current ? 'Present' : end;
  return [start, e].filter(Boolean).join(' – ');
}

function ContactLine({ c }: { c: ResumeContent }) {
  const parts = [c.email, c.phone, c.location, c.website].filter(Boolean);
  const links = c.links.filter((l) => l.url);
  if (parts.length === 0 && links.length === 0) return null;
  return (
    <div className="r-contact">
      {parts.map((p, i) => (
        <span key={`p${i}`}>
          {i > 0 && <span className="sep">•&nbsp;</span>}
          {p}
        </span>
      ))}
      {links.map((l) => (
        <span key={l.id}>
          <span className="sep">•&nbsp;</span>
          <a href={l.url.startsWith('http') ? l.url : `https://${l.url}`}>{l.label || l.url}</a>
        </span>
      ))}
    </div>
  );
}

function Section({ k, content, isTech }: { k: string; content: ResumeContent; isTech: boolean }) {
  const c = content;
  switch (k) {
    case 'summary':
      if (!c.summary.trim()) return null;
      return (
        <section className="r-section">
          <h2 className="r-sec-title">{SECTION_TITLES.summary}</h2>
          <p className="r-summary">{c.summary}</p>
        </section>
      );
    case 'experience':
      if (!c.experience.length) return null;
      return (
        <section className="r-section">
          <h2 className="r-sec-title">{SECTION_TITLES.experience}</h2>
          {c.experience.map((e) => (
            <div className="r-item" key={e.id}>
              <div className="r-item-head">
                <span><span className="r-role">{e.role}</span>{e.company && <span className="r-org"> — {e.company}</span>}</span>
                <span className="r-date">{dateSpan(e.start, e.end, e.current)}</span>
              </div>
              {e.location && <div className="r-detail">{e.location}</div>}
              {e.bullets.some((b) => b.trim()) && (
                <ul className="r-bullets">
                  {e.bullets.filter((b) => b.trim()).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      );
    case 'education':
      if (!c.education.length) return null;
      return (
        <section className="r-section">
          <h2 className="r-sec-title">{SECTION_TITLES.education}</h2>
          {c.education.map((e) => (
            <div className="r-item" key={e.id}>
              <div className="r-item-head">
                <span><span className="r-role">{e.degree}</span>{e.institution && <span className="r-org"> — {e.institution}</span>}</span>
                <span className="r-date">{dateSpan(e.start, e.end)}</span>
              </div>
              {e.details && <div className="r-detail">{e.details}</div>}
            </div>
          ))}
        </section>
      );
    case 'skills':
      if (!c.skills.length) return null;
      return (
        <section className="r-section">
          <h2 className="r-sec-title">{SECTION_TITLES.skills}</h2>
          {c.skills.map((g) =>
            isTech ? (
              <div className="r-skillgroup" key={g.id}>
                <b>{g.name}</b>
                <div className="r-chip-list">{g.skills.map((s, i) => <span key={i}>{s}</span>)}</div>
              </div>
            ) : (
              <div className="r-skillgroup" key={g.id}>
                <b>{g.name}:</b> {g.skills.join(', ')}
              </div>
            ),
          )}
        </section>
      );
    case 'projects':
      if (!c.projects.length) return null;
      return (
        <section className="r-section">
          <h2 className="r-sec-title">{SECTION_TITLES.projects}</h2>
          {c.projects.map((p) => (
            <div className="r-item" key={p.id}>
              <div className="r-item-head">
                <span className="r-role">{p.name}</span>
                {p.link && <a className="r-proj-link" href={p.link.startsWith('http') ? p.link : `https://${p.link}`}>{p.link}</a>}
              </div>
              {p.description && <div className="r-detail">{p.description}</div>}
              {p.tech.length > 0 && <div className="r-tech">{p.tech.join(' · ')}</div>}
            </div>
          ))}
        </section>
      );
    case 'certifications':
      if (!c.certifications.length) return null;
      return (
        <section className="r-section">
          <h2 className="r-sec-title">{SECTION_TITLES.certifications}</h2>
          {c.certifications.map((ct) => (
            <div className="r-item" key={ct.id}>
              <div className="r-item-head">
                <span><span className="r-role">{ct.name}</span>{ct.issuer && <span className="r-org"> — {ct.issuer}</span>}</span>
                <span className="r-date">{ct.date}</span>
              </div>
            </div>
          ))}
        </section>
      );
    default: {
      const cs = c.customSections.find((s) => s.id === k);
      if (!cs || !cs.items.length) return null;
      return (
        <section className="r-section">
          <h2 className="r-sec-title">{cs.title}</h2>
          {cs.items.map((it) => (
            <div className="r-item" key={it.id}>
              <div className="r-item-head">
                <span><span className="r-role">{it.heading}</span>{it.subheading && <span className="r-org"> — {it.subheading}</span>}</span>
                <span className="r-date">{it.date}</span>
              </div>
              {it.bullets.some((b) => b.trim()) && (
                <ul className="r-bullets">{it.bullets.filter((b) => b.trim()).map((b, i) => <li key={i}>{b}</li>)}</ul>
              )}
            </div>
          ))}
        </section>
      );
    }
  }
}

export function ResumePreview({ data }: { data: ResumeData }) {
  const tpl = getTemplate(data.templateId);
  const c = data.content;
  const dims = PAGE_DIMS[data.design.pageSize];
  const isTech = tpl.id === 'technical';

  const visible = data.sectionOrder.filter((k) => !data.hiddenSections.includes(k));

  const style = {
    '--r-accent': data.design.accent,
    '--doc-font': FONT_STACK[data.design.fontFamily],
    '--doc-scale': data.design.fontScale,
    '--doc-lh': data.design.lineHeight,
    '--doc-sec-gap': `${data.design.sectionSpacing}px`,
    '--page-w': `${dims.w}px`,
    '--page-h': `${dims.h}px`,
  } as CSSProperties;

  const header = (
    <header className="r-header">
      <div className="r-name">{c.fullName || 'Your Name'}</div>
      {c.title && <div className="r-title">{c.title}</div>}
      <ContactLine c={c} />
    </header>
  );

  if (tpl.layout === 'sidebar') {
    // Contact + skills live in the sidebar; everything else in the main column.
    const sideKeys = visible.filter((k) => k === 'skills');
    const mainKeys = visible.filter((k) => k !== 'skills');
    return (
      <div className={`paper tpl-${tpl.id} tpl-sidebar`} data-heading={data.design.headingStyle} style={style}>
        <div className="r-layout">
          <aside className="r-side">
            <div className="r-name">{c.fullName || 'Your Name'}</div>
            {c.title && <div className="r-title">{c.title}</div>}
            <ContactLine c={c} />
            {sideKeys.map((k) => <Section key={k} k={k} content={c} isTech={isTech} />)}
          </aside>
          <div className="r-main">
            {mainKeys.map((k) => <Section key={k} k={k} content={c} isTech={isTech} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`paper tpl-${tpl.id}`} data-heading={data.design.headingStyle} style={style}>
      {header}
      {visible.map((k) => <Section key={k} k={k} content={c} isTech={isTech} />)}
    </div>
  );
}
