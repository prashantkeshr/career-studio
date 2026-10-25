import { useRef, useState } from 'react';
import type { CareerProfile, PortfolioProject } from '../../core/models/types';
import { emptyPortfolioProject, uid } from '../../core/models/factory';
import { useStore } from '../../state/store';
import { fileToResizedDataUrl } from '../../services/images/resize';
import { Icon } from '../../components/ui/Icon';

function Tags({ value, onChange, label }: { value: string[]; onChange: (v: string[]) => void; label: string }) {
  const [draft, setDraft] = useState('');
  const add = () => { const v = draft.trim(); if (v && !value.includes(v)) onChange([...value, v]); setDraft(''); };
  return (
    <div className="field">
      <label>{label}</label>
      <div className="chip-row" style={{ marginBottom: 6 }}>
        {value.map((s, i) => <span className="chip" key={i}>{s}<button aria-label={`Remove ${s}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button></span>)}
      </div>
      <div className="row">
        <input className="input" value={draft} placeholder="Add and press Enter" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button className="btn btn-sm" onClick={add}>Add</button>
      </div>
    </div>
  );
}

function ProjectCard({ p, index, count, onPatch, onMove, onDup, onRemove }: {
  p: PortfolioProject; index: number; count: number;
  onPatch: (patch: Partial<PortfolioProject>) => void;
  onMove: (dir: -1 | 1) => void; onDup: () => void; onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgErr, setImgErr] = useState<string | null>(null);

  const onImage = async (file: File) => {
    setImgErr(null);
    if (!file.type.startsWith('image/')) { setImgErr('Please choose an image file.'); return; }
    try { onPatch({ image: await fileToResizedDataUrl(file) }); }
    catch { setImgErr('Could not process that image.'); }
  };

  return (
    <div className="card" style={{ padding: 14, marginBottom: 12 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <strong>{p.title || `Project ${index + 1}`}</strong>
        <div className="row" style={{ gap: 4 }}>
          <button className="btn btn-sm btn-ghost btn-icon" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)}><Icon name="chevron-up" size={15} /></button>
          <button className="btn btn-sm btn-ghost btn-icon" aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(1)}><Icon name="chevron-down" size={15} /></button>
          <button className="btn btn-sm btn-ghost btn-icon" aria-label="Duplicate" onClick={onDup}><Icon name="copy" size={15} /></button>
          <button className="btn btn-sm btn-ghost btn-icon btn-danger" aria-label="Delete" onClick={onRemove}><Icon name="trash" size={15} /></button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 14 }}>
        <div>
          <div style={{ aspectRatio: '16/9', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
            {p.image ? <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="faint" style={{ fontSize: 12 }}>No image</span>}
          </div>
          <div className="row" style={{ gap: 6, marginTop: 6 }}>
            <button className="btn btn-sm" onClick={() => fileRef.current?.click()}><Icon name="upload" size={13} /> Image</button>
            {p.image && <button className="btn btn-sm btn-ghost" onClick={() => onPatch({ image: '' })}>Remove</button>}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImage(f); e.target.value = ''; }} />
          </div>
          {imgErr && <div className="sev-error" style={{ fontSize: 12, marginTop: 4 }}>{imgErr}</div>}
        </div>
        <div>
          <div className="entry-grid">
            <div className="field"><label>Title</label><input className="input" value={p.title} onChange={(e) => onPatch({ title: e.target.value })} /></div>
            <div className="field"><label>Role</label><input className="input" value={p.role} onChange={(e) => onPatch({ role: e.target.value })} /></div>
          </div>
          <div className="field"><label>Summary (one line)</label><input className="input" value={p.summary} onChange={(e) => onPatch({ summary: e.target.value })} /></div>
          <div className="field"><label>Description</label><textarea className="textarea" value={p.description} onChange={(e) => onPatch({ description: e.target.value })} /></div>
          <Tags label="Tech / tools" value={p.tech} onChange={(tech) => onPatch({ tech })} />
          <div className="entry-grid">
            <div className="field"><label>Link</label><input className="input" value={p.link} onChange={(e) => onPatch({ link: e.target.value })} /></div>
            <div className="field"><label>Repo</label><input className="input" value={p.repo} onChange={(e) => onPatch({ repo: e.target.value })} /></div>
            <div className="field"><label>Demo</label><input className="input" value={p.demo} onChange={(e) => onPatch({ demo: e.target.value })} /></div>
            <div className="field"><label>Date</label><input className="input" value={p.date} onChange={(e) => onPatch({ date: e.target.value })} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PortfolioStudio() {
  const { profile, updateProfile, profileSave } = useStore();
  const projects = profile.portfolioProjects;

  const setProjects = (fn: (list: PortfolioProject[]) => PortfolioProject[]) =>
    updateProfile((p: CareerProfile) => ({ ...p, portfolioProjects: fn(p.portfolioProjects ?? []) }));

  const move = (i: number, dir: -1 | 1) => setProjects((list) => {
    const j = i + dir; if (j < 0 || j >= list.length) return list;
    const copy = list.slice(); [copy[i], copy[j]] = [copy[j], copy[i]]; return copy;
  });

  const saveText = profileSave === 'saving' ? 'Saving…' : profileSave === 'saved' ? 'Saved locally' : '';

  return (
    <div className="content">
      <div className="page-head">
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1>Portfolio Studio</h1>
            <p>Reusable projects and case studies. They live on your Career Profile and feed any website you build.</p>
          </div>
          <span className="save-pill"><span className={`save-dot ${profileSave}`} />{saveText}</span>
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => setProjects((l) => [...l, emptyPortfolioProject()])}>
        <Icon name="plus" size={16} /> Add project
      </button>

      {projects.length === 0 ? (
        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <p className="muted" style={{ marginTop: 0 }}>No portfolio projects yet. Add one above — then feature them on a personal website.</p>
        </div>
      ) : (
        projects.map((p, i) => (
          <ProjectCard
            key={p.id} p={p} index={i} count={projects.length}
            onPatch={(patch) => setProjects((l) => l.map((x) => x.id === p.id ? { ...x, ...patch } : x))}
            onMove={(dir) => move(i, dir)}
            onDup={() => setProjects((l) => { const copy = { ...structuredClone(p), id: uid('pf') }; return [...l.slice(0, i + 1), copy, ...l.slice(i + 1)]; })}
            onRemove={() => setProjects((l) => l.filter((x) => x.id !== p.id))}
          />
        ))
      )}
    </div>
  );
}
