import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { ProjectEnvelope, ResumeContent, ResumeData, ResumeProject } from '../../core/models/types';
import { BUILTIN_SECTIONS } from './sections';
import { useStore } from '../../state/store';
import * as dbApi from '../../core/storage/db';
import { ResumeEditor } from './ResumeEditor';
import { DesignPanel } from './DesignPanel';
import { ResumePreview } from './ResumePreview';
import { Icon } from '../../components/ui/Icon';
import { runResumeChecks, type Finding } from '../../services/quality/checks';
import { resumeToText } from '../../services/exports/text';
import { buildBackup, download, safeFilename } from '../../services/exports/backup';
import { newResumeProject } from '../../core/models/factory';

/** Keep sectionOrder/hiddenSections consistent with the current custom sections. */
function normalize(data: ResumeData): ResumeData {
  const customIds = data.content.customSections.map((s) => s.id);
  const valid = new Set<string>([...BUILTIN_SECTIONS, ...customIds]);
  const order = data.sectionOrder.filter((k) => valid.has(k));
  for (const id of customIds) if (!order.includes(id)) order.push(id);
  for (const b of BUILTIN_SECTIONS) if (!order.includes(b)) order.push(b);
  const hidden = data.hiddenSections.filter((k) => valid.has(k));
  return { ...data, sectionOrder: order, hiddenSections: hidden };
}

type Pane = 'content' | 'preview' | 'design';

