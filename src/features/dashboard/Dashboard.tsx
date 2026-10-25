import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../state/store';
import { TEMPLATES } from '../resume-studio/templates/registry';
import { newResumeProject, contentFromProfile } from '../../core/models/factory';
import { sampleProfile, sampleResume } from '../../core/sampleData';
import * as dbApi from '../../core/storage/db';
import { buildBackup, parseBackup, download, safeFilename } from '../../services/exports/backup';
import { FEATURES } from '../../core/feature-registry/registry';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Confirm } from '../../components/ui/Confirm';
import { Icon } from '../../components/ui/Icon';
import type { ProjectEnvelope } from '../../core/models/types';

function relTime(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function Dashboard() {
  const { projects, profile, refreshProjects, saveProjectRecord, deleteProjectRecord, storageOk } = useStore();
  const navigate = useNavigate();
  const [pickOpen, setPickOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasProfile = profile.fullName.trim().length > 0;

  const createResume = async (templateId: string) => {
    const proj = newResumeProject({
      title: hasProfile ? `${profile.fullName} — Resume` : 'Untitled resume',
      templateId,
      content: hasProfile ? contentFromProfile(profile) : undefined,
    });
    const def = TEMPLATES.find((t) => t.id === templateId)!.defaults;
    proj.data.design = { ...proj.data.design, accent: def.accent, fontFamily: def.font, headingStyle: def.heading };
    await saveProjectRecord(proj);
    setPickOpen(false);
    navigate(`/resume/${proj.id}`);
  };

  const loadSample = async () => {
    const p = sampleProfile();
    const r = sampleResume(p);
    await dbApi.saveProfile(p);
    await dbApi.saveProject(r);
    await refreshProjects();
    navigate(`/resume/${r.id}`);
  };

  const exportAll = () => {
    const pkg = buildBackup(hasProfile ? profile : null, projects);
    download(safeFilename('career-studio-backup', 'json'), JSON.stringify(pkg, null, 2));
  };

  const onRestoreFile = async (file: File) => {
    const text = await file.text();
    const res = parseBackup(text);
    if (!res.ok || !res.backup) {
      setRestoreMsg(res.error ?? 'Could not read that backup.');
      return;
    }
    await dbApi.replaceAll(res.backup.profile, res.backup.projects);
    await refreshProjects();
    // reload to refresh the in-memory profile from storage
    setRestoreMsg(`Restored ${res.backup.projects.length} project(s).${res.warnings.length ? ' ' + res.warnings.join(' ') : ''} Reloading…`);
    setTimeout(() => window.location.reload(), 900);
  };

  const resumeCount = projects.filter((p) => p.type === 'resume').length;

  return (
    <div className="content">
      <div className="page-head">
        <h1>Your career workspace</h1>
        <p>One profile, many documents — built entirely in your browser. Nothing is uploaded.</p>
      </div>

      {!storageOk && (
        <div className="card" style={{ padding: 14, marginBottom: 16, borderColor: 'var(--warning)' }}>
          <strong className="sev-warning"><Icon name="alert" size={15} /> Local storage is unavailable</strong>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
            You can still create and export documents this session, but they won’t be saved after you close the tab
            (this often happens in private-browsing mode). Export a backup before leaving.
          </p>
        </div>
      )}

      {/* Quick actions */}
      <div className="row-wrap" style={{ marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setPickOpen(true)}><Icon name="plus" size={16} /> New resume</button>
        <button className="btn" onClick={() => navigate('/profile')}><Icon name="user" size={16} /> Edit Career Profile</button>
        <button className="btn" onClick={exportAll} disabled={projects.length === 0 && !hasProfile}><Icon name="download" size={16} /> Back up everything</button>
        <button className="btn" onClick={() => fileRef.current?.click()}><Icon name="upload" size={16} /> Restore backup</button>
        {projects.length === 0 && <button className="btn btn-ghost" onClick={loadSample}>Load sample data</button>}
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onRestoreFile(f); e.target.value = ''; }} />
      </div>

      {restoreMsg && <div className="card" style={{ padding: 12, marginBottom: 16 }}><span className="muted" style={{ fontSize: 13 }}>{restoreMsg}</span></div>}

      {/* Projects */}
      <h2 style={{ fontSize: 18, marginBottom: 10 }}>Resumes {resumeCount > 0 && <span className="faint">({resumeCount})</span>}</h2>
      {projects.length === 0 ? (
        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No projects yet</div>
          <p className="muted" style={{ marginTop: 0 }}>Create your first resume, or load sample data to explore.</p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
            <button className="btn btn-primary" onClick={() => setPickOpen(true)}><Icon name="plus" size={15} /> New resume</button>
            <button className="btn" onClick={loadSample}>Load sample data</button>
          </div>
        </div>
      ) : (
        <div className="grid-cards">
          {projects.map((p: ProjectEnvelope) => (
            <div key={p.id} className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, lineHeight: 1.3 }}>{p.title}</div>
                <span className="badge badge-coming-soon" style={{ textTransform: 'capitalize' }}>{p.type}</span>
              </div>
              <div className="faint" style={{ fontSize: 12.5 }}>
                {'templateId' in (p.data as object) ? `${(p.data as { templateId: string }).templateId} · ` : ''}edited {relTime(p.updatedAt)}
              </div>
              <div className="row" style={{ marginTop: 'auto', gap: 6 }}>
                <button className="btn btn-sm btn-primary" onClick={() => navigate(`/resume/${p.id}`)} disabled={p.type !== 'resume'}>Open</button>
                <button className="btn btn-sm btn-ghost btn-danger" onClick={() => setConfirmDelete(p.id)}><Icon name="trash" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feature availability */}
      <h2 style={{ fontSize: 18, margin: '30px 0 10px' }}>What’s available</h2>
      <p className="muted" style={{ marginTop: 0, fontSize: 13.5 }}>Honest status for every planned capability. Nothing here pretends to work before it does.</p>
      <div className="card" style={{ padding: 6 }}>
        {FEATURES.map((f) => (
          <div key={f.id} className="row" style={{ justifyContent: 'space-between', padding: '9px 12px', borderBottom: '1px solid var(--border)', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</div>
              {f.note && <div className="faint" style={{ fontSize: 12 }}>{f.note}</div>}
            </div>
            <StatusBadge status={f.status} />
          </div>
        ))}
      </div>

      {/* Template picker */}
      {pickOpen && (
        <div role="dialog" aria-modal="true" aria-label="Choose a template" onClick={() => setPickOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 16 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, width: '100%', padding: 20, maxHeight: '86vh', overflow: 'auto' }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <h3>Choose a template</h3>
              <button className="btn btn-sm btn-ghost btn-icon" aria-label="Close" onClick={() => setPickOpen(false)}><Icon name="x" /></button>
            </div>
            {!hasProfile && <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>Tip: fill in your Career Profile first and new resumes start pre-filled. You can also start blank.</p>}
            <div className="tpl-pick" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
              {TEMPLATES.map((t) => (
                <button key={t.id} className="tpl-opt" onClick={() => createResume(t.id)}>
                  <div className="tpl-thumb" style={{ background: t.thumb, height: 84 }} />
                  <strong>{t.name}</strong>
                  <span>{t.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Confirm
        open={confirmDelete !== null}
        title="Delete this project?"
        body="This permanently removes it from local storage. Export a backup first if you might need it."
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) deleteProjectRecord(confirmDelete); setConfirmDelete(null); }}
      />
    </div>
  );
}