export function ResumeStudio() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { profile, refreshProjects } = useStore();

  const [project, setProject] = useState<ResumeProject | null>(null);
  const [missing, setMissing] = useState(false);
  const [save, setSave] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pane, setPane] = useState<Pane>('content');
  const [showChecks, setShowChecks] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Undo / redo history (resume data snapshots).
  const past = useRef<ResumeData[]>([]);
  const future = useRef<ResumeData[]>([]);
  const [, forceRerender] = useState(0);

  // Load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rec = (await dbApi.getProject(id)) as ProjectEnvelope | null;
      if (cancelled) return;
      if (!rec || rec.type !== 'resume') { setMissing(true); return; }
      setProject(rec as ResumeProject);
      past.current = [];
      future.current = [];
    })();
    return () => { cancelled = true; };
  }, [id]);

  const saveTimer = useRef<number | undefined>(undefined);
  const persist = useCallback((next: ResumeProject) => {
    setSave('saving');
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await dbApi.saveProject(next);
        setSave('saved');
        refreshProjects();
      } catch {
        setSave('error');
      }
    }, 600);
  }, [refreshProjects]);

  const commit = useCallback((mutate: (d: ResumeData) => ResumeData, recordHistory = true) => {
    setProject((prev) => {
      if (!prev) return prev;
      if (recordHistory) {
        past.current.push(prev.data);
        if (past.current.length > 80) past.current.shift();
        future.current = [];
      }
      const data = normalize(mutate(prev.data));
      const next: ResumeProject = { ...prev, data, updatedAt: Date.now() };
      persist(next);
      return next;
    });
  }, [persist]);

  const patchContent = useCallback((fn: (c: ResumeContent) => ResumeContent) => {
    commit((d) => ({ ...d, content: fn(d.content) }));
  }, [commit]);

  const patchData = useCallback((fn: (d: ResumeData) => ResumeData) => {
    commit(fn);
  }, [commit]);

  const undo = useCallback(() => {
    if (!project || past.current.length === 0) return;
    future.current.push(project.data);
    const prevData = past.current.pop()!;
    setProject((p) => (p ? { ...p, data: prevData, updatedAt: Date.now() } : p));
    persist({ ...project, data: prevData });
    forceRerender((n) => n + 1);
  }, [project, persist]);

  const redo = useCallback(() => {
    if (!project || future.current.length === 0) return;
    past.current.push(project.data);
    const nextData = future.current.pop()!;
    setProject((p) => (p ? { ...p, data: nextData, updatedAt: Date.now() } : p));
    persist({ ...project, data: nextData });
    forceRerender((n) => n + 1);
  }, [project, persist]);

  // Keyboard shortcuts for undo/redo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const findings: Finding[] = useMemo(() => (project ? runResumeChecks(project.data) : []), [project]);
  const issueCount = findings.filter((f) => f.id !== 'ok').length;

  const setTitle = (title: string) => setProject((p) => {
    if (!p) return p;
    const next = { ...p, title, updatedAt: Date.now() };
    persist(next);
    return next;
  });

  const duplicate = async () => {
    if (!project) return;
    const copy = newResumeProject({ title: `${project.title} (copy)`, templateId: project.data.templateId, content: structuredClone(project.data.content) });
    copy.data = structuredClone({ ...project.data });
    await dbApi.saveProject(copy);
    await refreshProjects();
    navigate(`/resume/${copy.id}`);
  };

  const importFromProfile = () => {
    if (!confirm('Replace this resume’s content with your Career Profile? This affects only this resume.')) return;
    patchContent(() => structuredClone({
      fullName: profile.fullName, title: profile.title, email: profile.email, phone: profile.phone,
      location: profile.location, website: profile.website, links: profile.links, summary: profile.summary,
      experience: profile.experience, education: profile.education, skills: profile.skills,
      projects: profile.projects, certifications: profile.certifications, customSections: profile.customSections,
    }));
  };

  const doPrint = () => { setShowExport(false); setTimeout(() => window.print(), 50); };
  const exportTxt = () => { if (project) download(safeFilename(project.title, 'txt'), resumeToText(project.data), 'text/plain'); setShowExport(false); };
  const exportJson = () => {
    if (!project) return;
    download(safeFilename(project.title, 'json'), JSON.stringify(buildBackup(profile, [project as ProjectEnvelope]), null, 2));
    setShowExport(false);
  };

  if (missing) {
    return (
      <div className="content" style={{ textAlign: 'center', paddingTop: 50 }}>
        <h2>Resume not found</h2>
        <p className="muted">It may have been deleted, or this device has different local data.</p>
        <Link className="btn btn-primary" to="/">Back to dashboard</Link>
      </div>
    );
  }
  if (!project) return <div className="content" style={{ paddingTop: 50, textAlign: 'center' }}><p className="muted">Loading resume…</p></div>;

  const saveText = save === 'saving' ? 'Saving…' : save === 'saved' ? 'Saved locally' : save === 'error' ? 'Save failed' : '';

  return (
    <div>
      {/* Toolbar */}
      <div className="panel-head no-print" style={{ position: 'sticky', top: 53, gap: 10 }}>
        <Link className="btn btn-sm btn-ghost btn-icon" to="/" aria-label="Back to dashboard"><Icon name="home" /></Link>
        <input
          className="input"
          style={{ maxWidth: 320, fontWeight: 600 }}
          value={project.title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Resume title"
        />
        <span className="save-pill"><span className={`save-dot ${save}`} />{saveText}</span>
        <span className="spacer" />
        <button className="btn btn-sm btn-ghost btn-icon" onClick={undo} disabled={past.current.length === 0} aria-label="Undo" title="Undo (Ctrl+Z)"><Icon name="chevron-up" style={{ transform: 'rotate(-90deg)' }} /></button>
        <button className="btn btn-sm btn-ghost btn-icon" onClick={redo} disabled={future.current.length === 0} aria-label="Redo" title="Redo (Ctrl+Shift+Z)"><Icon name="chevron-down" style={{ transform: 'rotate(-90deg)' }} /></button>
        <button className="btn btn-sm" onClick={() => setShowChecks(true)}>
          <Icon name={issueCount ? 'alert' : 'check'} size={15} /> Checks{issueCount ? ` (${issueCount})` : ''}
        </button>
        <button className="btn btn-sm btn-ghost" onClick={duplicate} title="Duplicate as a new version"><Icon name="copy" size={15} /> Duplicate</button>
        <div style={{ position: 'relative' }}>
          <button className="btn btn-sm btn-primary" onClick={() => setShowExport((s) => !s)}><Icon name="download" size={15} /> Export</button>
          {showExport && (
            <div className="card" style={{ position: 'absolute', right: 0, top: '110%', zIndex: 40, padding: 6, minWidth: 220 }} onMouseLeave={() => setShowExport(false)}>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={doPrint}><Icon name="print" size={15} /> Print / Save as PDF</button>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={exportTxt}><Icon name="file" size={15} /> Plain text (.txt)</button>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={exportJson}><Icon name="download" size={15} /> Backup this resume (.json)</button>
              <p className="muted" style={{ fontSize: 11.5, margin: '6px 8px 2px' }}>PDF uses your browser’s “Save as PDF”. Turn OFF headers/footers for a clean page.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile pane tabs */}
      <div className="studio-tabs no-print">
        <button className={pane === 'content' ? 'active' : ''} onClick={() => setPane('content')}>Content</button>
        <button className={pane === 'preview' ? 'active' : ''} onClick={() => setPane('preview')}>Preview</button>
        <button className={pane === 'design' ? 'active' : ''} onClick={() => setPane('design')}>Design</button>
      </div>

      <div className="studio">
        <div className={`studio-panel studio-pane ${pane === 'content' ? 'active' : ''}`}>
          <div className="panel-head no-print">Content
            <span className="spacer" />
            <button className="btn btn-sm btn-ghost" onClick={importFromProfile} title="Pull content from your Career Profile">From Profile</button>
          </div>
          <ResumeEditor content={project.data.content} patch={patchContent} />
        </div>

        <div className={`studio-center studio-pane ${pane === 'preview' ? 'active' : ''}`}>
          <div className="preview-wrap">
            <ResumePreview data={project.data} />
          </div>
        </div>

        <div className={`studio-panel studio-pane ${pane === 'design' ? 'active' : ''}`}>
          <div className="panel-head no-print">Design</div>
          <DesignPanel data={project.data} patchData={patchData} />
        </div>
      </div>

      {/* Checks drawer */}
      {showChecks && (
        <div role="dialog" aria-modal="true" aria-label="Resume checks" className="no-print" onClick={() => setShowChecks(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 90, display: 'flex', justifyContent: 'flex-end' }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: 'min(420px, 100%)', height: '100%', borderRadius: 0, overflow: 'auto' }}>
            <div className="panel-head">Resume checks <span className="spacer" /><button className="btn btn-sm btn-ghost btn-icon" aria-label="Close" onClick={() => setShowChecks(false)}><Icon name="x" /></button></div>
            <div className="panel-pad">
              <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>Deterministic checks run locally. They are guidance only and never a guarantee of any outcome.</p>
              {findings.map((f) => (
                <div key={f.id} className="entry" style={{ display: 'flex', gap: 10 }}>
                  <span className={`sev-${f.severity}`} style={{ marginTop: 1 }}>
                    <Icon name={f.severity === 'error' ? 'alert' : f.severity === 'warning' ? 'alert' : f.id === 'ok' ? 'check' : 'info'} size={17} />
                  </span>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{f.message}</div>
                    {f.hint && <div className="muted" style={{ fontSize: 12.5 }}>{f.hint}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
